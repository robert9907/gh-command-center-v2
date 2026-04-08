'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, Clock, Send, FileText, ExternalLink, Plus, Loader2, RefreshCw } from 'lucide-react';
import { clusters } from '@/data/clusters';
import { getFromStorage, saveToStorage } from '@/lib/utils';
import { useAppState } from '@/lib/AppState';
import { getGSCToken } from '@/lib/gsc';

const LS_IDX_PAGES = 'gh-cc-idx-pages';
const LS_IDX_LOG = 'gh-cc-idx-log';
const LS_IDX_KEY = 'gh-cc-idx-indexnow-key';

interface IndexPage { url: string; status: 'unknown' | 'submitted' | 'crawled' | 'indexed' | 'discovered'; lastSubmit?: string; lastCheck?: string; pageName?: string }
interface LogEntry { id: number; ts: string; action: string; url: string; status: string; details: string }

export default function IndexingPanel() {
  const { aeoPipeline } = useAppState();
  const [pages, setPages] = useState<IndexPage[]>(() => getFromStorage(LS_IDX_PAGES, []));
  const [log, setLog] = useState<LogEntry[]>(() => getFromStorage(LS_IDX_LOG, []));
  const [indexNowKey, setIndexNowKey] = useState(() => getFromStorage(LS_IDX_KEY, ''));
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { saveToStorage(LS_IDX_PAGES, pages); }, [pages]);
  useEffect(() => { saveToStorage(LS_IDX_LOG, log); }, [log]);
  useEffect(() => { saveToStorage(LS_IDX_KEY, indexNowKey); }, [indexNowKey]);

  const addLog = useCallback((action: string, url: string, status: string, details = '') => {
    setLog((prev) => [{ id: Date.now(), ts: new Date().toISOString(), action, url, status, details }, ...prev.slice(0, 99)]);
  }, []);

  const stats = useMemo(() => ({ total: pages.length, indexed: pages.filter((p) => p.status === 'indexed').length, submitted: pages.filter((p) => p.status === 'submitted').length, crawled: pages.filter((p) => p.status === 'crawled').length, discovered: pages.filter((p) => p.status === 'discovered').length, unknown: pages.filter((p) => p.status === 'unknown').length }), [pages]);

  // Load from clusters + AEO pipeline
  const loadFromClusters = useCallback(() => {
    const urls = new Set(pages.map((p) => p.url));
    const newPages: IndexPage[] = [...pages];
    clusters.forEach((c) => { c.posts.forEach((p) => { if (p.slug && p.status === 'done') { const url = `https://generationhealth.me/${p.slug}`; if (!urls.has(url)) { newPages.push({ url, status: 'unknown', pageName: p.name }); urls.add(url); } } }); });
    // Also add AEO pipeline pages
    aeoPipeline.forEach((p) => { const url = `https://generationhealth.me/${p.slug}`; if (!urls.has(url)) { newPages.push({ url, status: 'unknown', pageName: `🎯 ${p.title}` }); urls.add(url); } });
    setPages(newPages);
    addLog('import', 'clusters+pipeline', 'done', `${newPages.length - pages.length} new pages added`);
  }, [pages, aeoPipeline, addLog]);

  // IndexNow submission
  const submitIndexNow = useCallback(async (urls: string[]) => {
    if (!indexNowKey) { alert('Enter your IndexNow key in settings first'); return; }
    setSubmitting(true);
    try {
      const payload = { host: 'generationhealth.me', key: indexNowKey, keyLocation: `https://generationhealth.me/${indexNowKey}.txt`, urlList: urls, url: urls[0] };
      const resp = await fetch('https://generationhealth.me/tools/indexnow-proxy.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await resp.json();
      if (data.success) {
        const okCount = data.results?.filter((r: { ok: boolean }) => r.ok).length || 0;
        addLog('indexnow', `${urls.length} URLs`, 'submitted', `${okCount}/3 engines accepted`);
        setPages((prev) => prev.map((p) => urls.includes(p.url) ? { ...p, status: 'submitted' as const, lastSubmit: new Date().toISOString() } : p));
        alert(`IndexNow submitted! ${urls.length} URL(s) sent to ${okCount}/3 engines.`);
      } else { addLog('indexnow', `${urls.length} URLs`, 'error', data.error || 'Unknown'); alert('IndexNow error: ' + (data.error || 'Unknown')); }
    } catch (e) { addLog('indexnow', `${urls.length} URLs`, 'error', e instanceof Error ? e.message : String(e)); alert('IndexNow error: ' + (e instanceof Error ? e.message : String(e))); }
    setSubmitting(false);
  }, [indexNowKey, addLog]);

  // GSC Indexing API
  const requestGscIndexing = useCallback(async (url: string) => {
    const token = getGSCToken();
    if (!token) { alert('Connect via Performance > GA4 first (OAuth required)'); return; }
    setSubmitting(true);
    try {
      const resp = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: 'URL_UPDATED' }),
      });
      if (resp.ok) { addLog('gsc', url, 'submitted', 'Indexing requested via API'); setPages((prev) => prev.map((p) => p.url === url ? { ...p, status: 'submitted' as const, lastSubmit: new Date().toISOString() } : p)); }
      else { const err = await resp.text(); addLog('gsc', url, 'error', `${resp.status}: ${err.slice(0, 100)}`); }
    } catch (e) { addLog('gsc', url, 'error', e instanceof Error ? e.message : String(e)); }
    setSubmitting(false);
  }, [addLog]);

  // URL Inspection API
  const checkGscStatus = useCallback(async (url: string) => {
    const token = getGSCToken();
    if (!token) return;
    try {
      const resp = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl: url, siteUrl: 'https://generationhealth.me/' }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const coverageState = data.inspectionResult?.indexStatusResult?.coverageState || 'unknown';
        const status = coverageState === 'Submitted and indexed' ? 'indexed' : coverageState.includes('not indexed') ? (coverageState.includes('Crawled') ? 'crawled' : 'discovered') : 'unknown';
        setPages((prev) => prev.map((p) => p.url === url ? { ...p, status: status as IndexPage['status'], lastCheck: new Date().toISOString() } : p));
        addLog('inspect', url, status, coverageState);
      }
    } catch (e) { addLog('inspect', url, 'error', e instanceof Error ? e.message : String(e)); }
  }, [addLog]);

  // Bulk check
  const checkAll = useCallback(async () => {
    const token = getGSCToken();
    if (!token) { alert('Connect OAuth first'); return; }
    setChecking(true);
    for (const p of pages) {
      await checkGscStatus(p.url);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setChecking(false);
  }, [pages, checkGscStatus]);

  const openGSC = useCallback(() => { window.open('https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fgenerationhealth.me%2F', '_blank'); addLog('ping', 'google', 'sent', 'Opened GSC'); }, [addLog]);

  const generateSitemap = useCallback(() => {
    if (pages.length === 0) return;
    const now = new Date().toISOString().split('T')[0];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    pages.forEach((p) => { xml += `  <url>\n    <loc>${p.url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`; });
    xml += '</urlset>';
    const blob = new Blob([xml], { type: 'application/xml' }); const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = 'sitemap.xml'; a.click(); URL.revokeObjectURL(u);
    addLog('sitemap', 'sitemap.xml', 'generated', `${pages.length} URLs`);
  }, [pages, addLog]);

  const statusColor = (s: string) => s === 'indexed' ? 'text-emerald-400' : s === 'submitted' ? 'text-amber-400' : s === 'crawled' ? 'text-blue-400' : s === 'discovered' ? 'text-purple-400' : 'text-gh-text-faint';
  const StatusIcon = ({ status }: { status: string }) => status === 'indexed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : status === 'submitted' ? <Clock className="w-3.5 h-3.5 text-amber-400" /> : status === 'crawled' ? <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> : <X className="w-3.5 h-3.5 text-gh-text-faint" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="font-display text-xl font-bold text-white flex items-center gap-2"><span>✏️</span> Indexing Accelerator</h2><p className="text-xs text-gh-text-muted mt-1">IndexNow · GSC API · URL Inspection · Sitemap</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadFromClusters} className="px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]"><Plus className="w-3 h-3 inline mr-1" />Load Pages</button>
          <button onClick={checkAll} disabled={checking || pages.length === 0} className="px-3 py-2 rounded-xl text-xs font-bold border border-carolina/30 bg-carolina/10 text-carolina disabled:opacity-40">{checking ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : <RefreshCw className="w-3 h-3 inline mr-1" />}Check All</button>
          <button onClick={() => submitIndexNow(pages.filter((p) => p.status !== 'indexed').map((p) => p.url))} disabled={submitting || !indexNowKey} className="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 disabled:opacity-40"><Send className="w-3 h-3 inline mr-1" />IndexNow All</button>
          <button onClick={openGSC} className="px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft"><ExternalLink className="w-3 h-3 inline mr-1" />GSC</button>
          <button onClick={generateSitemap} disabled={pages.length === 0} className="px-3 py-2 rounded-xl text-xs font-bold border border-nc-gold/30 bg-nc-gold/10 text-nc-gold disabled:opacity-40"><FileText className="w-3 h-3 inline mr-1" />Sitemap</button>
          <button onClick={() => setShowSettings(!showSettings)} className="px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 text-gh-text-muted">⚙️</button>
        </div>
      </div>
      {showSettings && <div className="card p-4"><label className="text-[10px] font-bold text-gh-text-muted block mb-1">IndexNow API Key</label><input value={indexNowKey} onChange={(e) => setIndexNowKey(e.target.value)} placeholder="Your IndexNow key" className="w-full max-w-md px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none" /></div>}
      <div className="grid grid-cols-6 gap-3">
        {[{ label: 'TOTAL', value: stats.total, color: 'text-white' }, { label: 'INDEXED', value: stats.indexed, color: 'text-emerald-400' }, { label: 'SUBMITTED', value: stats.submitted, color: 'text-amber-400' }, { label: 'CRAWLED', value: stats.crawled, color: 'text-blue-400' }, { label: 'DISCOVERED', value: stats.discovered, color: 'text-purple-400' }, { label: 'UNKNOWN', value: stats.unknown, color: 'text-gh-text-muted' }].map((s) => (
          <div key={s.label} className="card p-3 text-center"><div className={`text-xl font-extrabold tabular-nums ${s.color}`}>{s.value}</div><div className="text-[10px] font-semibold text-gh-text-muted uppercase tracking-wider mt-0.5">{s.label}</div></div>
        ))}
      </div>
      {pages.length === 0 ? (
        <div className="card p-12 text-center"><div className="text-4xl mb-3">🚀</div><div className="text-sm text-gh-text-muted mb-2">No pages tracked.</div><button onClick={loadFromClusters} className="px-4 py-2 rounded-xl text-xs font-bold bg-carolina text-white">Load from Clusters + Pipeline</button></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr>{['STATUS', 'PAGE', 'URL', 'LAST SUBMIT', 'ACTIONS'].map((h) => <th key={h} className="px-2.5 py-2 text-[10px] font-bold text-gh-text-muted uppercase tracking-wider border-b border-white/[0.06] text-left">{h}</th>)}</tr></thead>
            <tbody>
              {pages.map((p, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-2.5 py-2.5"><span className={`flex items-center gap-1 text-xs font-semibold capitalize ${statusColor(p.status)}`}><StatusIcon status={p.status} />{p.status}</span></td>
                  <td className="px-2.5 py-2.5 text-xs text-white">{p.pageName || '—'}</td>
                  <td className="px-2.5 py-2.5 text-[10px] text-gh-text-faint truncate max-w-[250px]">{p.url}</td>
                  <td className="px-2.5 py-2.5 text-[10px] text-gh-text-faint">{p.lastSubmit ? new Date(p.lastSubmit).toLocaleDateString() : '—'}</td>
                  <td className="px-2.5 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => requestGscIndexing(p.url)} disabled={submitting} className="px-2 py-1 rounded text-[10px] font-bold border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 disabled:opacity-40" title="Request via GSC API">GSC</button>
                      <button onClick={() => checkGscStatus(p.url)} className="px-2 py-1 rounded text-[10px] font-bold border border-purple-400/30 text-purple-400 hover:bg-purple-400/10" title="Check status">?</button>
                      <button onClick={() => setPages((prev) => prev.map((pg) => pg.url === p.url ? { ...pg, status: 'indexed' as const } : pg))} className="px-2 py-1 rounded text-[10px] font-bold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" title="Mark indexed">✓</button>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded text-[10px] border border-white/10 text-gh-text-faint hover:bg-white/[0.04] flex items-center"><ExternalLink className="w-3 h-3" /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {log.length > 0 && (
        <div className="card p-4"><div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest mb-3">Activity Log</div><div className="space-y-1 max-h-[200px] overflow-y-auto">{log.slice(0, 20).map((entry) => (<div key={entry.id} className="flex items-center gap-2 text-[11px] text-gh-text-faint py-1 border-b border-white/[0.03]"><span className="text-gh-text-muted">{new Date(entry.ts).toLocaleTimeString()}</span><span className="font-semibold text-gh-text-soft">{entry.action}</span><span className="truncate flex-1">{entry.details}</span></div>))}</div></div>
      )}
    </div>
  );
}
