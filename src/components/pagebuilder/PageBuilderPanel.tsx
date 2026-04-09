'use client';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Check, X, Zap, Copy, ChevronDown, Loader2, Play, RefreshCw, Upload } from 'lucide-react';
import { ZONES, MEDICARE_CARDS, ACA_CARDS, NEPQ_CARDS } from '@/data/pagebuilder';
import { scan67, type ScanResult } from '@/lib/scan67';
import { AI_SYSTEM_PROMPT } from '@/lib/ai-prompt-sys';
import { buildFullPagePrompt } from '@/lib/ai-prompt-build';
import { AI_PROMPTS } from '@/lib/ai-prompts';
import { TEMPLATE_PLACEHOLDERS } from '@/lib/master-template';
import { clusters } from '@/data/clusters';
import { getFromStorage, saveToStorage } from '@/lib/utils';

type PageType = 'medicare' | 'aca' | 'broker' | 'dual';
type Mode = 'build' | 'fix' | 'scan' | 'cards';
type NepqTab = 'medicare' | 'aca' | 'nepq';

const LS_API_KEY = 'gh-cc-pb-apikey';
const LS_SAVED_HTML = 'gh-cc-saved-html';
const LS_SCORES = 'gh-cc-pb-scores';
const CAT_ORDER = ['AEO', 'SEO', 'E-E-A-T', 'CONTENT', 'VQA', 'CONV', 'COMP', 'COMPL'];

const PREVIEW_HTML = `<div style="font-family:'DM Sans',system-ui,sans-serif;background:#0f2440;min-height:400px">
  <div style="background:#0f2440;padding:8px 14px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:11px;font-weight:600;color:#fff">GenerationHealth.me</span>
    <span style="font-size:10px;color:#4b9cd3;font-weight:500">(828) 761-3326</span>
  </div>
  <div style="background:#1e3a5f;padding:20px 16px;text-align:center">
    <div style="font-size:8px;font-weight:700;color:#ffc72c;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px">NORTH CAROLINA · 2026 · FREE CONSULTATION</div>
    <h1 style="font-size:15px;font-weight:800;color:#fff;margin:0 0 4px;line-height:1.2">Select a page from the left<br><span style="color:#4b9cd3">then click Generate</span></h1>
    <p style="font-size:9px;color:rgba(255,255,255,0.7);margin:0 0 12px">Your generated page will appear here with 8-zone overlays. Select NEPQ cards from the right panel and click a zone to place them.</p>
    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px">
      <div style="background:#fff;color:#1a5fa0;padding:5px 12px;border-radius:20px;font-size:8px;font-weight:700">Talk to Rob</div>
      <div style="background:#4b9cd3;color:#fff;padding:5px 12px;border-radius:20px;font-size:8px;font-weight:700">Compare Plans</div>
    </div>
    <div style="display:flex;gap:10px;justify-content:center;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)">
      <span style="font-size:7px;color:rgba(255,255,255,0.5)">NC License #10447418</span>
      <span style="font-size:7px;color:rgba(255,255,255,0.5)">AHIP Certified</span>
      <span style="font-size:7px;color:rgba(255,255,255,0.5)">★ 5.0 Google</span>
      <span style="font-size:7px;color:rgba(255,255,255,0.5)">$0 Cost</span>
    </div>
  </div>
  <div style="background:#eff6ff;border-left:3px solid #4b9cd3;padding:8px 12px;margin:10px 12px">
    <div style="font-size:7px;font-weight:800;color:#4b9cd3;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">Zone 1 — Quick Answer</div>
    <div style="font-size:9px;color:#1a2332;line-height:1.5">The best Medicare supplement for most NC residents is Medicare Advantage or Medigap Plan G. Part B costs $202.90/month in 2026 with a $283 deductible. Call (828) 761-3326 for a free comparison.</div>
  </div>
  <div style="background:#0f2440;padding:10px 12px">
    <div style="font-size:8px;font-weight:600;color:#fff;text-align:center;margin-bottom:8px">Zone 2 — 2026 Medicare Figures</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px">
      <div style="background:rgba(255,255,255,0.07);border-radius:5px;padding:5px;text-align:center"><div style="font-size:6px;font-weight:700;color:#4b9cd3;text-transform:uppercase;margin-bottom:2px">Part B</div><div style="font-size:11px;font-weight:800;color:#fff">$202.90</div><div style="font-size:6px;color:rgba(255,255,255,0.4)">Monthly</div></div>
      <div style="background:rgba(255,255,255,0.07);border-radius:5px;padding:5px;text-align:center"><div style="font-size:6px;font-weight:700;color:#4b9cd3;text-transform:uppercase;margin-bottom:2px">B Ded.</div><div style="font-size:11px;font-weight:800;color:#fff">$283</div><div style="font-size:6px;color:rgba(255,255,255,0.4)">Annual</div></div>
      <div style="background:rgba(255,255,255,0.07);border-radius:5px;padding:5px;text-align:center"><div style="font-size:6px;font-weight:700;color:#4b9cd3;text-transform:uppercase;margin-bottom:2px">A Ded.</div><div style="font-size:11px;font-weight:800;color:#fff">$1,736</div><div style="font-size:6px;color:rgba(255,255,255,0.4)">Per stay</div></div>
      <div style="background:rgba(255,255,255,0.07);border-radius:5px;padding:5px;text-align:center"><div style="font-size:6px;font-weight:700;color:#4b9cd3;text-transform:uppercase;margin-bottom:2px">Part D</div><div style="font-size:11px;font-weight:800;color:#fff">$2,100</div><div style="font-size:6px;color:rgba(255,255,255,0.4)">OOP cap</div></div>
    </div>
  </div>
  <div style="padding:10px 12px;background:#f9fafb">
    <div style="font-size:9px;font-weight:700;color:#1a2332;margin-bottom:5px">Zone 3 — Content Section</div>
    <div style="font-size:8px;color:#3a4553;line-height:1.5">Every plan on the market was built with a weakness. Medicare Advantage $0 premium plans save money — until you need a specialist outside the network.</div>
  </div>
  <div style="background:#1e3a5f;padding:10px 12px">
    <div style="font-size:9px;font-weight:700;color:#fff;text-align:center;margin-bottom:8px">Zone 4 — CTA 1</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:8px;text-align:center"><div style="font-size:8px;font-weight:600;color:#fff;margin-bottom:4px">Compare Plans</div><div style="background:#4b9cd3;color:#fff;padding:4px;border-radius:4px;font-size:7px;font-weight:600">Compare →</div></div>
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:8px;text-align:center"><div style="font-size:8px;font-weight:600;color:#fff;margin-bottom:4px">Talk to Rob</div><div style="background:rgba(34,197,94,0.2);color:#4ade80;padding:4px;border-radius:4px;font-size:7px;font-weight:600;border:1px solid rgba(34,197,94,0.3)">(828) 761-3326</div></div>
    </div>
  </div>
  <div style="padding:10px 12px">
    <div style="font-size:9px;font-weight:700;color:#1a2332;margin-bottom:6px">Zone 5 — FAQ Section</div>
    <div style="border-bottom:1px solid #f2f2f7;padding:5px 0"><div style="font-size:8px;font-weight:600;color:#1a2332">Does a Medicare broker cost anything?</div><div style="font-size:7px;color:#6e6e73;margin-top:2px">No. Medicare brokers are paid by insurance companies. Free comparisons and enrollment help.</div></div>
    <div style="border-bottom:1px solid #f2f2f7;padding:5px 0"><div style="font-size:8px;font-weight:600;color:#1a2332">What is the Part D OOP cap in 2026?</div><div style="font-size:7px;color:#6e6e73;margin-top:2px">$2,100 under the Inflation Reduction Act.</div></div>
  </div>
  <div style="background:#f5f5f7;border:1px solid #e5e5ea;border-radius:6px;margin:8px 12px;padding:8px">
    <div style="font-size:9px;font-weight:600;color:#1a2332">Zone 6 — Author: Robert Simm, Licensed Medicare Broker</div>
    <div style="font-size:7px;color:#8e8e93;margin-top:2px">NC License #10447418 · AHIP Certified · 12+ Years · 500+ NC Families · (828) 761-3326</div>
  </div>
  <div style="background:#0f2440;padding:10px 12px;text-align:center">
    <div style="font-size:8px;font-weight:700;color:#fff;margin-bottom:6px">Zone 7 — CTA 2</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;padding:6px;text-align:center"><div style="font-size:7px;font-weight:600;color:#fff;margin-bottom:3px">View Plans</div><div style="background:#4b9cd3;color:#fff;padding:3px;border-radius:3px;font-size:6px;font-weight:600">Compare →</div></div>
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:5px;padding:6px;text-align:center"><div style="font-size:7px;font-weight:600;color:#fff;margin-bottom:3px">Call Rob</div><div style="background:rgba(34,197,94,0.2);color:#4ade80;padding:3px;border-radius:3px;font-size:6px;font-weight:600;border:1px solid rgba(34,197,94,0.3)">(828) 761-3326</div></div>
    </div>
  </div>
  <div style="background:#f0f7ff;padding:10px 12px">
    <div style="font-size:8px;font-weight:700;color:#1a2332;margin-bottom:6px">Zone 8 — Medicare Cost Comparison 2026</div>
    <div style="display:flex;gap:5px;align-items:center;margin-bottom:4px"><span style="font-size:8px;color:#6e6e73;width:70px">MA Plan</span><div style="flex:1;height:5px;background:#dbeafe;border-radius:3px"><div style="width:40%;height:100%;background:#4b9cd3;border-radius:3px"></div></div><span style="font-size:8px;font-weight:600;color:#1a5fa0;width:65px;text-align:right">~$3,200/yr</span></div>
    <div style="display:flex;gap:5px;align-items:center;margin-bottom:4px"><span style="font-size:8px;color:#6e6e73;width:70px">Medigap G</span><div style="flex:1;height:5px;background:#dbeafe;border-radius:3px"><div style="width:60%;height:100%;background:#7c3aed;border-radius:3px"></div></div><span style="font-size:8px;font-weight:600;color:#1a5fa0;width:65px;text-align:right">~$2,800/yr</span></div>
    <div style="display:flex;gap:5px;align-items:center"><span style="font-size:8px;color:#6e6e73;width:70px">Wrong Plan</span><div style="flex:1;height:5px;background:#dbeafe;border-radius:3px"><div style="width:95%;height:100%;background:#dc2626;border-radius:3px"></div></div><span style="font-size:8px;font-weight:600;color:#dc2626;width:65px;text-align:right">$9,350+ OOP</span></div>
  </div>
  <div style="background:#0f2440;padding:8px 12px;text-align:center">
    <div style="font-size:6px;color:rgba(255,255,255,0.4);line-height:1.5">We do not offer every plan available in your area. Contact Medicare.gov or 1-800-MEDICARE for all options. Not affiliated with the U.S. government. © 2026 GenerationHealth.me · NC #10447418</div>
  </div>
</div>`;

async function fetchPageHTML(slug: string): Promise<string | null> {
  const urls = [`https://generationhealth.me/${slug}/`, `https://generationhealth.me/${slug}`];
  for (const url of urls) {
    try { const r = await fetch(url); if (r.ok) return await r.text(); } catch { /* try next */ }
  }
  return null;
}

function callClaude(apiKey: string, prompt: string, maxTokens = 8192): Promise<Response> {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
  });
}

const ZONE_OVERLAY_PCTS = [31, 43, 54, 62, 72, 79, 86, 93];

export default function PageBuilderPanel() {
  const [mode, setMode] = useState<Mode>('build');
  const [pageType, setPageType] = useState<PageType>('medicare');
  const [selectedPage, setSelectedPage] = useState<{ name: string; slug: string; cluster: string } | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [apiKey, setApiKey] = useState(() => getFromStorage(LS_API_KEY, ''));
  const [apiPillOpen, setApiPillOpen] = useState(false);
  const [apiDraft, setApiDraft] = useState('');
  const [building, setBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [buildError, setBuildError] = useState<string | null>(null);
  const [scanHtml, setScanHtml] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [fetching, setFetching] = useState(false);
  const [zoneApplied, setZoneApplied] = useState<Record<string, { q: string; a: string; tag: string } | null>>({});
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [nepqTab, setNepqTab] = useState<NepqTab>('medicare');
  const [fixingCheckId, setFixingCheckId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>(() => getFromStorage(LS_SCORES, {}));
  const [copied, setCopied] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) setApiPillOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveApiKey = useCallback((key: string) => { setApiKey(key); saveToStorage(LS_API_KEY, key); }, []);

  const allPages = useMemo(() => {
    const pages: Array<{ name: string; slug: string; cluster: string; status: string }> = [];
    clusters.forEach((c) => c.posts.forEach((p) => {
      if (p.slug) pages.push({ name: p.name, slug: p.slug, cluster: c.name, status: p.status });
    }));
    return pages;
  }, []);

  const plannedPages = useMemo(() => allPages.filter((p) => p.status === 'planned'), [allPages]);
  const livePages = useMemo(() => allPages.filter((p) => p.status === 'done'), [allPages]);
  const queuePages = mode === 'fix' ? livePages : plannedPages;

  const nepqCards = useMemo(() => {
    if (nepqTab === 'aca') return ACA_CARDS;
    if (nepqTab === 'nepq') return NEPQ_CARDS;
    return MEDICARE_CARDS;
  }, [nepqTab]);

  const allCards = useMemo(() => [...MEDICARE_CARDS, ...ACA_CARDS, ...NEPQ_CARDS], []);

  const updateScanResult = useCallback((html: string, slug?: string) => {
    const sr = scan67(html, pageType);
    setScanResult(sr);
    if (slug) {
      const newScores = { ...scores, [slug]: sr.score };
      setScores(newScores);
      saveToStorage(LS_SCORES, newScores);
    }
  }, [pageType, scores]);

  const handleBuildPage = useCallback(async () => {
    if (!apiKey) { setBuildError('Set your Claude API key first'); return; }
    const slug = selectedPage?.slug || customSlug;
    const title = selectedPage?.name || customTitle;
    if (!slug) { setBuildError('Select a page or enter a slug'); return; }
    setBuilding(true); setBuildError(null); setBuildProgress('Building prompt...');
    try {
      const prompt = buildFullPagePrompt(slug, pageType, title || slug.replace(/-/g, ' '));
      setBuildProgress('Calling Claude API (30–60 seconds)...');
      const response = await callClaude(apiKey, prompt, 8192);
      if (!response.ok) { const e = await response.json(); throw new Error(e.error?.message || `API failed: ${response.status}`); }
      setBuildProgress('Processing response...');
      const data = await response.json();
      let result = data.content?.[0]?.text || '';
      result = result.replace(/^```(?:html|json|javascript|js)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
      if (result.startsWith('{') && result.includes('@context')) {
        let bc = 0, ei = 0;
        for (let i = 0; i < result.length; i++) { if (result[i] === '{') bc++; if (result[i] === '}') bc--; if (bc === 0) { ei = i + 1; break; } }
        if (ei > 0) result = `<script type="application/ld+json">${result.substring(0, ei)}<\/script>\n${result.substring(ei).trim()}`;
      }
      setGeneratedHtml(result); setScanHtml(result); setBuildProgress('');
      updateScanResult(result, slug);
      const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {});
      saved[slug] = result; saveToStorage(LS_SAVED_HTML, saved);
    } catch (err) { setBuildError(`Build failed: ${err instanceof Error ? err.message : String(err)}`); }
    setBuilding(false);
  }, [apiKey, selectedPage, customSlug, customTitle, pageType, updateScanResult]);

  const handleFetch = useCallback(async (slug: string) => {
    setFetching(true);
    const html = await fetchPageHTML(slug);
    setFetching(false);
    if (html) {
      setScanHtml(html); setGeneratedHtml(html);
      updateScanResult(html, slug);
      const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {});
      saved[slug] = html; saveToStorage(LS_SAVED_HTML, saved);
    } else { setBuildError('Could not fetch — CORS may be blocking. Paste HTML manually.'); }
  }, [updateScanResult]);

  const loadSaved = useCallback((slug: string) => {
    const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {});
    if (saved[slug]) { setScanHtml(saved[slug]); setGeneratedHtml(saved[slug]); updateScanResult(saved[slug], slug); }
  }, [updateScanResult]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const t = ev.target?.result as string; setScanHtml(t); updateScanResult(t); };
    reader.readAsText(file);
  }, [updateScanResult]);

  const runClaudeAction = useCallback(async (prompt: string, maxTokens = 4096) => {
    setBuilding(true);
    try {
      const resp = await callClaude(apiKey, prompt, maxTokens);
      const data = await resp.json();
      const result = data.content?.[0]?.text || '';
      if (result) {
        setGeneratedHtml(result); setScanHtml(result);
        updateScanResult(result, selectedPage?.slug);
        if (selectedPage?.slug) {
          const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {});
          saved[selectedPage.slug] = result; saveToStorage(LS_SAVED_HTML, saved);
        }
      }
    } catch (e) { setBuildError(e instanceof Error ? e.message : String(e)); }
    setBuilding(false); setBuildProgress('');
  }, [apiKey, selectedPage, updateScanResult]);

  const handleFixCheck = useCallback(async (checkId: string) => {
    if (!apiKey || !scanResult || !scanHtml) return;
    setFixingCheckId(checkId);
    const prompt = AI_PROMPTS.batchfix(selectedPage?.slug || customSlug || '', pageType, scanHtml, scanResult);
    await runClaudeAction(prompt);
    setFixingCheckId(null);
  }, [apiKey, scanResult, scanHtml, selectedPage, customSlug, pageType, runClaudeAction]);

  const handleFixAll = useCallback(async () => {
    if (!apiKey || !scanResult || !scanHtml) return;
    setBuildProgress('Running Fix All...');
    const prompt = AI_PROMPTS.batchfix(selectedPage?.slug || customSlug || '', pageType, scanHtml, scanResult);
    await runClaudeAction(prompt);
  }, [apiKey, scanResult, scanHtml, selectedPage, customSlug, pageType, runClaudeAction]);

  const handleCopyWordPress = useCallback(() => {
    const html = generatedHtml || scanHtml;
    if (!html) return;
    const flattened = html
      .replace(/var\(--gh-blue\)/g, '#0071E3')
      .replace(/var\(--gh-navy\)/g, '#0F2440')
      .replace(/var\(--gh-dark-navy\)/g, '#1E3A5F')
      .replace(/var\(--gh-gold\)/g, '#FFC72C')
      .replace(/var\(--gh-carolina\)/g, '#4B9CD3')
      .replace(/var\(--gh-text\)/g, '#1A2332')
      .replace(/var\(--gh-text-soft\)/g, '#3A4553')
      .replace(/var\(--gh-text-muted\)/g, '#6B7B8D');
    navigator.clipboard.writeText(flattened);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [generatedHtml, scanHtml]);

  const injectZones = useCallback(() => {
    let html = generatedHtml;
    ZONES.filter((z) => zoneApplied[z.id]).sort((a, b) => b.pct - a.pct).forEach((z) => {
      const card = zoneApplied[z.id];
      if (!card) return;
      const block = `<div class="gh-nepq-block" style="padding:28px 32px;background:rgba(13,148,136,0.06);border-left:4px solid #0D9488;margin:32px 0"><p style="font-size:17px;font-weight:700;font-style:italic;color:#1A2332;margin:0 0 12px;line-height:1.6">\u201c${card.q}\u201d</p><p style="font-size:17px;line-height:1.78;color:#3A4553;margin:0">${card.a}</p></div>`;
      const pos = Math.floor(html.length * z.pct);
      const sf = html.indexOf('>', pos);
      if (sf > -1) html = html.slice(0, sf + 1) + '\n' + block + '\n' + html.slice(sf + 1);
    });
    setGeneratedHtml(html);
  }, [generatedHtml, zoneApplied]);

  const scoreBadgeClass = (score?: number) => {
    if (!score) return 'bg-white/[0.06] text-gh-text-faint';
    const pct = Math.round((score / 69) * 100);
    if (pct >= 80) return 'bg-emerald-500/15 text-emerald-400';
    if (pct >= 55) return 'bg-amber-500/15 text-amber-400';
    return 'bg-red-500/15 text-red-400';
  };
  const scoreColor = (pct: number) => pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400';

  const viewfinderHtml = generatedHtml || PREVIEW_HTML;
  const activeSlug = selectedPage?.slug || customSlug || '';
  const appliedZoneCount = Object.values(zoneApplied).filter(Boolean).length;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)', overflow: 'hidden' }}>

      {/* ── TOP BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/[0.07] bg-[#0E0E12] flex-shrink-0">
        <div>
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <span>📄</span> Page Builder
          </h2>
          <p className="text-[10px] text-gh-text-muted mt-0.5">
            Template v5.7.2 · 69-point scanner · {TEMPLATE_PLACEHOLDERS.length} placeholders · Claude fills values
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { id: 'build' as Mode, label: '🚀 Build New' },
            { id: 'fix' as Mode, label: '🔧 Fix Existing' },
            { id: 'scan' as Mode, label: '🔍 Scan HTML' },
            { id: 'cards' as Mode, label: '🃏 NEPQ Cards' },
          ]).map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === m.id ? 'bg-white/[0.12] text-white' : 'bg-white/[0.04] text-gh-text-muted hover:bg-white/[0.06]'}`}>
              {m.label}
            </button>
          ))}

          {/* API Key pill */}
          <div ref={pillRef} className="relative">
            <button onClick={() => { setApiDraft(apiKey); setApiPillOpen(!apiPillOpen); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{ background: apiKey ? 'rgba(13,148,136,0.12)' : 'rgba(255,255,255,0.04)', borderColor: apiKey ? 'rgba(13,148,136,0.35)' : 'rgba(255,255,255,0.1)', color: apiKey ? '#2DD4BF' : '#6B7B8D' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: apiKey ? '#34C759' : '#6B7280' }} />
              API Key
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {apiPillOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 rounded-xl border border-white/[0.12] bg-[#1A1A22] shadow-xl p-4 space-y-3">
                <label className="text-[10px] font-bold text-gh-text-muted uppercase tracking-wider block">Claude API Key</label>
                <input type="password" value={apiDraft} onChange={(e) => setApiDraft(e.target.value)} placeholder="sk-ant-api03-..."
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none"
                  autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { saveApiKey(apiDraft); setApiPillOpen(false); } }} />
                <button onClick={() => { saveApiKey(apiDraft); setApiPillOpen(false); }}
                  className="w-full py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-500">
                  Save &amp; Hide
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PAGE TYPE + COPY FOR WORDPRESS ── */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/[0.07] bg-[#0E0E12] flex-shrink-0 flex-wrap">
        {([
          { id: 'medicare' as PageType, label: 'Medicare', color: '#4B9CD3' },
          { id: 'aca' as PageType, label: 'ACA', color: '#16A34A' },
          { id: 'dual' as PageType, label: 'Dual', color: '#A78BFA' },
          { id: 'broker' as PageType, label: 'Broker', color: '#F97316' },
        ]).map((t) => (
          <button key={t.id} onClick={() => setPageType(t.id)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{ background: pageType === t.id ? `${t.color}25` : 'rgba(255,255,255,0.04)', color: pageType === t.id ? t.color : '#6B7B8D' }}>
            {t.label}
          </button>
        ))}
        <div className="w-px h-5 bg-white/[0.1] mx-1" />
        <button onClick={handleCopyWordPress} disabled={!generatedHtml && !scanHtml}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 ${copied ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-gradient-to-r from-teal-600/80 to-blue-600/80 text-white hover:from-teal-600 hover:to-blue-600'}`}>
          {copied ? <><Check className="w-3 h-3" /> Copied — paste into Elementor</> : <><Copy className="w-3 h-3" /> Copy for WordPress</>}
        </button>
        {buildError && <div className="ml-auto text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1">{buildError}</div>}
      </div>

      {/* ── 3-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* LEFT: Queue */}
        <div className="flex-shrink-0 border-r border-white/[0.07] bg-[#0E0E12] flex flex-col overflow-hidden" style={{ width: '195px' }}>
          <div className="px-3 py-2 text-[9px] font-bold text-gh-text-muted uppercase tracking-widest border-b border-white/[0.05] flex-shrink-0">
            {mode === 'fix' ? `Live Pages (${livePages.length})` : `Planned Pages (${plannedPages.length})`}
          </div>
          <div className="flex-1 overflow-y-auto">
            {queuePages.map((p, i) => {
              const sc = scores[p.slug];
              return (
                <button key={i} onClick={() => {
                  setSelectedPage(p); setCustomTitle(p.name); setCustomSlug(p.slug);
                  setBuildError(null);
                  if (mode === 'fix') loadSaved(p.slug);
                }}
                  className={`w-full text-left px-3 py-2.5 border-b border-white/[0.04] transition-colors ${selectedPage?.slug === p.slug ? 'bg-carolina/[0.12] border-l-2 border-l-carolina pl-2.5' : 'hover:bg-white/[0.03]'}`}>
                  <div className="text-[10px] font-medium text-gh-text-soft leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
                  <div className="text-[9px] text-gh-text-faint mt-0.5 truncate">/{p.slug}</div>
                  <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 ${scoreBadgeClass(sc)}`}>
                    {sc !== undefined ? `${sc}/69` : '—'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER: Viewfinder */}
        <div className="flex-1 flex flex-col bg-[#121216] overflow-hidden min-w-0">

          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#1A2332] flex-shrink-0">
            <div className="flex gap-1.5 flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 bg-white/[0.08] rounded-md px-3 py-1 text-[9px] text-white/40 text-center truncate min-w-0">
              {activeSlug ? `generationhealth.me/${activeSlug}/` : 'generationhealth.me — select a page'}
            </div>
            {mode === 'fix' && selectedPage && (
              <button onClick={() => handleFetch(selectedPage.slug)} disabled={fetching}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-bold disabled:opacity-40">
                {fetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {fetching ? 'Fetching...' : 'Fetch Live'}
              </button>
            )}
            {mode === 'scan' && (
              <label className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-white/[0.08] border border-white/10 text-gh-text-muted text-[9px] font-bold cursor-pointer">
                <Upload className="w-3 h-3" /> Upload
                <input type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
            <button
              onClick={mode === 'scan' ? () => { if (scanHtml.trim()) updateScanResult(scanHtml); } : handleBuildPage}
              disabled={building || fetching || (mode === 'build' && !customSlug && !selectedPage)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-bold disabled:opacity-40 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
              {building ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {building ? buildProgress.slice(0, 18) + '...' : mode === 'scan' ? 'Scan' : '▶ Generate'}
            </button>
          </div>

          {/* Scan/Fix HTML input */}
          {(mode === 'scan' || (mode === 'fix' && selectedPage)) && (
            <div className="px-4 py-2 border-b border-white/[0.07] flex-shrink-0">
              <textarea value={scanHtml} onChange={(e) => setScanHtml(e.target.value)}
                placeholder={mode === 'scan' ? 'Paste page HTML here...' : 'Paste page HTML or use Fetch Live...'}
                className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[10px] text-gh-text-soft font-mono resize-none outline-none"
                style={{ height: '72px' }} />
            </div>
          )}

          {/* Fix mode AI actions */}
          {mode === 'fix' && scanHtml && (
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05] flex-shrink-0 flex-wrap">
              <span className="text-[9px] font-bold text-gh-text-muted uppercase tracking-wider">Actions:</span>
              {[
                { key: 'wordboost', label: '📝 Word Boost' },
                { key: 'update2026', label: '📅 2026 Update' },
              ].map(({ key, label }) => (
                <button key={key} onClick={async () => {
                  setBuildProgress(key);
                  const prompt = AI_PROMPTS[key](selectedPage?.slug || '', pageType, scanHtml);
                  await runClaudeAction(prompt);
                }} disabled={building || !apiKey}
                  className="px-2 py-1 rounded text-[9px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] disabled:opacity-40">
                  {label}
                </button>
              ))}
              {['hero', 'instant', 'faq', 'cta', 'coststrip', 'table', 'schema'].map((section) => (
                <button key={section} onClick={async () => {
                  if (!AI_PROMPTS[section]) return;
                  setBuildProgress(section);
                  const prompt = AI_PROMPTS[section](selectedPage?.slug || customSlug || '', pageType, scanHtml, scanResult);
                  await runClaudeAction(prompt);
                }} disabled={building || !apiKey}
                  className="px-2 py-1 rounded text-[9px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] disabled:opacity-40 capitalize">
                  {section}
                </button>
              ))}
            </div>
          )}

          {/* NEPQ Cards mode — full area */}
          {mode === 'cards' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest mb-3">
                {pageType === 'aca' ? 'ACA' : 'Medicare'} NEPQ Cards + Sequence
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[...MEDICARE_CARDS, ...ACA_CARDS, ...NEPQ_CARDS].map((card) => (
                  <div key={card.id} className="card p-4 space-y-2">
                    <div className="text-[9px] font-extrabold uppercase tracking-widest text-teal-400">{card.tag}</div>
                    <div className="text-[10px] text-gh-text-muted">{card.tagline}</div>
                    <div className="text-sm font-bold text-white leading-snug">{card.q}</div>
                    <div className="text-xs text-gh-text-soft leading-relaxed">{card.a}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Viewfinder + zone overlays */}
          {mode !== 'cards' && (
            <div className="flex-1 overflow-y-auto relative">
              {ZONES.map((zone, idx) => {
                const pct = ZONE_OVERLAY_PCTS[idx];
                const applied = zoneApplied[zone.id];
                return (
                  <div key={zone.id}
                    style={{ position: 'absolute', top: `${pct}%`, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: `${zone.color}20`, cursor: selectedCard ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (!selectedCard) return;
                      const card = allCards.find((c) => c.id === selectedCard);
                      if (card) { setZoneApplied((prev) => ({ ...prev, [zone.id]: { q: card.q, a: card.a, tag: card.tag } })); setSelectedCard(null); }
                    }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: zone.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {zone.id.replace('z', '')}
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 700, color: zone.color, whiteSpace: 'nowrap' }}>
                      {zone.label} — {zone.desc}
                    </span>
                    {applied && <span style={{ fontSize: 7, color: '#2DD4BF', fontWeight: 600 }}>✓ {applied.tag}</span>}
                    <div style={{ flex: 1, height: 1, background: zone.color, opacity: 0.3 }} />
                    {applied && (
                      <button onClick={(e) => { e.stopPropagation(); setZoneApplied((prev) => { const n = { ...prev }; delete n[zone.id]; return n; }); }}
                        style={{ fontSize: 9, color: '#f87171', fontWeight: 700, padding: '0 3px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                    )}
                  </div>
                );
              })}
              <iframe srcDoc={viewfinderHtml} className="w-full" style={{ height: '1600px', border: 'none', display: 'block' }}
                sandbox="allow-scripts" title="Page Preview" />
            </div>
          )}

          {appliedZoneCount > 0 && generatedHtml && mode !== 'cards' && (
            <div className="px-4 py-2 border-t border-white/[0.07] flex-shrink-0">
              <button onClick={injectZones}
                className="w-full py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-500">
                Inject {appliedZoneCount} NEPQ Block{appliedZoneCount > 1 ? 's' : ''} into Page
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Scanner + NEPQ Cards */}
        <div className="flex-shrink-0 border-l border-white/[0.07] bg-[#0E0E12] flex flex-col overflow-hidden" style={{ width: '260px' }}>

          {/* Score header */}
          <div className="px-4 py-3 border-b border-white/[0.07] flex-shrink-0">
            {scanResult ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative w-11 h-11 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke={scanResult.pct >= 80 ? '#4ADE80' : scanResult.pct >= 60 ? '#FFC72C' : '#EF4444'}
                        strokeWidth="3" strokeDasharray={`${scanResult.pct} ${100 - scanResult.pct}`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-extrabold text-white">{scanResult.score}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold ${scoreColor(scanResult.pct)}`}>
                      {scanResult.score} / {scanResult.total} — {scanResult.pct}%
                    </div>
                    <div className="text-[10px] text-gh-text-muted">{scanResult.checks.filter((c) => !c.pass).length} checks failing</div>
                  </div>
                  <button onClick={handleFixAll} disabled={building || !apiKey || !scanHtml}
                    className="flex items-center gap-1 px-2 py-1.5 rounded text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 disabled:opacity-40 flex-shrink-0">
                    <Zap className="w-3 h-3" /> Fix All
                  </button>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${scanResult.pct}%`, background: scanResult.pct >= 80 ? '#4ADE80' : scanResult.pct >= 60 ? '#FFC72C' : '#EF4444' }} />
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <div className="text-xl mb-1">🔍</div>
                <div className="text-[10px] text-gh-text-muted">Generate or scan a page to see score</div>
              </div>
            )}
          </div>

          {/* Scanner check rows */}
          <div className="flex-shrink-0 overflow-y-auto" style={{ maxHeight: '320px' }}>
            {scanResult && CAT_ORDER.map((cat) => {
              const checks = scanResult.checks.filter((c) => c.cat === cat);
              if (!checks.length) return null;
              const passed = checks.filter((c) => c.pass).length;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.04]">
                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: checks[0].catColor }}>{cat}</span>
                    <span className={`text-[10px] font-bold ${passed === checks.length ? 'text-emerald-400' : 'text-white'}`}>{passed}/{checks.length}</span>
                  </div>
                  {checks.map((c) => (
                    <div key={c.id} className={`flex items-start gap-1.5 px-3 py-1.5 border-b border-white/[0.03] ${!c.pass ? 'bg-red-500/[0.03]' : ''}`}>
                      {c.pass
                        ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                        : <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />}
                      <span className={`text-[9px] leading-snug flex-1 ${c.pass ? 'text-gh-text-muted' : 'text-white font-medium'}`}>{c.label}</span>
                      {!c.pass && (
                        <button onClick={() => handleFixCheck(c.id)} disabled={fixingCheckId === c.id || !apiKey || !scanHtml}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 disabled:opacity-40 flex-shrink-0">
                          {fixingCheckId === c.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                          Fix
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="h-px bg-white/[0.07] flex-shrink-0" />

          {/* NEPQ Cards header */}
          <div className="px-3 pt-2.5 pb-1.5 flex-shrink-0">
            <div className="text-[9px] font-bold text-gh-text-muted uppercase tracking-widest mb-2">NEPQ Cards</div>
            <div className="flex gap-1">
              {(['medicare', 'aca', 'nepq'] as NepqTab[]).map((t) => (
                <button key={t} onClick={() => setNepqTab(t)}
                  className={`px-2.5 py-1 rounded text-[8px] font-bold uppercase tracking-wider ${nepqTab === t ? 'bg-carolina/20 text-carolina' : 'bg-white/[0.04] text-gh-text-muted hover:bg-white/[0.06]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pb-2">
            {nepqCards.map((card) => (
              <div key={card.id} onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
                className={`rounded-lg border p-2.5 cursor-pointer transition-all ${selectedCard === card.id ? 'bg-teal-500/10 border-teal-500/40' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                <div className="text-[8px] font-extrabold uppercase tracking-widest text-teal-400 mb-1">{card.tag}</div>
                <div className="text-[10px] font-bold text-white leading-snug mb-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.q}</div>
                <div className="text-[9px] text-gh-text-muted leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.a.slice(0, 90)}...</div>
              </div>
            ))}
          </div>

          <div className="px-3 py-2.5 border-t border-white/[0.07] flex-shrink-0">
            <button disabled={!selectedCard}
              className="w-full py-2 rounded-lg text-[10px] font-bold disabled:opacity-40 bg-teal-600/20 border border-teal-500/30 text-teal-400 hover:bg-teal-600/30">
              {selectedCard ? 'Click a zone overlay on the page →' : 'Select a card above first'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
