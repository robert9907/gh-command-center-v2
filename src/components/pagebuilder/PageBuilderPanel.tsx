'use client';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Check, X, Upload, Zap, Copy, ChevronDown, ChevronRight, Loader2, Download, Play, Eye, RefreshCw } from 'lucide-react';
import { ZONES, MEDICARE_CARDS, ACA_CARDS, NEPQ_CARDS } from '@/data/pagebuilder';
import { scan67, type ScanResult } from '@/lib/scan67';
import { AI_SYSTEM_PROMPT } from '@/lib/ai-prompt-sys';
import { buildFullPagePrompt } from '@/lib/ai-prompt-build';
import { AI_PROMPTS } from '@/lib/ai-prompts';
import { TEMPLATE_PLACEHOLDERS } from '@/lib/master-template';
import { clusters } from '@/data/clusters';
import { getFromStorage, saveToStorage } from '@/lib/utils';
type PageType = 'medicare' | 'aca' | 'broker' | 'dual';
type Mode = 'build' | 'scan' | 'fix' | 'cards';
const LS_API_KEY = 'gh-cc-pb-apikey';
const LS_SAVED_HTML = 'gh-cc-saved-html';
const CAT_ORDER = ['AEO', 'SEO', 'E-E-A-T', 'CONTENT', 'VQA', 'CONV', 'COMP', 'COMPL'];
async function fetchPageHTML(slug: string): Promise<string | null> {
  const urls = [
    `https://generationhealth.me/${slug}/`,
    `https://generationhealth.me/${slug}`,
  ];
  for (const url of urls) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return await resp.text();
    } catch { /* try next */ }
  }
  return null;
}
export default function PageBuilderPanel() {
  const [mode, setMode] = useState<Mode>('build');
  const [pageType, setPageType] = useState<PageType>('medicare');
  const [selectedPage, setSelectedPage] = useState<{ name: string; slug: string; cluster: string } | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [apiKey, setApiKey] = useState(() => getFromStorage(LS_API_KEY, ''));
  const [building, setBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [buildError, setBuildError] = useState<string | null>(null);
  const [scanHtml, setScanHtml] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [zoneApplied, setZoneApplied] = useState<Record<string, { q: string; a: string; tag: string } | null>>({});
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [fixingCheckId, setFixingCheckId] = useState<string | null>(null);

  // ── CHANGE 1: API key pill state ──
  const [apiPillOpen, setApiPillOpen] = useState(false);
  const [apiDraftKey, setApiDraftKey] = useState('');
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setApiPillOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const saveApiKey = useCallback((key: string) => { setApiKey(key); saveToStorage(LS_API_KEY, key); }, []);

  const handleApiPillOpen = useCallback(() => {
    setApiDraftKey(apiKey);
    setApiPillOpen(true);
  }, [apiKey]);

  const handleApiSaveHide = useCallback(() => {
    saveApiKey(apiDraftKey);
    setApiPillOpen(false);
  }, [apiDraftKey, saveApiKey]);

  const allPages = useMemo(() => {
    const pages: Array<{ name: string; slug: string; cluster: string; status: string }> = [];
    clusters.forEach((c) => { c.posts.forEach((p) => { if (p.slug) pages.push({ name: p.name, slug: p.slug, cluster: c.name, status: p.status }); }); });
    return pages;
  }, []);
  const plannedPages = useMemo(() => allPages.filter((p) => p.status === 'planned'), [allPages]);
  const livePages = useMemo(() => allPages.filter((p) => p.status === 'done'), [allPages]);

  const handleBuildPage = useCallback(async () => {
    if (!apiKey) { setBuildError('Add your Claude API key first'); return; }
    const slug = selectedPage?.slug || customSlug;
    const title = selectedPage?.name || customTitle;
    if (!slug) { setBuildError('Enter a slug or select a page'); return; }
    setBuilding(true); setBuildError(null); setBuildProgress('Building prompt...');
    try {
      const prompt = buildFullPagePrompt(slug, pageType, title || slug.replace(/-/g, ' '));
      setBuildProgress('Calling Claude API (30-60 seconds)...');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 8192, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.error?.message || `API failed: ${response.status}`); }
      setBuildProgress('Processing response...');
      const data = await response.json();
      let result = data.content?.[0]?.text || '';
      result = result.replace(/^```(?:html|json|javascript|js)?\n?/gm, '');
      result = result.replace(/\n?```$/gm, '');
      result = result.trim();
      if (result.startsWith('{') && result.includes('@context')) {
        let bc = 0, ei = 0;
        for (let i = 0; i < result.length; i++) { if (result[i] === '{') bc++; if (result[i] === '}') bc--; if (bc === 0) { ei = i + 1; break; } }
        if (ei > 0) result = `<script type="application/ld+json">${result.substring(0, ei)}<\/script>\n${result.substring(ei).trim()}`;
      }
      setGeneratedHtml(result);
      setBuildProgress('');
      const sr = scan67(result, pageType); setScanResult(sr); setScanHtml(result);
      if (slug) { const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {}); saved[slug] = result; saveToStorage(LS_SAVED_HTML, saved); }
    } catch (err) { setBuildError(`Build failed: ${err instanceof Error ? err.message : String(err)}`); }
    setBuilding(false);
  }, [apiKey, selectedPage, customSlug, customTitle, pageType]);

  const handleFetch = useCallback(async (slug: string) => {
    setFetching(true);
    const html = await fetchPageHTML(slug);
    setFetching(false);
    if (html) {
      setScanHtml(html);
      setGeneratedHtml(html);
      setScanResult(scan67(html, pageType));
      const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {});
      saved[slug] = html;
      saveToStorage(LS_SAVED_HTML, saved);
    } else {
      setBuildError('Could not fetch page. CORS may be blocking. Try pasting HTML manually.');
    }
  }, [pageType]);

  const loadSaved = useCallback((slug: string) => {
    const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {});
    if (saved[slug]) {
      setScanHtml(saved[slug]);
      setGeneratedHtml(saved[slug]);
      setScanResult(scan67(saved[slug], pageType));
    }
  }, [pageType]);

  const runScan = useCallback(() => { if (!scanHtml.trim()) return; setScanResult(scan67(scanHtml, pageType)); }, [scanHtml, pageType]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = (ev) => { const t = ev.target?.result as string; setScanHtml(t); setScanResult(scan67(t, pageType)); }; reader.readAsText(file);
  }, [pageType]);

  // ── CHANGE 2: per-check Fix handler using batchfix prompt ──
  const handleFixCheck = useCallback(async (checkId: string) => {
    if (!apiKey || !scanResult || !scanHtml) return;
    setFixingCheckId(checkId);
    try {
      const prompt = AI_PROMPTS.batchfix(selectedPage?.slug || customSlug || '', pageType, scanHtml, scanResult);
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await resp.json();
      const result = data.content?.[0]?.text || '';
      if (result) {
        setGeneratedHtml(result);
        setScanHtml(result);
        setScanResult(scan67(result, pageType));
        if (selectedPage?.slug) {
          const saved = getFromStorage<Record<string, string>>(LS_SAVED_HTML, {});
          saved[selectedPage.slug] = result;
          saveToStorage(LS_SAVED_HTML, saved);
        }
      }
    } catch (e) { setBuildError(e instanceof Error ? e.message : String(e)); }
    setFixingCheckId(null);
  }, [apiKey, scanResult, scanHtml, selectedPage, customSlug, pageType]);

  const groupedChecks = useMemo(() => { if (!scanResult) return {}; const g: Record<string, typeof scanResult.checks> = {}; scanResult.checks.forEach((c) => { if (!g[c.cat]) g[c.cat] = []; g[c.cat].push(c); }); return g; }, [scanResult]);
  const copyHtml = useCallback(() => { navigator.clipboard.writeText(generatedHtml); setCopied(true); setTimeout(() => setCopied(false), 2000); }, [generatedHtml]);
  const downloadHtml = useCallback(() => { const s = selectedPage?.slug || customSlug || 'page'; const b = new Blob([generatedHtml], { type: 'text/html' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${s}.html`; a.click(); URL.revokeObjectURL(u); }, [generatedHtml, selectedPage, customSlug]);
  const copyCard = useCallback((text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedCard(id); setTimeout(() => setCopiedCard(null), 2000); }, []);
  const cards = pageType === 'aca' ? ACA_CARDS : MEDICARE_CARDS;
  const allCards = [...cards, ...NEPQ_CARDS];
  const inputCls = "w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none focus:border-carolina/40";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2"><span>📄</span> Page Builder</h2>
          <p className="text-xs text-gh-text-muted mt-1">Template v5.7.2 · 67-point scanner · {TEMPLATE_PLACEHOLDERS.length} placeholders · Claude fills values</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { id: 'build' as Mode, label: '🚀 Build New' },
            { id: 'fix' as Mode, label: '🔧 Fix Existing' },
            { id: 'scan' as Mode, label: '🔍 Scan HTML' },
            { id: 'cards' as Mode, label: '🃏 NEPQ Cards' },
          ]).map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === m.id ? 'bg-white/[0.12] text-white' : 'bg-white/[0.04] text-gh-text-muted hover:bg-white/[0.06]'}`}>{m.label}</button>
          ))}

          {/* ── CHANGE 1: API Key collapsed pill ── */}
          <div ref={pillRef} className="relative">
            <button
              onClick={apiPillOpen ? () => setApiPillOpen(false) : handleApiPillOpen}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{
                background: apiKey ? 'rgba(13,148,136,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor: apiKey ? 'rgba(13,148,136,0.35)' : 'rgba(255,255,255,0.1)',
                color: apiKey ? '#2DD4BF' : '#6B7B8D',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: apiKey ? '#34C759' : '#6B7280' }} />
              API Key
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {apiPillOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 rounded-xl border border-white/[0.12] bg-[#1A1A22] shadow-xl p-4 space-y-3">
                <label className="text-[10px] font-bold text-gh-text-muted uppercase tracking-wider block">Claude API Key</label>
                <input
                  type="password"
                  value={apiDraftKey}
                  onChange={(e) => setApiDraftKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className={inputCls}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApiSaveHide(); }}
                />
                <button
                  onClick={handleApiSaveHide}
                  className="w-full py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-500 transition-colors"
                >
                  Save &amp; Hide
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page type */}
      <div className="flex gap-2">
        {([{ id: 'medicare' as PageType, label: 'Medicare', color: '#4B9CD3' }, { id: 'aca' as PageType, label: 'ACA', color: '#16A34A' }, { id: 'dual' as PageType, label: 'Dual', color: '#A78BFA' }, { id: 'broker' as PageType, label: 'Broker', color: '#F97316' }]).map((t) => (
          <button key={t.id} onClick={() => setPageType(t.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all" style={{ background: pageType === t.id ? `${t.color}25` : 'rgba(255,255,255,0.04)', color: pageType === t.id ? t.color : '#6B7B8D' }}>{t.label}</button>
        ))}
      </div>

      {/* ═══ BUILD MODE ═══ */}
      {mode === 'build' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-4 space-y-3">
              <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Planned Pages ({plannedPages.length})</div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {plannedPages.map((p, i) => (
                  <button key={i} onClick={() => { setSelectedPage(p); setCustomTitle(p.name); setCustomSlug(p.slug); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedPage?.slug === p.slug ? 'bg-carolina/20 text-carolina' : 'text-gh-text-soft hover:bg-white/[0.04]'}`}>
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-[10px] text-gh-text-faint truncate">/{p.slug} · {p.cluster}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-5 space-y-4">
                <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Page Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">Page Title</label><input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Medicare Quotes Near Me NC" className={inputCls} /></div>
                  <div><label className="text-[10px] font-bold text-gh-text-muted block mb-1">URL Slug</label><input value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} placeholder="medicare-quotes-near-me-nc" className={inputCls} /></div>
                </div>
                <button onClick={handleBuildPage} disabled={building || !customSlug} className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:brightness-110">
                  {building ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{buildProgress}</span> : <span className="flex items-center justify-center gap-2"><Play className="w-4 h-4" />Build Page (Template v5.7.2 + Claude)</span>}
                </button>
                {buildError && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">{buildError}</div>}
              </div>
              <div className="card p-5">
                <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest mb-3">
                  8-Zone Page Layout {selectedCard && <span className="text-teal-400 ml-2">— Click a zone to place card</span>}
                </div>
                <div className="space-y-1.5">
                  {ZONES.map((zone) => {
                    const applied = zoneApplied[zone.id];
                    return (
                      <div key={zone.id}
                        onClick={() => {
                          if (selectedCard) {
                            const card = allCards.find((c) => c.id === selectedCard);
                            if (card) {
                              setZoneApplied((prev) => ({ ...prev, [zone.id]: { q: card.q, a: card.a, tag: card.tag } }));
                              setSelectedCard(null);
                            }
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${selectedCard ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
                        style={{ background: applied ? `${zone.color}15` : zone.bg, border: applied ? `2px solid ${zone.color}` : `1px solid ${zone.border}` }}>
                        <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-extrabold text-white" style={{ background: zone.color }}>{zone.id.replace('z', '')}</div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold" style={{ color: zone.color }}>{zone.label}</span>
                          <span className="text-[10px] text-gh-text-muted ml-2">{zone.desc}</span>
                          {applied && <div className="text-[10px] text-teal-400 font-semibold mt-0.5 truncate">✓ {applied.tag}: &ldquo;{applied.q.slice(0, 50)}...&rdquo;</div>}
                        </div>
                        {applied && <button onClick={(e) => { e.stopPropagation(); setZoneApplied((prev) => { const n = { ...prev }; delete n[zone.id]; return n; }); }} className="text-[10px] text-red-400 hover:text-red-300 font-bold px-1">✕</button>}
                      </div>
                    );
                  })}
                </div>
                {Object.keys(zoneApplied).length > 0 && generatedHtml && (
                  <button onClick={() => {
                    let html = generatedHtml;
                    const sortedZones = ZONES.filter((z) => zoneApplied[z.id]).sort((a, b) => b.pct - a.pct);
                    sortedZones.forEach((z) => {
                      const card = zoneApplied[z.id];
                      if (!card) return;
                      const block = `<div class="gh-nepq-block" style="padding:28px 32px;background:rgba(13,148,136,0.06);border-left:4px solid #0D9488;margin:32px 0"><p style="font-size:17px;font-weight:700;font-style:italic;color:#1A2332;margin:0 0 12px;line-height:1.6">\u201c${card.q}\u201d</p><p style="font-size:17px;line-height:1.78;color:#3A4553;margin:0">${card.a}</p></div>`;
                      const pos = Math.floor(html.length * z.pct);
                      const searchFrom = html.indexOf('>', pos);
                      if (searchFrom > -1) html = html.slice(0, searchFrom + 1) + '\n' + block + '\n' + html.slice(searchFrom + 1);
                    });
                    setGeneratedHtml(html);
                  }} className="mt-3 w-full py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-500">
                    Inject {Object.keys(zoneApplied).length} NEPQ Block{Object.keys(zoneApplied).length > 1 ? 's' : ''} into Page
                  </button>
                )}
                <div className="mt-3 text-[10px] font-bold text-gh-text-muted uppercase mb-2">Click card → Click zone to place</div>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {allCards.map((card) => (
                    <button key={card.id} onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${selectedCard === card.id ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400' : 'bg-white/[0.02] border border-white/[0.06] text-gh-text-soft hover:bg-white/[0.04]'}`}>
                      <span className="font-bold text-[9px] uppercase tracking-wider text-teal-400 mr-2">{card.tag}</span>
                      <span className="truncate">{card.q.slice(0, 50)}...</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {generatedHtml && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Generated Page HTML</div>
                  <div className="text-[10px] text-gh-text-muted mt-0.5">{generatedHtml.length.toLocaleString()} chars · Template v5.7.2</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowPreview(!showPreview)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]"><Eye className="w-3 h-3 inline mr-1" />{showPreview ? 'Hide' : 'Preview'}</button>
                  <button onClick={copyHtml} className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]">{copied ? <><Check className="w-3 h-3 inline text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3 inline" /> Copy</>}</button>
                  <button onClick={downloadHtml} className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]"><Download className="w-3 h-3 inline mr-1" />Download</button>
                </div>
              </div>
              {showPreview && <iframe srcDoc={generatedHtml} className="w-full h-[600px] rounded-xl border border-white/[0.08]" sandbox="allow-scripts" title="Page Preview" />}
              <textarea value={generatedHtml} onChange={(e) => setGeneratedHtml(e.target.value)} className="w-full h-48 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs text-gh-text-soft font-mono resize-y outline-none" />
              {scanResult && (
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                  <div className={`text-2xl font-extrabold ${scanResult.pct >= 80 ? 'text-emerald-400' : scanResult.pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{scanResult.score}/{scanResult.total}</div>
                  <div className="flex-1"><div className="text-xs font-bold text-white">scan67: {scanResult.pct}%</div><div className="text-[10px] text-gh-text-muted">{scanResult.checks.filter((c) => c.pass).length} passed · {scanResult.checks.filter((c) => !c.pass).length} failed</div></div>
                  <button onClick={() => { setMode('scan'); }} className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-teal-500/30 text-teal-400 hover:bg-teal-500/10">View Details</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ FIX MODE ═══ */}
      {mode === 'fix' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-4 space-y-3">
              <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Live Pages ({livePages.length})</div>
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {livePages.map((p, i) => (
                  <button key={i} onClick={() => { setSelectedPage(p); setCustomTitle(p.name); setCustomSlug(p.slug); loadSaved(p.slug); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedPage?.slug === p.slug ? 'bg-carolina/20 text-carolina' : 'text-gh-text-soft hover:bg-white/[0.04]'}`}>
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-[10px] text-gh-text-faint truncate">/{p.slug}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {selectedPage ? (
                <>
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold text-white">{selectedPage.name}</div>
                        <div className="text-[10px] text-gh-text-faint">/{selectedPage.slug}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleFetch(selectedPage.slug)} disabled={fetching} className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-nc-gold/30 bg-nc-gold/10 text-nc-gold hover:bg-nc-gold/20 disabled:opacity-40">
                          {fetching ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Zap className="w-3 h-3 inline mr-1" />}
                          {fetching ? 'Fetching...' : 'Fetch Live'}
                        </button>
                        <button onClick={() => { if (scanHtml) setScanResult(scan67(scanHtml, pageType)); }} className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-teal-500/30 text-teal-400 hover:bg-teal-500/10">
                          <RefreshCw className="w-3 h-3 inline mr-1" />Re-scan
                        </button>
                      </div>
                    </div>
                    {scanResult && (
                      <div className="flex items-center gap-4 px-4 py-3 rounded-xl mb-3" style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                        <div className={`text-2xl font-extrabold ${scanResult.pct >= 80 ? 'text-emerald-400' : scanResult.pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{scanResult.score}/{scanResult.total}</div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-white">scan67: {scanResult.pct}%</div>
                          <div className="text-[10px] text-gh-text-muted">{scanResult.checks.filter((c) => !c.pass).length} failures to fix</div>
                        </div>
                      </div>
                    )}
                    {/* ── CHANGE 2: per-check Fix button on each failing check ── */}
                    {scanResult && (
                      <div className="space-y-1">
                        {scanResult.checks.filter((c) => !c.pass).map((c) => (
                          <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/10">
                            <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            <span className="text-xs text-white flex-1">{c.label}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${c.catColor}15`, color: c.catColor }}>{c.cat}</span>
                            <button
                              onClick={() => handleFixCheck(c.id)}
                              disabled={fixingCheckId === c.id || !apiKey || !scanHtml}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-400/30 text-red-400 hover:bg-red-400/10 disabled:opacity-40 transition-all whitespace-nowrap"
                            >
                              {fixingCheckId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                              {fixingCheckId === c.id ? 'Fixing...' : 'Fix'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea value={scanHtml} onChange={(e) => setScanHtml(e.target.value)} placeholder="Paste page HTML here or use Fetch Live..." className="w-full h-40 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs text-gh-text-soft font-mono resize-y outline-none" />
                  {scanHtml && (
                    <div className="card p-4 space-y-3">
                      <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">AI Actions</div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={async () => {
                          if (!apiKey || !scanResult) return;
                          const prompt = AI_PROMPTS.batchfix(selectedPage?.slug || '', pageType, scanHtml, scanResult);
                          setBuilding(true); setBuildProgress('Batch fixing...');
                          try {
                            const resp = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }) });
                            const data = await resp.json(); setGeneratedHtml(data.content?.[0]?.text || '');
                          } catch (e) { setBuildError(e instanceof Error ? e.message : String(e)); }
                          setBuilding(false); setBuildProgress('');
                        }} disabled={building || !apiKey || !scanResult} className="px-3 py-2 rounded-lg text-[11px] font-bold border border-red-400/30 text-red-400 hover:bg-red-400/10 disabled:opacity-40">
                          🔧 Batch Fix ({scanResult?.checks.filter((c) => !c.pass).length || 0} failures)
                        </button>
                        <button onClick={async () => {
                          if (!apiKey) return;
                          const prompt = AI_PROMPTS.wordboost(selectedPage?.slug || '', pageType, scanHtml);
                          setBuilding(true); setBuildProgress('Expanding content...');
                          try {
                            const resp = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }) });
                            const data = await resp.json(); setGeneratedHtml(data.content?.[0]?.text || '');
                          } catch (e) { setBuildError(e instanceof Error ? e.message : String(e)); }
                          setBuilding(false); setBuildProgress('');
                        }} disabled={building || !apiKey} className="px-3 py-2 rounded-lg text-[11px] font-bold border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 disabled:opacity-40">
                          📝 Word Boost (1,500+)
                        </button>
                        <button onClick={async () => {
                          if (!apiKey) return;
                          const prompt = AI_PROMPTS.update2026(scanHtml);
                          setBuilding(true); setBuildProgress('Updating 2026 figures...');
                          try {
                            const resp = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }) });
                            const data = await resp.json(); setGeneratedHtml(data.content?.[0]?.text || '');
                          } catch (e) { setBuildError(e instanceof Error ? e.message : String(e)); }
                          setBuilding(false); setBuildProgress('');
                        }} disabled={building || !apiKey} className="px-3 py-2 rounded-lg text-[11px] font-bold border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-40">
                          📅 2026 Update
                        </button>
                      </div>
                      <div className="text-[10px] font-bold text-gh-text-muted uppercase mt-3 mb-2">Generate Section</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {['hero', 'instant', 'faq', 'cta', 'coststrip', 'table', 'tips', 'warnings', 'related', 'schema'].map((section) => (
                          <button key={section} onClick={async () => {
                            if (!apiKey || !AI_PROMPTS[section]) return;
                            const prompt = AI_PROMPTS[section](selectedPage?.slug || customSlug || '', pageType, scanHtml, scanResult);
                            setBuilding(true); setBuildProgress(`Generating ${section}...`);
                            try {
                              const resp = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: AI_SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }) });
                              const data = await resp.json(); setGeneratedHtml(data.content?.[0]?.text || '');
                            } catch (e) { setBuildError(e instanceof Error ? e.message : String(e)); }
                            setBuilding(false); setBuildProgress('');
                          }} disabled={building || !apiKey} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] disabled:opacity-40 capitalize">
                            {section}
                          </button>
                        ))}
                      </div>
                      {building && <div className="text-xs text-gh-text-muted flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" />{buildProgress}</div>}
                    </div>
                  )}
                  {generatedHtml && mode === 'fix' && (
                    <div className="card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">AI Output</span>
                        <div className="flex gap-2">
                          <button onClick={copyHtml} className="px-3 py-1 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft">{copied ? '✓ Copied' : 'Copy'}</button>
                          <button onClick={downloadHtml} className="px-3 py-1 rounded-lg text-[10px] font-bold border border-white/10 text-gh-text-soft">Download</button>
                        </div>
                      </div>
                      <textarea value={generatedHtml} onChange={(e) => setGeneratedHtml(e.target.value)} className="w-full h-48 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs text-gh-text-soft font-mono resize-y outline-none" />
                    </div>
                  )}
                </>
              ) : (
                <div className="card p-12 text-center"><div className="text-3xl mb-3">🔧</div><div className="text-sm text-gh-text-muted">Select a live page to load, scan, and fix</div></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SCAN MODE ═══ */}
      {mode === 'scan' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Paste HTML or upload file</span>
              <div className="flex gap-2">
                <label className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] cursor-pointer"><Upload className="w-3 h-3 inline mr-1" />Upload<input type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" /></label>
                <button onClick={runScan} disabled={!scanHtml.trim()} className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-40"><Zap className="w-3 h-3 inline mr-1" />Scan</button>
              </div>
            </div>
            <textarea value={scanHtml} onChange={(e) => setScanHtml(e.target.value)} placeholder="Paste your page HTML here..." className="w-full h-32 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs text-gh-text-soft font-mono resize-none outline-none" />
          </div>
          {scanResult && (<div className="space-y-4">
            <div className="card p-6" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(37,99,235,0.08))', border: '1px solid rgba(13,148,136,0.2)' }}>
              <div className="flex items-center justify-between"><div><div className="text-sm font-bold text-white">scan67 Score</div><div className="text-xs text-gh-text-muted mt-0.5">{scanResult.checks.filter((c) => c.pass).length} passed · {scanResult.checks.filter((c) => !c.pass).length} failed</div></div><div className={`text-4xl font-extrabold ${scanResult.pct >= 80 ? 'text-emerald-400' : scanResult.pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{scanResult.score}/{scanResult.total}</div></div>
              <div className="w-full h-3 bg-white/[0.06] rounded-full overflow-hidden mt-4"><div className="h-3 rounded-full transition-all" style={{ width: `${scanResult.pct}%`, background: scanResult.pct >= 80 ? '#4ADE80' : scanResult.pct >= 60 ? '#FFC72C' : '#EF4444' }} /></div>
            </div>
            {CAT_ORDER.map((cat) => { const checks = groupedChecks[cat]; if (!checks?.length) return null; const passed = checks.filter((c) => c.pass).length; const isExp = expandedCat === cat;
              return (<div key={cat} className="card overflow-hidden"><div onClick={() => setExpandedCat(isExp ? null : cat)} className="px-5 py-3 cursor-pointer flex items-center justify-between"><div className="flex items-center gap-3">{isExp ? <ChevronDown className="w-4 h-4 text-gh-text-muted" /> : <ChevronRight className="w-4 h-4 text-gh-text-muted" />}<span className="text-xs font-bold uppercase tracking-wider" style={{ color: checks[0].catColor }}>{cat}</span></div><span className={`text-sm font-bold ${passed === checks.length ? 'text-emerald-400' : 'text-white'}`}>{passed}/{checks.length}</span></div>
                {isExp && (<div className="px-5 pb-4 border-t border-white/[0.04]">{checks.map((c) => (<div key={c.id} className="flex items-center gap-2.5 py-2 border-b border-white/[0.03] last:border-0">{c.pass ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <X className="w-4 h-4 text-red-400 flex-shrink-0" />}<span className={`text-xs ${c.pass ? 'text-gh-text-soft' : 'text-white font-medium'}`}>{c.label}</span></div>))}</div>)}</div>);
            })}
          </div>)}
        </div>
      )}

      {/* ═══ CARDS MODE ═══ */}
      {mode === 'cards' && (
        <div className="space-y-4">
          <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">{pageType === 'aca' ? 'ACA' : 'Medicare'} NEPQ Cards + Sequence</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allCards.map((card) => (
              <div key={card.id} className="card p-5 space-y-3">
                <div className="flex items-center justify-between"><span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400">{card.tag}</span><button onClick={() => copyCard(`${card.q}\n\n${card.a}`, card.id)} className="px-2 py-1 rounded text-[10px] font-bold border border-white/10 text-gh-text-faint hover:bg-white/[0.04]">{copiedCard === card.id ? <Check className="w-3 h-3 inline text-emerald-400" /> : <Copy className="w-3 h-3 inline" />}</button></div>
                <div className="text-xs text-gh-text-muted">{card.tagline}</div>
                <div className="text-sm font-bold text-white leading-snug">{card.q}</div>
                <div className="text-xs text-gh-text-soft leading-relaxed">{card.a}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
