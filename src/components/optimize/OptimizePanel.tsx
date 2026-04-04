'use client';

import { useState, useMemo, useCallback } from 'react';
import { Check, ChevronDown, ChevronRight, Search, ExternalLink, Zap, Loader2, FileText } from 'lucide-react';
import { OPT_ITEMS, PHASES, CAT_COLORS, getPriorityScore } from '@/data/config';
import { calendarWeeks } from '@/data/calendar';
import { clusters } from '@/data/clusters';
import { useAppState } from '@/lib/AppState';
import { scan67 } from '@/lib/scan67';

function ValueBadge({ label, value }: { label: string; value: string }) {
  const color = value === 'Very High' ? '#4ADE80' : value === 'High' ? '#60A5FA' : value === 'Medium-High' ? '#FFC72C' : '#6B7B8D';
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{label}: {value}</span>;
}
function ProgressBar({ pct, size = 'md' }: { pct: number; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return <div className={`w-full ${h} bg-white/[0.06] rounded-full overflow-hidden`}><div className={`${h} rounded-full transition-all duration-500`} style={{ width: `${pct}%`, background: pct === 100 ? '#4ADE80' : 'linear-gradient(90deg, #22C55E, #4ADE80)' }} /></div>;
}
function TaskCheck({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return <button onClick={onToggle} className={`w-[18px] h-[18px] rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'bg-emerald-600 border-emerald-600' : 'border-white/20 bg-white/[0.04] hover:border-white/30'}`}>{checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}</button>;
}
function NoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={(e) => e.key === 'Enter' && setEditing(false)} className="mt-1 w-full px-2 py-1 rounded text-[10px] border border-white/[0.12] bg-white/[0.04] text-gh-text-soft outline-none" placeholder="Add note..." />;
  return <button onClick={() => setEditing(true)} className="mt-1 text-[10px] text-gh-text-faint hover:text-carolina transition-colors truncate max-w-[200px] block">{value || '+ note'}</button>;
}

const TYPE_COLORS: Record<string, { color: string }> = {
  'E-E-A-T': { color: '#FFC72C' }, 'AEO': { color: '#60A5FA' }, 'GEO': { color: '#A78BFA' },
  'Content': { color: '#2DD4BF' }, 'SEO': { color: '#34D399' }, 'Promo': { color: '#FB923C' },
  'Links': { color: '#818CF8' }, 'Entity': { color: '#C084FC' }, 'County': { color: '#22D3EE' },
  'Schema': { color: '#FBBF24' }, 'Audit': { color: '#F87171' }, 'Planning': { color: '#E2E8F0' },
};

export default function OptimizePanel() {
  const { taskDone: done, taskIsDone: isDone, taskToggle: toggle, taskGetNote: getNote, taskSetNote: setNote, taskRecentId: recentId, navigateToTab, fetchAndScanPage, savedHTML } = useAppState();
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{ found: boolean; clusterId?: string; clusterName?: string; pageName?: string; slug?: string } | null>(null);
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  const [fetchingPages, setFetchingPages] = useState<Record<string, boolean>>({});
  const [fetchAllProgress, setFetchAllProgress] = useState<{ total: number; done: number; current: string } | null>(null);

  const liveClusters = useMemo(() => clusters.filter((c) => c.posts.some((p) => p.status === 'done')).sort((a, b) => getPriorityScore(a) - getPriorityScore(b)), []);

  const { allOptDone, allOptTotal, pct, allLivePages } = useMemo(() => {
    let optDone = 0, livePages = 0;
    liveClusters.forEach((c) => { c.posts.forEach((p, i) => { if (p.status === 'done') livePages++; OPT_ITEMS.forEach((oi) => { if (isDone(`op-${c.id}-${i}-${oi.id}`)) optDone++; }); }); });
    const total = livePages * OPT_ITEMS.length;
    return { allOptDone: optDone, allOptTotal: total, pct: total > 0 ? Math.round((optDone / total) * 100) : 0, allLivePages: livePages };
  }, [liveClusters, isDone]);

  // Calendar stats
  const calDone = useMemo(() => calendarWeeks.reduce((acc, w) => acc + w.tasks.filter((_, i) => isDone(`cal-${w.week}-${i}`)).length, 0), [isDone]);
  const calTotal = useMemo(() => calendarWeeks.reduce((acc, w) => acc + w.tasks.length, 0), []);

  const handleSearch = useCallback(() => {
    const slug = searchQuery.trim().replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
    let found: typeof searchResult = null;
    for (const c of liveClusters) { for (const p of c.posts) { if (p.slug && p.slug.toLowerCase() === slug.toLowerCase()) { found = { found: true, clusterId: c.id, clusterName: c.name, pageName: p.name, slug: p.slug }; break; } } if (found) break; }
    if (found) { setSearchResult(found); setExpandedCluster(found.clusterId!); setHighlightSlug(found.slug!); setTimeout(() => { document.getElementById(`opt-page-${found!.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200); }
    else { setSearchResult({ found: false, slug }); setHighlightSlug(null); }
  }, [searchQuery, liveClusters]);

  // Fetch all pages across all clusters
  const handleFetchAll = useCallback(async () => {
    const allPages = liveClusters.flatMap((c) => c.posts.filter((p) => p.status === 'done' && p.slug).map((p, i) => ({ slug: p.slug!, name: p.name, clusterId: c.id, idx: i })));
    if (!confirm(`Fetch & scan ALL ${allPages.length} live pages?`)) return;
    setFetchAllProgress({ total: allPages.length, done: 0, current: 'Starting...' });
    for (let i = 0; i < allPages.length; i++) {
      setFetchAllProgress({ total: allPages.length, done: i, current: allPages[i].name });
      await fetchAndScanPage(allPages[i].slug);
      await new Promise((r) => setTimeout(r, 800));
    }
    setFetchAllProgress({ total: allPages.length, done: allPages.length, current: 'Done!' });
    setTimeout(() => setFetchAllProgress(null), 5000);
  }, [liveClusters, fetchAndScanPage]);

  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <div className="card p-7" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.08), rgba(37,99,235,0.08))', border: '1px solid rgba(13,148,136,0.2)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Optimize Existing Pages</h2>
            <p className="text-xs text-gh-text-muted mt-1">Harden what&apos;s live before building new. {allLivePages} pages × {OPT_ITEMS.length} items each.</p>
            <button onClick={handleFetchAll} className="mt-2 px-4 py-2 rounded-xl text-xs font-bold border-[1.5px] border-nc-gold/50 bg-nc-gold/[0.08] text-nc-gold hover:bg-nc-gold/[0.15]">
              <Zap className="w-3 h-3 inline mr-1" />Fetch & Scan All {allLivePages} Pages
            </button>
            {fetchAllProgress && <div className="mt-2 text-xs text-gh-text-muted"><ProgressBar pct={fetchAllProgress.total > 0 ? Math.round((fetchAllProgress.done / fetchAllProgress.total) * 100) : 0} size="sm" /><span className="mt-1 block">{fetchAllProgress.done}/{fetchAllProgress.total} — {fetchAllProgress.current}</span></div>}
          </div>
          <div className="text-right"><div className={`text-3xl font-extrabold ${pct === 100 ? 'text-emerald-400' : 'text-white'}`}>{pct}%</div><div className="text-xs text-gh-text-muted">{allOptDone}/{allOptTotal}</div></div>
        </div>
        <ProgressBar pct={pct} />
      </div>

      {/* URL search */}
      <div className="card p-5" style={{ border: '1px solid rgba(255,199,44,0.2)' }}>
        <div className="text-[11px] font-extrabold tracking-wider text-nc-gold uppercase mb-3">🔍 Find a page by URL</div>
        <div className="flex gap-2 items-center flex-wrap">
          <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSearchResult(null); }} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Paste URL or slug, press Enter" className="flex-1 min-w-[280px] px-3 py-2.5 rounded-xl border border-white/[0.12] bg-white/[0.05] text-white text-sm outline-none" />
          <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl border-[1.5px] border-nc-gold/50 bg-nc-gold/10 text-nc-gold text-sm font-bold">Find</button>
          {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResult(null); setHighlightSlug(null); }} className="px-3 py-2.5 rounded-xl border border-white/10 text-gh-text-muted text-xs">✕</button>}
        </div>
        {searchResult?.found && <div className="mt-3 px-3 py-2.5 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-xl text-sm"><span className="text-emerald-400 font-bold">✓ Found:</span> <span className="text-white">{searchResult.pageName}</span> in <span className="text-nc-gold font-semibold">{searchResult.clusterName}</span></div>}
        {searchResult && !searchResult.found && <div className="mt-3 px-3 py-2.5 bg-orange-500/[0.08] border border-orange-500/25 rounded-xl text-sm"><span className="text-orange-400 font-bold">✗ Not found:</span> <span className="text-gh-text-muted">/{searchResult.slug}</span></div>}
      </div>

      <div className="text-[11px] font-extrabold tracking-widest text-nc-gold uppercase">Clusters ranked by priority</div>

      {/* Cluster cards */}
      {liveClusters.map((cluster) => {
        const ph = PHASES.find((p) => p.id === cluster.phase) || PHASES[0];
        const isExp = expandedCluster === cluster.id;
        const allPosts = cluster.posts.map((p, i) => ({ ...p, idx: i }));
        let clusterOptDone = 0;
        allPosts.forEach((p) => { OPT_ITEMS.forEach((oi) => { if (isDone(`op-${cluster.id}-${p.idx}-${oi.id}`)) clusterOptDone++; }); });
        const clusterOptTotal = allPosts.length * OPT_ITEMS.length;
        const clusterPct = clusterOptTotal > 0 ? Math.round((clusterOptDone / clusterOptTotal) * 100) : 0;

        return (
          <div key={cluster.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: isExp ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: isExp ? `2px solid ${ph.color}` : '1px solid rgba(255,255,255,0.06)' }}>
            <div onClick={() => setExpandedCluster(isExp ? null : cluster.id)} className="px-6 py-4 cursor-pointer flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1"><span className="text-[15px] font-bold text-white">{cluster.name}</span><ValueBadge label="SEO" value={cluster.seoValue} /><ValueBadge label="AEO" value={cluster.aeoValue} /></div>
                <div className="max-w-[300px] mt-1.5"><ProgressBar pct={clusterPct} size="sm" /></div>
              </div>
              <div className="text-right flex-shrink-0 mr-2"><div className={`text-xl font-extrabold ${clusterPct === 100 ? 'text-emerald-400' : 'text-white'}`}>{clusterPct}%</div><div className="text-[11px] text-gh-text-muted">{clusterOptDone}/{clusterOptTotal}</div></div>
              {isExp ? <ChevronDown className="w-5 h-5 text-gh-text-muted" /> : <ChevronRight className="w-5 h-5 text-gh-text-muted" />}
            </div>
            {isExp && (
              <div className="px-6 pb-6 border-t border-white/[0.08]">
                {/* Fetch all for this cluster */}
                <div className="flex items-center gap-3 py-3 mb-2 border-b border-white/[0.04]">
                  <button onClick={async () => {
                    const posts = allPosts.filter((p) => p.status === 'done' && p.slug);
                    for (const p of posts) { setFetchingPages((prev) => ({ ...prev, [`${cluster.id}-${p.idx}`]: true })); await fetchAndScanPage(p.slug!); setFetchingPages((prev) => { const n = { ...prev }; delete n[`${cluster.id}-${p.idx}`]; return n; }); await new Promise((r) => setTimeout(r, 500)); }
                  }} className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-nc-gold/40 bg-nc-gold/[0.08] text-nc-gold"><Zap className="w-3 h-3 inline mr-1" />Fetch All ({allPosts.filter((p) => p.status === 'done' && p.slug).length})</button>
                </div>
                {allPosts.map((post) => {
                  const isLive = post.status === 'done';
                  const pgDone = OPT_ITEMS.filter((oi) => isDone(`op-${cluster.id}-${post.idx}-${oi.id}`)).length;
                  const fKey = `${cluster.id}-${post.idx}`;
                  const hasSaved = !!(savedHTML[post.slug || '']);
                  return (
                    <div key={post.idx} id={post.slug ? `opt-page-${post.slug}` : undefined} className="mt-4" style={{ opacity: isLive ? 1 : 0.5, boxShadow: highlightSlug === post.slug ? '0 0 0 2px #FFC72C, 0 0 24px rgba(255,199,44,0.3)' : 'none', borderRadius: highlightSlug === post.slug ? 10 : 0 }}>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {post.idx === 0 && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase" style={{ background: `${ph.color}30`, color: ph.color }}>Pillar</span>}
                          <span className={`text-sm font-semibold ${isLive ? 'text-white' : 'text-gh-text-muted'}`}>{post.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {post.slug && isLive && <button onClick={async () => { setFetchingPages((p) => ({ ...p, [fKey]: true })); await fetchAndScanPage(post.slug!); setFetchingPages((p) => { const n = { ...p }; delete n[fKey]; return n; }); }} disabled={!!fetchingPages[fKey]} className="px-2 py-1 rounded-lg text-[10px] font-bold border border-nc-gold/20 text-nc-gold hover:bg-nc-gold/10 disabled:opacity-40">{fetchingPages[fKey] ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Zap className="w-3 h-3 inline" />} Fetch</button>}
                          {hasSaved && <button onClick={() => { const html = savedHTML[post.slug!]; if (html) { const r = scan67(html); OPT_ITEMS.forEach((oi) => { /* auto-check would require more scan logic */ }); } }} className="px-2 py-1 rounded-lg text-[10px] font-bold border border-blue-400/30 text-blue-400 hover:bg-blue-400/10">⟳ Re-scan</button>}
                          {post.slug && isLive && <button onClick={() => navigateToTab('pageBuilder', { slug: post.slug!, title: post.name, mode: 'fix' })} className="px-2 py-1 rounded-lg text-[10px] font-bold border border-teal-500/30 text-teal-400 hover:bg-teal-500/10">📂 Load</button>}
                          <span className={`text-xs font-bold ${pgDone === OPT_ITEMS.length ? 'text-emerald-400' : 'text-gh-text-muted'}`}>{pgDone}/{OPT_ITEMS.length}</span>
                        </div>
                      </div>
                      {post.slug && <div className="text-[10px] text-gh-text-faint mb-2 -mt-1">/{post.slug}</div>}
                      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                        {OPT_ITEMS.map((oi, oIdx) => {
                          const tid = `op-${cluster.id}-${post.idx}-${oi.id}`;
                          const d = isDone(tid);
                          const catColor = CAT_COLORS[oi.cat] || '#6B7B8D';
                          return (
                            <div key={oi.id} className={`flex items-start gap-2.5 py-2 text-sm ${oIdx < OPT_ITEMS.length - 1 ? 'border-b border-white/[0.03]' : ''}`} style={{ animation: recentId === tid ? 'donePulse 1s ease' : 'none' }}>
                              <TaskCheck checked={d} onToggle={() => toggle(tid)} />
                              <div className="flex-1 min-w-0">
                                <span className={`text-xs transition-all ${d ? 'text-emerald-400 line-through' : 'text-gh-text-soft'}`}>{oi.label}</span>
                                {d && <NoteField value={getNote(tid)} onChange={(v) => setNote(tid, v)} />}
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0" style={{ color: catColor, background: `${catColor}15` }}>{oi.cat}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ═══ WEEKLY CONTENT SCHEDULE ═══ */}
      <div className="mt-8">
        <div className="text-[11px] font-extrabold tracking-widest text-teal-400 uppercase mb-4">Weekly Content Schedule</div>
        <div className="card p-5 mb-4">
          <div className="flex justify-between mb-2"><span className="text-sm font-bold text-white">Overall Progress</span><span className="text-sm font-extrabold text-emerald-400">{calDone}/{calTotal} ({calTotal > 0 ? Math.round((calDone / calTotal) * 100) : 0}%)</span></div>
          <ProgressBar pct={calTotal > 0 ? Math.round((calDone / calTotal) * 100) : 0} />
        </div>
        {calendarWeeks.map((w) => {
          const ph = PHASES.find((p) => p.id === w.phase) || PHASES[0];
          const wkDone = w.tasks.filter((_, i) => isDone(`cal-${w.week}-${i}`)).length;
          const allDone = wkDone === w.tasks.length;
          return (
            <div key={w.week} className="rounded-2xl mb-3 overflow-hidden" style={{ background: allDone ? 'rgba(22,163,74,0.06)' : 'rgba(255,255,255,0.03)', border: allDone ? '2px solid rgba(22,163,74,0.25)' : '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-col" style={{ background: allDone ? '#16A34A' : ph.color }}>
                    {allDone ? <Check className="w-5 h-5 text-white" /> : <><span className="text-[9px] font-bold text-white">WK</span><span className="text-base font-extrabold text-white">{w.week}</span></>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap"><h4 className="text-base font-bold text-white">{w.focus}</h4>{allDone && <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">COMPLETE</span>}</div>
                    <div className="text-xs text-gh-text-muted mt-0.5">{w.dates} · Phase {w.phase}</div>
                  </div>
                </div>
                <span className={`text-sm font-bold ${allDone ? 'text-emerald-400' : 'text-gh-text-muted'}`}>{wkDone}/{w.tasks.length}</span>
              </div>
              <div className="px-6 py-3">
                {w.tasks.map((t, i) => {
                  const tid = `cal-${w.week}-${i}`;
                  const d = isDone(tid);
                  const tc = TYPE_COLORS[t.type] || { color: '#6B7B8D' };
                  return (
                    <div key={i} className={`flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0 ${d ? 'opacity-50' : ''}`} style={{ animation: recentId === tid ? 'donePulse 1s ease' : 'none' }}>
                      <TaskCheck checked={d} onToggle={() => toggle(tid)} />
                      <span className={`flex-1 text-xs ${d ? 'text-emerald-400 line-through' : 'text-gh-text-soft'}`}>{t.task}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0" style={{ color: tc.color, background: `${tc.color}15` }}>{t.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
