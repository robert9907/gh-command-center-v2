import { MASTER_TEMPLATE } from '@/lib/master-template';
/**
 * pageBuilder.ts
 *
 * Headless page generation for the Citation Monitor's "Copy for WordPress"
 * quick action. Runs the same 4-step pipeline as PageGenerationModal (detect →
 * load → generate → validate) without any React UI, then returns the HTML in
 * the exact shape the caller wants:
 *
 *   - 'standalone'  : full <!DOCTYPE html>...</html> document (same as Download)
 *   - 'wp-embed'    : body contents + inlined <style> block + preserved JSON-LD,
 *                     ready to paste into an Elementor Custom HTML widget
 *
 * NOTE: buildPageForQuery() is now async — it calls the WordPress REST API
 * to inject live guide pills. All callers must await it.
 */

import { loadCounty, countyNameToSlug } from './countyLoader';
import { renderTemplate, type CountyData } from './templateEngine';
import { injectContextualLinks } from './contextualLinker';
import { validate } from './validator';
import { extractCounty } from './intentClassifier';
import { AEO_PAGE_TEMPLATE } from './templates/aeoPage';
import type { QueryCandidate } from './seedExpansion';

export type BuildShape = 'standalone' | 'wp-embed';

export interface BuildPageResult {
  ok: boolean;
  html: string;
  county: string;
  slug: string;
  title: string;
  description: string;
  errors: string[];
  warnings: string[];
  failureReason?: string;
}

// ── WordPress REST API guide injection ────────────────────────────────────

const WP_BASE = 'https://generationhealth.me/wp-json/wp/v2';

const LIVE_COUNTY_URLS: Record<string, string> = {
  wake:        'https://generationhealth.me/medicare-agents-in-wake-county-nc/',
  orange:      'https://generationhealth.me/medicare-agents-in-orange-county-nc/',
  durham:      'https://generationhealth.me/medicare-agents-in-durham-county-nc/',
  forsyth:     'https://generationhealth.me/medicare-agents-in-forsyth-county-nc/',
  buncombe:    'https://generationhealth.me/medicare-agents-in-buncombe-county-nc/',
  guilford:    'https://generationhealth.me/medicare-agents-in-guilford-county-nc/',
  mecklenburg: 'https://generationhealth.me/medicare-agents-in-mecklenburg-north-carolina/',
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

const COUNTY_KEYWORD_CLUSTERS: Record<string, string[]> = {
  durham:      ['duke', 'durham'],
  wake:        ['wake', 'raleigh'],
  guilford:    ['guilford', 'greensboro'],
  forsyth:     ['forsyth', 'winston'],
  buncombe:    ['buncombe', 'asheville'],
  mecklenburg: ['mecklenburg', 'charlotte'],
  orange:      ['orange', 'chapel-hill'],
};

const FALLBACK_GUIDES = [
  { url: 'https://generationhealth.me/medicare-enrollment-in-north-carolina-complete-guide-for-2026/', label: 'Medicare Enrollment in NC' },
  { url: 'https://generationhealth.me/how-to-sign-up-for-medicare-parts-a-and-b/', label: 'How to Sign Up for Medicare' },
  { url: 'https://generationhealth.me/medigap-plans-in-north-carolina-plan-g-vs-plan-n/', label: 'Medigap Plan G vs N' },
  { url: 'https://generationhealth.me/how-to-compare-medicare-advantage-plans-in-north-carolina/', label: 'Compare Medicare Advantage Plans' },
  { url: 'https://generationhealth.me/medicare-costs-north-carolina-2026-complete-guide/', label: 'Medicare Costs NC 2026' },
  { url: 'https://generationhealth.me/medicare-special-enrollment-periods-nc/', label: 'Medicare SEP Guide' },
  { url: 'https://generationhealth.me/medicare-late-enrollment-penalties-nc/', label: 'Late Enrollment Penalty Guide' },
  { url: 'https://generationhealth.me/free-medicare-quotes-online/', label: 'Free Medicare Quotes Online' },
];

interface WPPost {
  slug: string;
  title: { rendered: string };
  link: string;
}

async function fetchMedicareFAQPosts(): Promise<WPPost[]> {
  try {
    const catRes = await fetch(`${WP_BASE}/categories?slug=medicare-faq&_fields=id`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!catRes.ok) return [];
    const cats = await catRes.json();
    if (!cats.length) return [];
    const catId: number = cats[0].id;
    const postsRes = await fetch(
      `${WP_BASE}/posts?categories=${catId}&status=publish&per_page=100&_fields=slug,title,link`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!postsRes.ok) return [];
    return await postsRes.json();
  } catch {
    return [];
  }
}

function scorePost(post: WPPost, countySlug: string): number {
  const keywords = COUNTY_KEYWORD_CLUSTERS[countySlug] || [];
  const text = `${post.slug} ${post.title.rendered}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score += 10;
  }
  const generalTerms = ['enrollment', 'costs', 'medigap', 'advantage', 'part-d', 'supplement', 'penalty', 'quotes'];
  for (const term of generalTerms) {
    if (post.slug.includes(term)) score += 1;
  }
  return score;
}

function buildCountyPills(currentCountySlug: string): string {
  return Object.entries(LIVE_COUNTY_URLS)
    .filter(([slug]) => slug !== currentCountySlug)
    .map(([slug, url]) =>
      `<a class="county-pill" href="${url}">${COUNTY_DISPLAY_NAMES[slug]}</a>`
    )
    .join('\n        ');
}

async function injectRelatedGuides(html: string, countySlug: string): Promise<string> {
  let guides: Array<{ url: string; label: string }> = [];

  const posts = await fetchMedicareFAQPosts();
  if (posts.length >= 4) {
    const currentSlug = `medicare-broker-${countySlug}-nc`;
    const eligible = posts.filter(p => p.slug !== currentSlug && p.link);
    const scored = eligible
      .map(p => ({ post: p, score: scorePost(p, countySlug) }))
      .sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, 8).map(s => s.post);
    if (selected.length >= 4) {
      guides = selected.map(p => ({
        url: p.link,
        label: p.title.rendered.replace(/<[^>]+>/g, ''),
      }));
    }
  }

  if (guides.length < 8) {
    guides = FALLBACK_GUIDES;
  }

  let result = html;
  for (let i = 0; i < 8; i++) {
    const guide = guides[i];
    const pill = guide
      ? `<a class="guide-pill" href="${guide.url}">${guide.label}</a>`
      : '';
    result = result.replace(`[RELATED-GUIDE-${i + 1}]`, pill);
  }

  const countyPillsHtml = buildCountyPills(countySlug);
  result = result.replace('[COUNTY-PILLS]', countyPillsHtml);

  return result;
}

// ── Main entry point (now async) ──────────────────────────────────────────

export async function buildPageForQuery(
  query: QueryCandidate,
  shape: BuildShape = 'wp-embed'
): Promise<BuildPageResult> {
  const empty: BuildPageResult = {
    ok: false,
    html: '',
    county: '',
    slug: '',
    title: '',
    description: '',
    errors: [],
    warnings: [],
  };

  // Step 1: Detect county
  const countyName = query.county || extractCounty(query.query);
  if (!countyName) {
    return { ...empty, failureReason: 'No NC county detected in query text' };
  }

  // Step 2: Load county data
  let data: CountyData | null = null;
  try {
    const slug = countyNameToSlug(countyName);
    data = loadCounty(slug);
  } catch {
    // fall through
  }
  if (!data) {
    return {
      ...empty,
      county: countyName,
      failureReason: `County data not found for ${countyName}`,
    };
  }

  // Step 3: Render + inject
  let standalone = '';
  try {
    const countySlug = countyNameToSlug(countyName);
    standalone = renderTemplate(AEO_PAGE_TEMPLATE, data);
    standalone = injectContextualLinks(standalone);
    standalone = await injectRelatedGuides(standalone, countySlug);
  } catch (err) {
    return {
      ...empty,
      county: countyName,
      slug: countyNameToSlug(countyName),
      failureReason: `Template rendering failed: ${
        err instanceof Error ? err.message : 'unknown error'
      }`,
    };
  }

  // Step 4: Validate
  let errors: string[] = [];
  let warnings: string[] = [];
  try {
    const result = validate(data, standalone);
    errors = result.issues.filter((i) => i.severity === 'error').map((i) => i.message);
    warnings = result.issues
      .filter((i) => i.severity === 'warning')
      .map((i) => i.message);
  } catch (err) {
    return {
      ...empty,
      county: countyName,
      slug: countyNameToSlug(countyName),
      failureReason: `Validation threw: ${
        err instanceof Error ? err.message : 'unknown error'
      }`,
    };
  }

  if (errors.length > 0) {
    return {
      ...empty,
      county: countyName,
      slug: countyNameToSlug(countyName),
      errors,
      warnings,
      failureReason: `Validation failed with ${errors.length} error(s)`,
    };
  }

  // Extract metadata
  const titleMatch = standalone.match(/<title>([^<]*)<\/title>/i);
  const descMatch = standalone.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
  );
  const title = ((titleMatch && titleMatch[1]) || '').trim();
  const description = ((descMatch && descMatch[1]) || '').trim();

  const html = shape === 'standalone' ? standalone : extractWordPressEmbed(standalone);

  return {
    ok: true,
    html,
    county: countyName,
    slug: countyNameToSlug(countyName),
    title,
    description,
    errors,
    warnings,
  };
}

// ── WordPress embed extractor ─────────────────────────────────────────────

export function extractWordPressEmbed(standaloneHtml: string): string {
  const masterStyleMatch = MASTER_TEMPLATE.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const masterCSS = masterStyleMatch ? `<style>${masterStyleMatch[1]}</style>` : '';
  const styleBlocks: string[] = masterCSS ? [masterCSS] : [];
  const styleRe = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(standaloneHtml)) !== null) {
    styleBlocks.push(m[0]);
  }

  const jsonLdBlocks: string[] = [];
  const jsonLdRe =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
  while ((m = jsonLdRe.exec(standaloneHtml)) !== null) {
    jsonLdBlocks.push(m[0]);
  }

  const bodyMatch = standaloneHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContents = bodyMatch ? bodyMatch[1] : standaloneHtml;

  bodyContents = bodyContents
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
      ''
    );

  const parts = [
    '<!-- Begin AEO 3.0 page (WordPress embed variant) -->',
    ...styleBlocks,
    bodyContents.trim(),
    '<!-- End AEO 3.0 page -->',
  ];

  return parts.join('\n');
}
