'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Search, Plus, X, ArrowUp, ArrowDown, Minus, Download,
  ExternalLink, Pencil, Loader2,
} from 'lucide-react';
import { DEFAULT_KEYWORDS, KEYWORD_GROUPS, SAMPLE_KEYWORD_HISTORY } from '@/data/keywords';
import { getFromStorage, saveToStorage, formatNumber } from '@/lib/utils';
import { pullKeywordFromGSC, getGSCToken, startGSCAuth, getGSCClientId, captureOAuthToken } from '@/lib/gsc';
import type { TrackedKeyword, KeywordHistory, KeywordNotes, KeywordGroup, KeywordGroupConfig } from '@/types';

// ── localStorage keys (compatible with v1) ──
const LS_KEYWORDS = 'gh-cc-kw-keywords';
const LS_HISTORY = 'gh-cc-kw-history';
const LS_NOTES = 'gh-cc-kw-notes';
const LS_LAST_PULL = 'gh-cc-kw-lastpull';

// ── Sparkline subcomponent ──
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

// ── Movement indicator ──
function MoveBadge({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) {
    return <span className="text-gh-text-faint">→</span>;
  }
  const diff = Math.round((previous - current) * 10) / 10;
  if (Math.abs(diff) < 0.5) return <span className="text-gh-text-faint">→</span>;
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
        <ArrowUp className="w-3 h-3" />
        {Math.abs(Math.round(diff))}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold">
      <ArrowDown className="w-3 h-3" />
      {Math.abs(Math.round(diff))}
    </span>
  );
}

// ── Position badge with color coding ──
function PosBadge({ pos }: { pos: number | null }) {
  if (pos === null) return <span className="text-gh-text-faint text-sm">—</span>;
  const color = pos <= 10 ? 'text-emerald-400' : pos <= 20 ? 'text-amber-400' : 'text-red-400';
  return <span className={`text-sm font-bold tabular-nums ${color}`}>{pos.toFixed(1)}</span>;
}

// ════════════════════════════════════════════
// ── MAIN KEYWORD WAR ROOM PANEL ──
// ════════════════════════════════════════════
export default function KeywordWarRoom() {
  // ── State ──
  const [keywords, setKeywords] = useState<TrackedKeyword[]>(() =>
    getFromStorage(LS_KEYWORDS, DEFAULT_KEYWORDS)
  );
  const [history, setHistory] = useState<KeywordHistory>(() =>
    getFromStorage(LS_HISTORY, SAMPLE_KEYWORD_HISTORY)
  );
  const [notes, setNotes] = useState<KeywordNotes>(() =>
    getFromStorage(LS_NOTES, {})
  );
  const [lastPull, setLastPull] = useState<string | null>(() =>
    getFromStorage(LS_LAST_PULL, null)
  );
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState('');
  const [adding, setAdding] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newGroup, setNewGroup] = useState<KeywordGroup>('medicare');
  const [newPage, setNewPage] = useState('');
  const [newSlug, setNewSlug] = useState('');

  // ── Persist to localStorage ──
  useEffect(() => { saveToStorage(LS_KEYWORDS, keywords); }, [keywords]);
  useEffect(() => { saveToStorage(LS_HISTORY, history); }, [history]);
  useEffect(() => { saveToStorage(LS_NOTES, notes); }, [notes]);
  useEffect(() => { saveToStorage(LS_LAST_PULL, lastPull); }, [lastPull]);

  // ── Capture OAuth callback on mount ──
  useEffect(() => { captureOAuthToken(); }, []);

  // ── Derived data: enrich keywords with latest metrics ──
  const enriched = useMemo(() => {
    return keywords.map((kw) => {
      const hist = history[kw.keyword] || [];
      const latest = hist.length > 0 ? hist[hist.length - 1] : null;
      const prev = hist.length > 1 ? hist[hist.length - 2] : null;
      return {
        ...kw,
        pos: latest?.pos ?? null,
        clicks: latest?.clicks ?? 0,
        impr: latest?.impr ?? 0,
        ctr: latest?.ctr ?? 0,
        prevPos: prev?.pos ?? null,
        hist: hist.map((h) => h.pos),
        note: notes[kw.keyword] || '',
      };
    }).sort((a, b) => {
      if (a.pos === null) return 1;
      if (b.pos === null) return -1;
      return a.pos - b.pos;
    });
  }, [keywords, history, notes]);

  // ── Stats ──
  const stats = useMemo(() => {
    const withPos = enriched.filter((k) => k.pos !== null);
    return {
      tracking: `${keywords.length}/25`,
      page1: withPos.filter((k) => k.pos! <= 10).length,
      striking: withPos.filter((k) => k.pos! > 10 && k.pos! <= 20).length,
      page3: withPos.filter((k) => k.pos! > 20).length,
      noData: enriched.filter((k) => k.pos === null).length,
    };
  }, [enriched, keywords.length]);

  // ── Group keywords ──
  const grouped = useMemo(() => {
    const map: Record<string, typeof enriched> = {};
    KEYWORD_GROUPS.forEach((g) => {
      map[g.id] = enriched.filter((k) => k.group === g.id);
    });
    return map;
  }, [enriched]);

  // ── GSC Pull ──
  const pullFromGSC = useCallback(async () => {
    const token = getGSCToken();
    if (!token) {
      const clientId = getGSCClientId();
      if (clientId) {
        startGSCAuth(clientId);
      } else {
        alert('No GSC OAuth token found. Connect Google first.');
      }
      return;
    }

    setPulling(true);
    const errors: string[] = [];
    const newHist = { ...history };
    const dateLabel = new Date().toISOString().split('T')[0];

    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      setPullProgress(`${i + 1}/${keywords.length}: ${kw.keyword}`);
      try {
        const result = await pullKeywordFromGSC(token, kw.keyword);
        if (result) {
          if (!newHist[kw.keyword]) newHist[kw.keyword] = [];
          const existing = newHist[kw.keyword].find((h) => h.date === dateLabel);
          if (!existing) {
            newHist[kw.keyword].push({
              date: dateLabel,
              pos: result.pos,
              clicks: result.clicks,
              impr: result.impr,
              ctr: result.ctr,
              variants: result.variants,
            });
            if (newHist[kw.keyword].length > 12) {
              newHist[kw.keyword] = newHist[kw.keyword].slice(-12);
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${kw.keyword}: ${msg}`);
        if (msg.includes('token expired')) break;
      }
    }

    setHistory(newHist);
    setLastPull(new Date().toISOString());
    setPulling(false);
    setPullProgress('');

    if (errors.length > 0) {
      alert('GSC issues:\n' + errors.join('\n'));
    }
  }, [history, keywords]);

  // ── Add keyword ──
  const addKeyword = useCallback(() => {
    if (!newWord.trim()) return;
    const exists = keywords.find((k) => k.keyword.toLowerCase() === newWord.trim().toLowerCase());
    if (exists) { alert('Already tracking: ' + newWord); return; }
    setKeywords((prev) => [...prev, {
      keyword: newWord.trim().toLowerCase(),
      group: newGroup,
      targetPage: newPage,
      targetSlug: newSlug,
    }]);
    setNewWord('');
    setNewPage('');
    setNewSlug('');
  }, [newWord, newGroup, newPage, newSlug, keywords]);

  // ── Remove keyword ──
  const removeKeyword = useCallback((kw: string) => {
    if (!confirm(`Remove "${kw}" from tracking?`)) return;
    setKeywords((prev) => prev.filter((k) => k.keyword !== kw));
  }, []);

  // ── Load defaults ──
  const loadDefaults = useCallback(() => {
    if (confirm('Load the GSC-optimized 25 keywords? This will replace your current list and clear history.')) {
      setKeywords(DEFAULT_KEYWORDS);
      setHistory({});
      setNotes({});
    }
  }, []);

  // ── Update note ──
  const updateNote = useCallback((kw: string, note: string) => {
    setNotes((prev) => ({ ...prev, [kw]: note }));
  }, []);

  // ── Input styles ──
  const inputCls = "px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs font-body outline-none focus:border-carolina/40 transition-colors";

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <span className="text-lg">🎯</span> Keyword War Room
          </h2>
          <p className="text-xs text-gh-text-muted mt-1">
            Track your top 25 money keywords · GSC 28-day data · contains matching · 12-week trends
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {lastPull && (
            <span className="text-[10px] text-gh-text-faint">
              Last pull: {new Date(lastPull).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={pullFromGSC}
            disabled={pulling || keywords.length === 0}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-sky-300 to-blue-300 text-sky-900 hover:brightness-110"
          >
            {pulling ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {pullProgress || 'Pulling...'}
              </span>
            ) : (
              '📡 Pull GSC Data'
            )}
          </button>
          <button
            onClick={() => setAdding(!adding)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
          >
            {adding ? 'Done' : '+ Add Keyword'}
          </button>
          {keywords.length < 25 && (
            <button
              onClick={loadDefaults}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-nc-gold/30 bg-nc-gold/[0.08] text-nc-gold hover:bg-nc-gold/[0.15] transition-colors"
            >
              🎯 Load GSC-Optimized 25
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'TRACKING', value: stats.tracking, color: 'text-white' },
          { label: 'PAGE 1 (1-10)', value: stats.page1, color: 'text-emerald-400' },
          { label: 'STRIKING (11-20)', value: stats.striking, color: 'text-amber-400' },
          { label: 'PAGE 3+ (21+)', value: stats.page3, color: 'text-red-400' },
          { label: 'NO DATA', value: stats.noData, color: 'text-gh-text-muted' },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <div className={`text-xl font-extrabold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-semibold text-gh-text-muted uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Add Keyword Form ── */}
      {adding && (
        <div className="card p-4 space-y-3">
          <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Add keyword to track</div>
          <div className="flex gap-2.5 items-end flex-wrap">
            <div className="flex-[2] min-w-[200px]">
              <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Keyword</label>
              <input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="e.g. medicare quotes north carolina"
                className={inputCls + ' w-full'}
              />
            </div>
            <div className="w-28">
              <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Group</label>
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value as KeywordGroup)}
                className={inputCls + ' w-full'}
              >
                {KEYWORD_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Target Page</label>
              <input
                value={newPage}
                onChange={(e) => setNewPage(e.target.value)}
                placeholder="Page name"
                className={inputCls + ' w-full'}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Slug</label>
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="/page-slug"
                className={inputCls + ' w-full'}
              />
            </div>
            <button
              onClick={addKeyword}
              disabled={!newWord.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-40 hover:bg-emerald-500 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* ── Keyword Tables by Group ── */}
      {keywords.length === 0 ? (
        <div className="text-center py-16 text-gh-text-faint">
          <div className="text-4xl mb-3">🎯</div>
          <div className="text-sm mb-1">No keywords tracked yet.</div>
          <div className="text-xs">Click &quot;+ Add Keyword&quot; to start building your war room.</div>
        </div>
      ) : (
        KEYWORD_GROUPS.map((group) => {
          const gkws = grouped[group.id];
          if (gkws.length === 0) return null;
          return (
            <div key={group.id} className="space-y-2">
              {/* Group header */}
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-sm" style={{ background: group.color }} />
                <span className="text-sm font-bold" style={{ color: group.color }}>{group.label}</span>
                <span className="text-[11px] text-gh-text-muted">{gkws.length} keywords</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['#', 'KEYWORD', 'TARGET PAGE', 'POS', 'MOVE', 'CLICKS', 'IMPR', 'CTR', '8-WK TREND', 'NOTES', ''].map((h, i) => (
                        <th
                          key={h + i}
                          className={`px-2.5 py-2 text-[10px] font-bold text-gh-text-muted uppercase tracking-wider border-b border-white/[0.06] whitespace-nowrap ${
                            i >= 3 && i <= 8 ? 'text-center' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gkws.map((kw, ki) => (
                      <tr key={kw.keyword} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        {/* # */}
                        <td className="px-2.5 py-3 text-xs text-gh-text-faint tabular-nums">{ki + 1}</td>

                        {/* Keyword */}
                        <td className="px-2.5 py-3">
                          <span className="text-xs font-semibold text-white">{kw.keyword}</span>
                        </td>

                        {/* Target page */}
                        <td className="px-2.5 py-3">
                          <div className="text-xs text-gh-text-soft">{kw.targetPage}</div>
                          <div className="text-[10px] text-gh-text-faint truncate max-w-[220px]">{kw.targetSlug}</div>
                        </td>

                        {/* Position */}
                        <td className="px-2.5 py-3 text-center">
                          <PosBadge pos={kw.pos} />
                        </td>

                        {/* Movement */}
                        <td className="px-2.5 py-3 text-center">
                          <MoveBadge current={kw.pos} previous={kw.prevPos} />
                        </td>

                        {/* Clicks */}
                        <td className="px-2.5 py-3 text-center text-xs text-gh-text-soft tabular-nums">
                          {kw.clicks}
                        </td>

                        {/* Impressions */}
                        <td className="px-2.5 py-3 text-center text-xs text-gh-text-soft tabular-nums">
                          {formatNumber(kw.impr)}
                        </td>

                        {/* CTR */}
                        <td className="px-2.5 py-3 text-center text-xs text-gh-text-soft tabular-nums">
                          {kw.ctr > 0 ? `${kw.ctr}%` : '0%'}
                        </td>

                        {/* 8-wk trend sparkline */}
                        <td className="px-2.5 py-3 text-center">
                          <TrendSpark
                            data={kw.hist}
                            color={
                              kw.hist.length >= 2 && kw.hist[kw.hist.length - 1] < kw.hist[kw.hist.length - 2]
                                ? '#4ADE80'
                                : kw.hist.length >= 2
                                ? '#EF4444'
                                : '#6B7B8D'
                            }
                          />
                        </td>

                        {/* Notes */}
                        <td className="px-2.5 py-3">
                          <button
                            onClick={() => {
                              const n = prompt(`Note for "${kw.keyword}":`, kw.note);
                              if (n !== null) updateNote(kw.keyword, n);
                            }}
                            className="text-[10px] text-gh-text-faint hover:text-carolina transition-colors px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06] whitespace-nowrap"
                          >
                            {kw.note || 'Why it moved...'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-2.5 py-3">
                          <div className="flex items-center gap-1">
                            <a
                              href={`https://generationhealth.me${kw.targetSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-gh-text-faint hover:text-carolina transition-colors"
                              title="View page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => removeKeyword(kw.keyword)}
                              className="p-1 text-gh-text-faint hover:text-red-400 transition-colors"
                              title="Remove"
                            >
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
  );
}
