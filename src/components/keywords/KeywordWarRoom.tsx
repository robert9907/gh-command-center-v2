'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  ArrowUp, ArrowDown,
  ExternalLink, Loader2, Link2, X, Copy, Check, Zap,
} from 'lucide-react';
import { DEFAULT_KEYWORDS, KEYWORD_GROUPS, SAMPLE_KEYWORD_HISTORY } from '@/data/keywords';
import { getFromStorage, saveToStorage, formatNumber } from '@/lib/utils';
import { pullKeywordFromGSC, getGSCToken, startGSCAuth, getGSCClientId, captureOAuthToken } from '@/lib/gsc';
import type { TrackedKeyword, KeywordHistory, KeywordNotes, KeywordGroup } from '@/types';

const LS_KEYWORDS  = 'gh-cc-kw-keywords';
const LS_HISTORY   = 'gh-cc-kw-history';
const LS_NOTES     = 'gh-cc-kw-notes';
const LS_LAST_PULL = 'gh-cc-kw-lastpull';
const LS_INT_LINKS = 'gh-cc-kw-intlinks';

const SOURCE_PAGES = [
  { page: 'Free Medicare Quotes Online', slug: '/free-medicare-quotes-online', da: 'High' },
  { page: 'Medicare Advantage Plans NC', slug: '/how-to-compare-medicare-advantage-plans-in-north-carolina', da: 'High' },
  { page: 'NC Medicare Plans 2026', slug: '/medicare-plans-in-north-carolina', da: 'High' },
  { page: 'NC Medicare Savings Programs', slug: '/north-carolina-medicare-savings-programs-2026-eligibility-savings-guide', da: 'Medium' },
  { page: 'Medicare Broker Durham NC', slug: '/medicare-broker-durham-nc', da: 'Medium' },
  { page: 'Part D in NC', slug: '/medicare-part-d-in-north-carolina', da: 'Medium' },
  { page: 'Medigap Plan G vs N', slug: '/medigap-plans-in-north-carolina-plan-g-vs-plan-n', da: 'Medium' },
  { page: 'Medicare Enrollment NC', slug: '/medicare-enrollment-in-north-carolina-complete-guide-for-2026', da: 'Medium' },
  { page: 'ACA NC Plans', slug: '/north-carolina-aca-health-insurance-plans', da: 'Medium' },
  { page: 'NC Marketplace', slug: '/north-carolina-health-insurance-marketplace', da: 'Low' },
  { page: 'Wake County Medicare', slug: '/medicare-agents-in-wake-county-nc', da: 'Low' },
  { page: 'Durham County Medicare', slug: '/medicare-agents-in-durham-county-nc', da: 'Low' },
  { page: 'Medicare Costs 2026', slug: '/medicare-costs-north-carolina-2026-complete-guide', da: 'Low' },
  { page: 'Health Insurance Brokers Near Me', slug: '/health-insurance-brokers-near-me', da: 'Low' },
];

function anchorVariants(keyword: string): string[] {
  const variants: string[] = [keyword];
  if (keyword.includes('medicare')) variants.push('learn about ' + keyword, keyword + ' options');
  if (keyword.includes('north carolina') || keyword.includes(' nc')) {
    variants.push(keyword.replace('north carolina', 'NC').replace(' nc', ' NC'));
  }
  if (keyword.includes('quotes')) variants.push('get a free quote', 'compare your options');
  variants.push('see your options');
  return Array.from(new Set(variants)).slice(0, 5);
}

interface InternalLinkRecord { sourceSlug: string; anchor: string; addedDate: string; done: boolean; }
type InternalLinks = Record<string, InternalLinkRecord[]>;

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="p-1 rounded transition-colors text-gh-text-faint hover:text-carolina" title="Copy">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function DaBadge({ da }: { da: string }) {
  const color = da === 'High' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    : da === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    : 'text-gh-text-muted bg-white/[0.04] border-white/[0.08]';
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${color} uppercase tracking-wide`}>{da}</span>;
}

function InternalLinksPanel({ keyword, targetSlug, targetPage, pos, links, onUpdate, onClose }: {
  keyword: string; targetSlug: string; targetPage: string; pos: number | null;
  links: InternalLinkRecord[]; onUpdate: (l: InternalLinkRecord[]) => void; onClose: () => void;
}) {
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedAnchor, setSelectedAnchor] = useState(keyword);
  const [customAnchor, setCustomAnchor] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const anchors = useMemo(() => anchorVariants(keyword), [keyword]);
  const addedSlugs = useMemo(() => new Set(links.map(l => l.sourceSlug)), [links]);
  const completedCount = links.filter(l => l.done).length;

  const priorityMsg = pos === null ? null
    : pos > 30 ? { level: 'high', msg: `Position ${pos.toFixed(0)} — Add 3–5 internal links now to boost crawl priority.` }
    : pos > 20 ? { level: 'med', msg: `Position ${pos.toFixed(0)} — 2–3 strong internal links can push this to striking distance.` }
    : pos > 10 ? { level: 'low', msg: `Position ${pos.toFixed(0)} — 1–2 links from high-traffic pages can push to page 1.` }
    : null;

  const htmlSnippet = (anchor: string) => `<a href="https://generationhealth.me${targetSlug}">${anchor}</a>`;

  const addLink = () => {
    if (!selectedSource) return;
    const anchor = useCustom ? customAnchor.trim() : selectedAnchor;
    if (!anchor) return;
    onUpdate([...links, { sourceSlug: selectedSource, anchor, addedDate: new Date().toISOString().split('T')[0], done: false }]);
    setSelectedSource('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="w-[520px] h-full bg-[#0F1A2E] border-l border-white/[0.08] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-white/[0.08] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-carolina" />
              <span className="text-xs font-bold text-carolina uppercase tracking-wider">Internal Link Builder</span>
            </div>
            <h3 className="text-white font-bold text-base leading-snug">{keyword}</h3>
            <div className="text-[11px] text-gh-text-muted mt-1">Target: <span className="text-gh-text-soft">{targetPage}</span></div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gh-text-faint hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        {priorityMsg && (
          <div className={`mx-4 mt-4 px-3 py-2.5 rounded-lg flex items-start gap-2 ${
            priorityMsg.level === 'high' ? 'bg-red-500/10 border border-red-500/20' :
            priorityMsg.level === 'med'  ? 'bg-amber-500/10 border border-amber-500/20' :
                                           'bg-carolina/10 border border-carolina/20'}`}>
            <Zap className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
              priorityMsg.level === 'high' ? 'text-red-400' :
              priorityMsg.level === 'med'  ? 'text-amber-400' : 'text-carolina'}`} />
            <p className="text-[11px] text-gh-text-soft leading-relaxed">{priorityMsg.msg}</p>
          </div>
        )}
        {links.length > 0 && (
          <div className="mx-4 mt-4 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gh-text-muted uppercase tracking-wider">Link Progress</span>
              <span className="text-[10px] text-gh-text-soft">{completedCount}/{links.length} done</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-carolina to-teal-400 rounded-full transition-all"
                style={{ width: links.length ? `${(completedCount / links.length) * 100}%` : '0%' }} />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="card p-4 space-y-3">
            <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest">Add Link Opportunity</div>
            <div>
              <label className="text-[10px] font-bold text-gh-text-muted block mb-1.5">From page (source)</label>
              <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none focus:border-carolina/40">
                <option value="">— choose source page —</option>
                {SOURCE_PAGES.filter(p => p.slug !== targetSlug && !addedSlugs.has(p.slug)).map(p => (
                  <option key={p.slug} value={p.slug}>{p.page} ({p.da} authority)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gh-text-muted block mb-1.5">Anchor text</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {anchors.map(a => (
                  <button key={a} onClick={() => { setSelectedAnchor(a); setUseCustom(false); }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      !useCustom && selectedAnchor === a
                        ? 'border-carolina/50 bg-carolina/10 text-white'
                        : 'border-white/[0.08] bg-white/[0.03] text-gh-text-muted hover:text-white'}`}>
                    {a}
                  </button>
                ))}
                <button onClick={() => setUseCustom(true)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    useCustom ? 'border-nc-gold/50 bg-nc-gold/10 text-nc-gold'
                      : 'border-white/[0.08] bg-white/[0.03] text-gh-text-faint hover:text-white'}`}>
                  + Custom
                </button>
              </div>
              {useCustom && (
                <input value={customAnchor} onChange={e => setCustomAnchor(e.target.value)}
                  placeholder="Type custom anchor text..."
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none focus:border-nc-gold/40" />
              )}
            </div>
            {selectedSource && (
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gh-text-muted uppercase tracking-wider">HTML Snippet</span>
                  <CopyBtn text={htmlSnippet(useCustom ? customAnchor : selectedAnchor)} />
                </div>
                <code className="text-[11px] text-teal-300 break-all leading-relaxed">
                  {htmlSnippet(useCustom ? customAnchor : selectedAnchor)}
                </code>
              </div>
            )}
            <button onClick={addLink} disabled={!selectedSource || (useCustom && !customAnchor.trim())}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-carolina to-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all">
              + Add to Link Queue
            </button>
          </div>
          {links.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest">Link Queue ({links.length})</div>
              {links.map((link, idx) => {
                const src = SOURCE_PAGES.find(p => p.slug === link.sourceSlug);
                return (
                  <div key={idx} className={`p-3 rounded-xl border transition-all ${
                    link.done ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/[0.08] bg-white/[0.02]'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {src && <DaBadge da={src.da} />}
                          <span className="text-[11px] font-semibold text-gh-text-soft truncate">{src?.page || link.sourceSlug}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gh-text-faint">Anchor:</span>
                          <span className="text-[11px] text-white font-medium">&quot;{link.anchor}&quot;</span>
                          <CopyBtn text={htmlSnippet(link.anchor)} />
                        </div>
                        <div className="text-[10px] text-gh-text-faint mt-0.5">Added {link.addedDate}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { const u = links.map((l,i)=>i===idx?{...l,done:!l.done}:l); onUpdate(u); }}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition-all ${
                            link.done ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                              : 'border-white/[0.10] bg-white/[0.03] text-gh-text-muted hover:text-white'}`}>
                          {link.done ? '✓ Done' : 'Mark Done'}
                        </button>
                        <a href={`https://generationhealth.me${link.sourceSlug}`} target="_blank" rel="noopener noreferrer"
                          className="p-1 text-gh-text-faint hover:text-carolina transition-colors" title="Open source page">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => onUpdate(links.filter((_,i)=>i!==idx))}
                          className="p-1 text-gh-text-faint hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {links.length === 0 && (
            <div className="text-center py-8 text-gh-text-faint">
              <Link2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <div className="text-xs">No links queued yet.</div>
              <div className="text-[11px] mt-1 opacity-70">Add source pages above to build authority.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <span className="text-[10px] text-gh-text-faint">—</span>;
  const chartData = data.slice(-8).map((v, i) => ({ v, i }));
  return (
    <div className="w-20 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 1, right: 0, left: 0, bottom: 1 }}>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="transparent" dot={false} animationDuration={500} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MoveBadge({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return <span className="text-gh-text-faint">→</span>;
  const diff = Math.round((previous - current) * 10) / 10;
  if (Math.abs(diff) < 0.5) return <span className="text-gh-text-faint">→</span>;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold"><ArrowUp className="w-3 h-3" />{Math.abs(Math.round(diff))}</span>;
  return <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold"><ArrowDown className="w-3 h-3" />{Math.abs(Math.round(diff))}</span>;
}

function PosBadge({ pos }: { pos: number | null }) {
  if (pos === null) return <span className="text-gh-text-faint text-sm">—</span>;
  const color = pos <= 10 ? 'text-emerald-400' : pos <= 20 ? 'text-amber-400' : 'text-red-400';
  return <span className={`text-sm font-bold tabular-nums ${color}`}>{pos.toFixed(1)}</span>;
}

export default function KeywordWarRoom() {
  const [keywords, setKeywords] = useState<TrackedKeyword[]>(() => getFromStorage(LS_KEYWORDS, DEFAULT_KEYWORDS));
  const [history,  setHistory]  = useState<KeywordHistory>(() => getFromStorage(LS_HISTORY, SAMPLE_KEYWORD_HISTORY));
  const [notes,    setNotes]    = useState<KeywordNotes>(() => getFromStorage(LS_NOTES, {}));
  const [lastPull, setLastPull] = useState<string | null>(() => getFromStorage(LS_LAST_PULL, null));
  const [internalLinks, setInternalLinks] = useState<InternalLinks>(() => getFromStorage(LS_INT_LINKS, {}));
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState('');
  const [adding, setAdding] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newGroup, setNewGroup] = useState<KeywordGroup>('medicare');
  const [newPage, setNewPage] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [linkPanelKw, setLinkPanelKw] = useState<string | null>(null);

  useEffect(() => { saveToStorage(LS_KEYWORDS, keywords); }, [keywords]);
  useEffect(() => { saveToStorage(LS_HISTORY, history); }, [history]);
  useEffect(() => { saveToStorage(LS_NOTES, notes); }, [notes]);
  useEffect(() => { saveToStorage(LS_LAST_PULL, lastPull); }, [lastPull]);
  useEffect(() => { saveToStorage(LS_INT_LINKS, internalLinks); }, [internalLinks]);
  useEffect(() => { captureOAuthToken(); }, []);

  const enriched = useMemo(() => keywords.map(kw => {
    const hist = history[kw.keyword] || [];
    const latest = hist.length > 0 ? hist[hist.length - 1] : null;
    const prev   = hist.length > 1 ? hist[hist.length - 2] : null;
    const links  = internalLinks[kw.keyword] || [];
    return {
      ...kw,
      pos: latest?.pos ?? null,
      clicks: latest?.clicks ?? 0, impr: latest?.impr ?? 0, ctr: latest?.ctr ?? 0,
      prevPos: prev?.pos ?? null,
      hist: hist.map(h => h.pos),
      note: notes[kw.keyword] || '',
      linkCount: links.length,
      linkDone: links.filter(l => l.done).length,
    };
  }).sort((a, b) => a.pos === null ? 1 : b.pos === null ? -1 : a.pos - b.pos),
  [keywords, history, notes, internalLinks]);

  const stats = useMemo(() => {
    const wp = enriched.filter(k => k.pos !== null);
    return {
      tracking: `${keywords.length}/25`,
      page1:    wp.filter(k => k.pos! <= 10).length,
      striking: wp.filter(k => k.pos! > 10 && k.pos! <= 20).length,
      page3:    wp.filter(k => k.pos! > 20).length,
      noData:   enriched.filter(k => k.pos === null).length,
    };
  }, [enriched, keywords.length]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof enriched> = {};
    KEYWORD_GROUPS.forEach(g => { map[g.id] = enriched.filter(k => k.group === g.id); });
    return map;
  }, [enriched]);

  const pullFromGSC = useCallback(async () => {
    const token = getGSCToken();
    if (!token) { const cid = getGSCClientId(); if (cid) startGSCAuth(cid); else alert('No GSC OAuth token. Connect Google first.'); return; }
    setPulling(true);
    const errors: string[] = [];
    const newHist = { ...history };
    const date = new Date().toISOString().split('T')[0];
    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      setPullProgress(`${i+1}/${keywords.length}: ${kw.keyword}`);
      try {
        const r = await pullKeywordFromGSC(token, kw.keyword);
        if (r) {
          if (!newHist[kw.keyword]) newHist[kw.keyword] = [];
          if (!newHist[kw.keyword].find(h => h.date === date)) {
            newHist[kw.keyword].push({ date, pos: r.pos, clicks: r.clicks, impr: r.impr, ctr: r.ctr, variants: r.variants });
            if (newHist[kw.keyword].length > 12) newHist[kw.keyword] = newHist[kw.keyword].slice(-12);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${kw.keyword}: ${msg}`);
        if (msg.includes('token expired')) break;
      }
    }
    setHistory(newHist); setLastPull(new Date().toISOString()); setPulling(false); setPullProgress('');
    if (errors.length) alert('GSC issues:\n' + errors.join('\n'));
  }, [history, keywords]);

  const addKeyword = useCallback(() => {
    if (!newWord.trim()) return;
    if (keywords.find(k => k.keyword.toLowerCase() === newWord.trim().toLowerCase())) { alert('Already tracking: ' + newWord); return; }
    setKeywords(prev => [...prev, { keyword: newWord.trim().toLowerCase(), group: newGroup, targetPage: newPage, targetSlug: newSlug }]);
    setNewWord(''); setNewPage(''); setNewSlug('');
  }, [newWord, newGroup, newPage, newSlug, keywords]);

  const removeKeyword = useCallback((kw: string) => {
    if (!confirm(`Remove "${kw}" from tracking?`)) return;
    setKeywords(prev => prev.filter(k => k.keyword !== kw));
  }, []);

  const updateNote = useCallback((kw: string, note: string) => {
    setNotes(prev => ({ ...prev, [kw]: note }));
  }, []);

  const updateLinks = useCallback((kw: string, links: InternalLinkRecord[]) => {
    setInternalLinks(prev => ({ ...prev, [kw]: links }));
  }, []);

  const linkPanelData = useMemo(() => linkPanelKw ? enriched.find(k => k.keyword === linkPanelKw) || null : null,
    [linkPanelKw, enriched]);

  const totalLinks = Object.values(internalLinks).reduce((s, a) => s + a.length, 0);
  const totalDone  = Object.values(internalLinks).reduce((s, a) => s + a.filter(l => l.done).length, 0);
  const inputCls   = "px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none focus:border-carolina/40 transition-colors";

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <span className="text-lg">🎯</span> Keyword War Room
            </h2>
            <p className="text-xs text-gh-text-muted mt-1">Track your top 25 money keywords · GSC 28-day data · contains matching · 12-week trends</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lastPull && <span className="text-[10px] text-gh-text-faint">Last pull: {new Date(lastPull).toLocaleDateString()}</span>}
            <button onClick={pullFromGSC} disabled={pulling || keywords.length === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-sky-300 to-blue-300 text-sky-900 hover:brightness-110">
              {pulling ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />{pullProgress || 'Pulling...'}</span> : '📡 Pull GSC Data'}
            </button>
            <button onClick={() => setAdding(!adding)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">
              {adding ? 'Done' : '+ Add Keyword'}
            </button>
            {keywords.length < 25 && (
              <button onClick={() => { if (confirm('Load the GSC-optimized 25 keywords?')) { setKeywords(DEFAULT_KEYWORDS); setHistory({}); setNotes({}); }}}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-nc-gold/30 bg-nc-gold/[0.08] text-nc-gold hover:bg-nc-gold/[0.15] transition-colors">
                🎯 Load GSC-Optimized 25
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'TRACKING', value: stats.tracking, color: 'text-white' },
            { label: 'PAGE 1 (1-10)', value: stats.page1, color: 'text-emerald-400' },
            { label: 'STRIKING (11-20)', value: stats.striking, color: 'text-amber-400' },
            { label: 'PAGE 3+ (21+)', value: stats.page3, color: 'text-red-400' },
            { label: 'NO DATA', value: stats.noData, color: 'text-gh-text-muted' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <div className={`text-xl font-extrabold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-semibold text-gh-text-muted uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {totalLinks > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-carolina/20 bg-carolina/[0.06]">
            <Link2 className="w-3.5 h-3.5 text-carolina shrink-0" />
            <span className="text-[11px] text-gh-text-soft flex-1">
              <span className="font-bold text-white">{totalLinks}</span> internal links queued across{' '}
              <span className="font-bold text-white">{Object.keys(internalLinks).filter(k => internalLinks[k].length > 0).length}</span> keywords —{' '}
              <span className="text-emerald-400 font-semibold">{totalDone} completed</span>
            </span>
            <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-carolina to-teal-400 rounded-full"
                style={{ width: `${(totalDone / totalLinks) * 100}%` }} />
            </div>
          </div>
        )}

        {adding && (
          <div className="card p-4 space-y-3">
            <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Add keyword to track</div>
            <div className="flex gap-2.5 items-end flex-wrap">
              <div className="flex-[2] min-w-[200px]">
                <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Keyword</label>
                <input value={newWord} onChange={e => setNewWord(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  placeholder="e.g. medicare quotes north carolina" className={inputCls + ' w-full'} />
              </div>
              <div className="w-28">
                <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Group</label>
                <select value={newGroup} onChange={e => setNewGroup(e.target.value as KeywordGroup)} className={inputCls + ' w-full'}>
                  {KEYWORD_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Target Page</label>
                <input value={newPage} onChange={e => setNewPage(e.target.value)} placeholder="Page name" className={inputCls + ' w-full'} />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Slug</label>
                <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="/page-slug" className={inputCls + ' w-full'} />
              </div>
              <button onClick={addKeyword} disabled={!newWord.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-40 hover:bg-emerald-500 transition-colors">
                Add
              </button>
            </div>
          </div>
        )}

        {keywords.length === 0 ? (
          <div className="text-center py-16 text-gh-text-faint">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-sm mb-1">No keywords tracked yet.</div>
            <div className="text-xs">Click &quot;+ Add Keyword&quot; to start building your war room.</div>
          </div>
        ) : (
          KEYWORD_GROUPS.map(group => {
            const gkws = grouped[group.id];
            if (!gkws || gkws.length === 0) return null;
            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-5 rounded-sm" style={{ background: group.color }} />
                  <span className="text-sm font-bold" style={{ color: group.color }}>{group.label}</span>
                  <span className="text-[11px] text-gh-text-muted">{gkws.length} keywords</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {['#','KEYWORD','TARGET PAGE','POS','MOVE','CLICKS','IMPR','CTR','8-WK TREND','LINKS','NOTES',''].map((h,i) => (
                          <th key={h+i} className={`px-2.5 py-2 text-[10px] font-bold text-gh-text-muted uppercase tracking-wider border-b border-white/[0.06] whitespace-nowrap ${i >= 3 && i <= 9 ? 'text-center' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gkws.map((kw, ki) => (
                        <tr key={kw.keyword} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${linkPanelKw === kw.keyword ? 'bg-carolina/[0.05]' : ''}`}>
                          <td className="px-2.5 py-3 text-xs text-gh-text-faint tabular-nums">{ki + 1}</td>
                          <td className="px-2.5 py-3"><span className="text-xs font-semibold text-white">{kw.keyword}</span></td>
                          <td className="px-2.5 py-3">
                            <div className="text-xs text-gh-text-soft">{kw.targetPage}</div>
                            <div className="text-[10px] text-gh-text-faint truncate max-w-[220px]">{kw.targetSlug}</div>
                          </td>
                          <td className="px-2.5 py-3 text-center"><PosBadge pos={kw.pos} /></td>
                          <td className="px-2.5 py-3 text-center"><MoveBadge current={kw.pos} previous={kw.prevPos} /></td>
                          <td className="px-2.5 py-3 text-center text-xs text-gh-text-soft tabular-nums">{kw.clicks}</td>
                          <td className="px-2.5 py-3 text-center text-xs text-gh-text-soft tabular-nums">{formatNumber(kw.impr)}</td>
                          <td className="px-2.5 py-3 text-center text-xs text-gh-text-soft tabular-nums">{kw.ctr > 0 ? `${kw.ctr}%` : '0%'}</td>
                          <td className="px-2.5 py-3 text-center">
                            <TrendSpark data={kw.hist}
                              color={kw.hist.length >= 2 && kw.hist[kw.hist.length-1] < kw.hist[kw.hist.length-2] ? '#4ADE80' : kw.hist.length >= 2 ? '#EF4444' : '#6B7B8D'} />
                          </td>
                          <td className="px-2.5 py-3 text-center">
                            <button onClick={() => setLinkPanelKw(linkPanelKw === kw.keyword ? null : kw.keyword)}
                              className={`flex items-center gap-1 mx-auto px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all ${
                                linkPanelKw === kw.keyword ? 'border-carolina/50 bg-carolina/15 text-carolina'
                                : kw.linkCount > 0 ? 'border-carolina/25 bg-carolina/[0.06] text-carolina hover:bg-carolina/15'
                                : 'border-white/[0.08] bg-white/[0.03] text-gh-text-faint hover:text-carolina hover:border-carolina/25'}`}
                              title="Manage internal links">
                              <Link2 className="w-3 h-3" />
                              {kw.linkCount > 0 ? (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                                  kw.linkDone === kw.linkCount
                                    ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                                    : 'bg-carolina/15 border-carolina/25 text-carolina'}`}>
                                  {kw.linkDone}/{kw.linkCount}
                                </span>
                              ) : <span>Add</span>}
                            </button>
                          </td>
                          <td className="px-2.5 py-3">
                            <button onClick={() => { const n = prompt(`Note for "${kw.keyword}":`, kw.note); if (n !== null) updateNote(kw.keyword, n); }}
                              className="text-[10px] text-gh-text-faint hover:text-carolina transition-colors px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06] whitespace-nowrap">
                              {kw.note || 'Why it moved...'}
                            </button>
                          </td>
                          <td className="px-2.5 py-3">
                            <div className="flex items-center gap-1">
                              <a href={`https://generationhealth.me${kw.targetSlug}`} target="_blank" rel="noopener noreferrer"
                                className="p-1 text-gh-text-faint hover:text-carolina transition-colors" title="View page">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button onClick={() => removeKeyword(kw.keyword)}
                                className="p-1 text-gh-text-faint hover:text-red-400 transition-colors" title="Remove">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {linkPanelKw && linkPanelData && (
        <InternalLinksPanel
          keyword={linkPanelKw}
          targetSlug={linkPanelData.targetSlug}
          targetPage={linkPanelData.targetPage}
          pos={linkPanelData.pos}
          links={internalLinks[linkPanelKw] || []}
          onUpdate={links => updateLinks(linkPanelKw, links)}
          onClose={() => setLinkPanelKw(null)}
        />
      )}
    </>
  );
}
