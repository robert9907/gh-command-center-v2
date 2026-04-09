'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PageGenerationModal.tsx
// ═══════════════════════════════════════════════════════════════════════════
// 4-step page generation pipeline:
//   1. Detect county from query (or manual NC county picker)
//   2. Load county data from COUNTY_DATA
//   3. Render AEO page template via renderTemplate()
//   4. Validate output against 11-rule validator
//
// After step 3: injectRelatedGuides() calls WordPress REST API to fetch
// confirmed live posts from the Medicare FAQ category, selects 8 relevant
// guides per county, and injects them into [RELATED-GUIDE-N] placeholders.
// Also builds [COUNTY-PILLS] from confirmed live county pages.
//
// On successful generation, calls onGenerated(updatedQuery) AND pushes an
// entry into the AEO Pipeline tracker via useAppState.addToPipeline().
// ═══════════════════════════════════════════════════════════════════════════

import {
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { X, Copy, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { QueryCandidate } from '@/lib/seedExpansion';
import { loadCounty, getCountyList, countyNameToSlug } from '@/lib/countyLoader';
import { renderTemplate, type CountyData } from '@/lib/templateEngine';
import { injectContextualLinks } from '@/lib/contextualLinker';
import { validate } from '@/lib/validator';
import { extractCounty } from '@/lib/intentClassifier';
import { AEO_PAGE_TEMPLATE } from '@/lib/templates/aeoPage';
import { useAppState, type AeoPipelineEntry } from '@/lib/AppState';

// ── WordPress REST API config ─────────────────────────────────────────────

const WP_BASE = 'https://generationhealth.me/wp-json/wp/v2';

// Confirmed live county pages — used to build [COUNTY-PILLS]
// Key = county slug, Value = exact live URL
const LIVE_COUNTY_URLS: Record<string, string> = {
  wake:         'https://generationhealth.me/medicare-agents-in-wake-county-nc/',
  orange:       'https://generationhealth.me/medicare-agents-in-orange-county-nc/',
  durham:       'https://generationhealth.me/medicare-agents-in-durham-county-nc/',
  forsyth:      'https://generationhealth.me/medicare-agents-in-forsyth-county-nc/',
  buncombe:     'https://generationhealth.me/medicare-agents-in-buncombe-county-nc/',
  guilford:     'https://generationhealth.me/medicare-agents-in-guilford-county-nc/',
  mecklenburg:  'https://generationhealth.me/medicare-agents-in-mecklenburg-north-carolina/',
};

const COUNTY_DISPLAY_NAMES: Record<string, string> = {
  wake:        'Wake',
  orange:      'Orange',
  durham:      'Durham',
  forsyth:     'Forsyth',
  buncombe:    'Buncombe',
  guilford:    'Guilford',
  mecklenburg: 'Mecklenburg',
};

// Keyword clusters for county-aware guide selection.
// When generating a page for a county in a cluster, posts matching those
// keywords get prioritized in the guide pills.
const COUNTY_KEYWORD_CLUSTERS: Record<string, string[]> = {
  durham:      ['duke', 'durham'],
  wake:        ['wake', 'raleigh'],
  guilford:    ['guilford', 'greensboro'],
  forsyth:     ['forsyth', 'winston'],
  buncombe:    ['buncombe', 'asheville'],
  mecklenburg: ['mecklenburg', 'charlotte'],
  orange:      ['orange', 'chapel-hill'],
};

// ── WordPress API helpers ─────────────────────────────────────────────────

interface WPPost {
  slug: string;
  title: { rendered: string };
  link: string;
  categories: number[];
}

/**
 * Fetch all published posts from the Medicare FAQ category.
 * WordPress REST API is public for published content — no auth needed.
 * Returns empty array on any network failure so generation never blocks.
 */
async function fetchMedicareFAQPosts(): Promise<WPPost[]> {
  try {
    // First get the Medicare FAQ category ID
    const catRes = await fetch(`${WP_BASE}/categories?slug=medicare-faq&_fields=id`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!catRes.ok) return [];
    const cats = await catRes.json();
    if (!cats.length) return [];
    const catId: number = cats[0].id;

    // Fetch up to 100 published posts in that category
    const postsRes = await fetch(
      `${WP_BASE}/posts?categories=${catId}&status=publish&per_page=100&_fields=slug,title,link,categories`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!postsRes.ok) return [];
    return await postsRes.json();
  } catch {
    return [];
  }
}

/**
 * Score a post's relevance for a given county.
 * Posts whose slug/title contains county keywords score higher.
 */
function scorePost(post: WPPost, countySlug: string): number {
  const keywords = COUNTY_KEYWORD_CLUSTERS[countySlug] || [];
  const text = `${post.slug} ${post.title.rendered}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score += 10;
  }
  // Prefer general Medicare education content as backfill
  const generalTerms = ['enrollment', 'costs', 'medigap', 'advantage', 'part-d', 'supplement', 'penalty', 'quotes'];
  for (const term of generalTerms) {
    if (post.slug.includes(term)) score += 1;
  }
  return score;
}

/**
 * Select the best 8 guide posts for a county from the full post list.
 * Prioritizes county-specific posts, then fills with high-value general content.
 * Excludes the current page's own slug to avoid self-linking.
 */
function selectGuides(posts: WPPost[], countySlug: string): WPPost[] {
  const currentSlug = `medicare-broker-${countySlug}-nc`;
  const eligible = posts.filter(p => p.slug !== currentSlug && p.link);
  const scored = eligible
    .map(p => ({ post: p, score: scorePost(p, countySlug) }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map(s => s.post);
}

/**
 * Build the [COUNTY-PILLS] HTML — links for confirmed live counties,
 * excluding the current county (no self-link).
 */
function buildCountyPills(currentCountySlug: string): string {
  return Object.entries(LIVE_COUNTY_URLS)
    .filter(([slug]) => slug !== currentCountySlug)
    .map(([slug, url]) =>
      `<a class="county-pill" href="${url}">${COUNTY_DISPLAY_NAMES[slug]}</a>`
    )
    .join('\n        ');
}

/**
 * Main injection function. Replaces [RELATED-GUIDE-N] and [COUNTY-PILLS]
 * placeholders with live WordPress content.
 * Falls back to hardcoded confirmed URLs if the API call fails.
 */
async function injectRelatedGuides(html: string, countySlug: string): Promise<string> {
  const FALLBACK_GUIDES = [
    { url: 'https://generationhealth.me/medicare-enrollment-in-north-carolina-complete-guide-for-2026/', label: 'Medicare Enrollment in NC' },
    { url: 'https://generationhealth.me/how-to-sign-up-for-medicare-parts-a-and-b/', label: 'How to Sign Up for Medicare' },
    { url: 'https://generationhealth.me/medigap-plans-in-north-carolina-plan-g-vs-plan-n/', label: 'Medigap Plan G vs N' },
    { url: 'https://generationhealth.me/how-to-compare-medicare-advantage-plans-in-north-carolina/', label: 'Compare Medicare Advantage Plans' },
    { url: 'https://generationhealth.me/medicare-costs-north-carolina-2026-complete-guide/', label: 'Medicare Costs NC 2026' },
    { url: 'https://generationhealth.me/free-medicare-quotes-online/', label: 'Free Medicare Quotes Online' },
  ];

  let guides: Array<{ url: string; label: string }> = [];

  // Try WordPress API first
  const posts = await fetchMedicareFAQPosts();
  if (posts.length >= 4) {
    const selected = selectGuides(posts, countySlug);
    if (selected.length >= 4) {
      guides = selected.map(p => ({
        url: p.link,
        label: p.title.rendered.replace(/<[^>]+>/g, ''),
      }));
    }
  }

  // Fall back to hardcoded list if API returned too few results
  if (guides.length < 8) {
    guides = FALLBACK_GUIDES;
  }

  // Replace [RELATED-GUIDE-N] placeholders
  let result = html;
  for (let i = 0; i < 8; i++) {
    const guide = guides[i];
    const pill = guide
      ? `<a class="guide-pill" href="${guide.url}">${guide.label}</a>`
      : '';
    result = result.replace(`[RELATED-GUIDE-${i + 1}]`, pill);
  }

  // Replace [COUNTY-PILLS]
  const countyPillsHtml = buildCountyPills(countySlug);
  result = result.replace('[COUNTY-PILLS]', countyPillsHtml);

  return result;
}

// ── Inline style tables ───────────────────────────────────────────────────

type StepState = 'pending' | 'running' | 'done' | 'error';

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  background: '#0071e3',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 150ms',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 14px',
  background: 'rgba(255,255,255,0.06)',
  color: '#e5e7eb',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 150ms',
};

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 10px',
  background: '#111',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  fontSize: 13,
};

// ── Step helper components ─────────────────────────────────────────────────

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') return <CheckCircle size={16} style={{ color: '#4ade80' }} />;
  if (state === 'error') return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
  if (state === 'running')
    return <Loader2 size={16} className="gh-spin" style={{ color: '#60a5fa' }} />;
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: '2px solid #4b5563',
      }}
    />
  );
}

function StepCard({
  title,
  state,
  content,
}: {
  title: string;
  state: StepState;
  content: ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 10,
        padding: 14,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${
          state === 'error'
            ? 'rgba(239,68,68,0.3)'
            : state === 'done'
            ? 'rgba(74,222,128,0.2)'
            : 'rgba(255,255,255,0.08)'
        }`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          fontWeight: 700,
          color: '#9ca3af',
          letterSpacing: 0.3,
          marginBottom: 8,
        }}
      >
        <StepIcon state={state} />
        {title.toUpperCase()}
      </div>
      <div style={{ fontSize: 13, color: '#e5e7eb', paddingLeft: 24 }}>{content}</div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  limit,
}: {
  label: string;
  value: string;
  limit?: number;
}) {
  const len = (value || '').length;
  const color = !limit
    ? '#9ca3af'
    : len === 0
    ? '#ef4444'
    : len > limit
    ? '#ef4444'
    : len > limit * 0.9
    ? '#fbbf24'
    : '#4ade80';
  return (
    <div style={{ marginBottom: 8, fontSize: 12 }}>
      <div style={{ color: '#6b7280', marginBottom: 2 }}>
        {label}{' '}
        {limit && (
          <span style={{ color }}>
            ({len}/{limit})
          </span>
        )}
      </div>
      <div style={{ color: '#e5e7eb', wordBreak: 'break-word' }}>
        {value || <em style={{ color: '#4b5563' }}>—</em>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export interface PageGenerationModalProps {
  query: QueryCandidate;
  onClose: () => void;
  onGenerated?: (updated: QueryCandidate) => void;
}

interface ValidationState {
  errors: string[];
  warnings: string[];
}

export default function PageGenerationModal({
  query,
  onClose,
  onGenerated,
}: PageGenerationModalProps) {
  const { addToPipeline } = useAppState();

  const [detectStep, setDetectStep] = useState<StepState>('pending');
  const [loadStep, setLoadStep] = useState<StepState>('pending');
  const [generateStep, setGenerateStep] = useState<StepState>('pending');
  const [validateStep, setValidateStep] = useState<StepState>('pending');
  const [detectedCounty, setDetectedCounty] = useState<string | null>(null);
  const [manualCounty, setManualCounty] = useState('');
  const [countyData, setCountyData] = useState<CountyData | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [validation, setValidation] = useState<ValidationState>({ errors: [], warnings: [] });
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState('');
  const [guideCount, setGuideCount] = useState<number>(0);

  const countyList = useMemo(() => {
    try { return getCountyList(); } catch { return []; }
  }, []);

  const activeCounty = detectedCounty || manualCounty;

  const runPipeline = async (countyName: string) => {
    setErrorMsg('');

    // Step 2: Load county data
    setLoadStep('running');
    let data: CountyData | null = null;
    try {
      const slug = countyNameToSlug(countyName);
      data = loadCounty(slug);
      if (!data) throw new Error('County data not found');
      setCountyData(data);
      setLoadStep('done');
    } catch {
      setLoadStep('error');
      setErrorMsg(`County data not found for ${countyName}.`);
      return;
    }

    // Step 3: Generate + inject
    setGenerateStep('running');
    let html = '';
    try {
      const countySlug = countyNameToSlug(countyName);

      // Render template variables
      html = renderTemplate(AEO_PAGE_TEMPLATE, data);

      // Inject contextual internal links
      html = injectContextualLinks(html);

      // Inject live WordPress guides + county pills
      html = await injectRelatedGuides(html, countySlug);

      // Count how many guide pills were injected for UI feedback
      const guideMatches = html.match(/class="guide-pill"/g);
      setGuideCount(guideMatches ? guideMatches.length : 0);

      setGeneratedHtml(html);
      setGenerateStep('done');
    } catch (err) {
      setGenerateStep('error');
      setErrorMsg(
        `Generation failed: ${(err instanceof Error && err.message) || 'Unknown error'}`
      );
      return;
    }

    // Step 4: Validate
    setValidateStep('running');
    try {
      const result = validate(data, html);
      setValidation({
        errors: result.issues.filter((i) => i.severity === 'error').map((i) => i.message),
        warnings: result.issues
          .filter((i) => i.severity === 'warning')
          .map((i) => i.message),
      });
      setValidateStep('done');
    } catch (err) {
      setValidateStep('error');
      setErrorMsg(
        `Validation failed: ${(err instanceof Error && err.message) || 'Unknown error'}`
      );
    }
  };

  useEffect(() => {
    setDetectStep('running');
    try {
      const c = query.county || extractCounty(query.query);
      if (c) {
        setDetectedCounty(c);
        setDetectStep('done');
        runPipeline(c);
      } else {
        setDetectStep('error');
        setErrorMsg('No county detected in query. Please select a NC county manually below.');
      }
    } catch (err) {
      setDetectStep('error');
      setErrorMsg(
        `Detection failed: ${(err instanceof Error && err.message) || 'Unknown error'}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleManualCountySubmit = () => {
    if (!manualCounty) return;
    setDetectedCounty(manualCounty);
    setDetectStep('done');
    setLoadStep('pending');
    setGenerateStep('pending');
    setValidateStep('pending');
    setErrorMsg('');
    runPipeline(manualCounty);
  };

  const metadata = useMemo(() => {
    if (!generatedHtml) return null;
    const titleMatch = generatedHtml.match(/<title>([^<]*)<\/title>/i);
    const h1Match = generatedHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const descMatch = generatedHtml.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
    );
    return {
      title: ((titleMatch && titleMatch[1]) || '').trim(),
      h1: ((h1Match && h1Match[1]) || '').replace(/<[^>]+>/g, '').trim(),
      description: ((descMatch && descMatch[1]) || '').trim(),
      length: generatedHtml.length,
    };
  }, [generatedHtml]);

  const canDownload =
    validateStep === 'done' && validation.errors.length === 0 && generatedHtml.length > 0;

  const pushToAeoPipeline = (html: string, county: string) => {
    const slug = countyNameToSlug(county);
    const title = metadata?.title || `Medicare Broker ${county} NC`;
    const entry: AeoPipelineEntry = {
      id: `aeo3-${query.id}-${Date.now()}`,
      queryId: query.id,
      query: query.query,
      title,
      slug: `medicare-broker-${slug}-nc`,
      html,
    };
    addToPipeline(entry);
  };

  const handleDownload = () => {
    if (!canDownload || !activeCounty) return;
    const slug = countyNameToSlug(activeCounty);
    const filename = `medicare-broker-${slug}-nc.html`;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    pushToAeoPipeline(generatedHtml, activeCounty);
    if (onGenerated) {
      onGenerated({
        ...query,
        county: activeCounty,
        ...({ pipelineStatus: 'built', lastBuilt: new Date().toISOString() } as object),
      } as QueryCandidate);
    }
    setToast('Downloaded — pipeline status: BUILT');
    setTimeout(() => setToast(''), 2000);
  };

  const handleCopy = async () => {
    if (!canDownload || !activeCounty) return;
    try {
      await navigator.clipboard.writeText(generatedHtml);
      setToast('HTML copied to clipboard!');
      setTimeout(() => setToast(''), 2000);
      pushToAeoPipeline(generatedHtml, activeCounty);
      if (onGenerated) {
        onGenerated({
          ...query,
          county: activeCounty,
          ...({ pipelineStatus: 'built', lastBuilt: new Date().toISOString() } as object),
        } as QueryCandidate);
      }
    } catch {
      setToast('Copy failed — browser blocked clipboard');
      setTimeout(() => setToast(''), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#1f1f1f',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Generate Page for Query</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 22 }}>
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(0,113,227,0.08)',
              border: '1px solid rgba(0,113,227,0.2)',
              borderRadius: 8,
              fontSize: 13,
              color: '#cbd5e1',
              marginBottom: 16,
            }}
          >
            <span style={{ color: '#6b7280', marginRight: 8 }}>Query:</span>
            &ldquo;{query.query}&rdquo;
          </div>

          <StepCard
            title="Step 1: County Detection"
            state={detectStep}
            content={
              detectStep === 'done' && detectedCounty ? (
                <span>Detected: <strong>{detectedCounty} County</strong></span>
              ) : detectStep === 'error' ? (
                <div>
                  <div style={{ marginBottom: 10, color: '#fca5a5' }}>
                    No county detected. Select manually:
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={manualCounty}
                      onChange={(e) => setManualCounty(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">Choose NC county…</option>
                      {countyList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleManualCountySubmit}
                      disabled={!manualCounty}
                      style={{
                        ...primaryBtnStyle,
                        opacity: manualCounty ? 1 : 0.4,
                        cursor: manualCounty ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                <span style={{ color: '#9ca3af' }}>Detecting county…</span>
              )
            }
          />

          <StepCard
            title="Step 2: County Data"
            state={loadStep}
            content={
              loadStep === 'done' && countyData ? (
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                  <div>Loaded: <strong>{countyData.county} County</strong></div>
                  {countyData.health_system && (
                    <div style={{ color: '#9ca3af', marginTop: 2 }}>
                      Health System: {countyData.health_system}
                    </div>
                  )}
                  {countyData.hospitals && countyData.hospitals.length > 0 && (
                    <div style={{ color: '#9ca3af' }}>
                      Hospitals: {countyData.hospitals.length} found
                    </div>
                  )}
                </div>
              ) : loadStep === 'running' ? (
                <span style={{ color: '#9ca3af' }}>Loading county data…</span>
              ) : loadStep === 'error' ? (
                <span style={{ color: '#fca5a5' }}>{errorMsg || 'Load failed'}</span>
              ) : (
                <span style={{ color: '#6b7280' }}>Waiting…</span>
              )
            }
          />

          <StepCard
            title="Step 3: Generate Page"
            state={generateStep}
            content={
              generateStep === 'done' ? (
                <div>
                  <div>
                    Page generated (<strong>{generatedHtml.length.toLocaleString()}</strong> characters)
                  </div>
                  {guideCount > 0 && (
                    <div style={{ color: '#4ade80', marginTop: 4, fontSize: 12 }}>
                      ✓ {guideCount} live guide{guideCount !== 1 ? 's' : ''} injected from WordPress
                    </div>
                  )}
                </div>
              ) : generateStep === 'running' ? (
                <span style={{ color: '#9ca3af' }}>Generating HTML + fetching live guides…</span>
              ) : generateStep === 'error' ? (
                <span style={{ color: '#fca5a5' }}>{errorMsg || 'Generation failed'}</span>
              ) : (
                <span style={{ color: '#6b7280' }}>Waiting…</span>
              )
            }
          />

          <StepCard
            title="Step 4: Validation"
            state={validateStep}
            content={
              validateStep === 'done' ? (
                <div style={{ fontSize: 13 }}>
                  <div style={{ color: '#cbd5e1', marginBottom: 8 }}>
                    {validation.errors.length === 0 ? '✓' : '✗'} Validation{' '}
                    {validation.errors.length === 0 ? 'passed' : 'failed'} (
                    <span style={{ color: validation.errors.length ? '#fca5a5' : '#4ade80' }}>
                      {validation.errors.length} errors
                    </span>
                    ,{' '}
                    <span style={{ color: validation.warnings.length ? '#fbbf24' : '#9ca3af' }}>
                      {validation.warnings.length} warnings
                    </span>
                    )
                  </div>
                  {validation.errors.map((e, i) => (
                    <div key={i} style={{ color: '#fca5a5', fontSize: 12, marginTop: 2 }}>✗ {e}</div>
                  ))}
                  {validation.warnings.map((w, i) => (
                    <div key={i} style={{ color: '#fbbf24', fontSize: 12, marginTop: 2 }}>⚠ {w}</div>
                  ))}
                </div>
              ) : validateStep === 'running' ? (
                <span style={{ color: '#9ca3af' }}>Validating…</span>
              ) : (
                <span style={{ color: '#6b7280' }}>Waiting…</span>
              )
            }
          />

          {metadata && validateStep === 'done' && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, marginBottom: 10 }}>
                METADATA PREVIEW
              </div>
              <MetaRow label="Title" value={metadata.title} limit={60} />
              <MetaRow label="H1" value={metadata.h1} />
              <MetaRow label="Meta Description" value={metadata.description} limit={160} />
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '14px 22px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.15)',
          }}
        >
          {toast && (
            <div style={{ marginRight: 'auto', color: '#4ade80', fontSize: 13 }}>{toast}</div>
          )}
          <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          <button
            onClick={handleCopy}
            disabled={!canDownload}
            style={{ ...secondaryBtnStyle, opacity: canDownload ? 1 : 0.4, cursor: canDownload ? 'pointer' : 'not-allowed' }}
          >
            <Copy size={14} style={{ marginRight: 6 }} />
            Copy to Clipboard
          </button>
          <button
            onClick={handleDownload}
            disabled={!canDownload}
            style={{ ...primaryBtnStyle, opacity: canDownload ? 1 : 0.4, cursor: canDownload ? 'pointer' : 'not-allowed' }}
          >
            <Download size={14} style={{ marginRight: 6 }} />
            Download HTML
          </button>
        </div>
      </div>
    </div>
  );
}
