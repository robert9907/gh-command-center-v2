'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Check, X, Clock, Send, FileText, ExternalLink, Plus, Loader2, RefreshCw, Search, Filter, AlertTriangle, Download, Upload, Trash2, ArrowUpDown } from 'lucide-react';
import { clusters } from '@/data/clusters';
import { getFromStorage, saveToStorage } from '@/lib/utils';
import { useAppState } from '@/lib/AppState';
import { getGSCToken } from '@/lib/gsc';

// ── localStorage Keys ──
const LS_IDX_PAGES = 'gh-cc-idx-pages';
const LS_IDX_LOG = 'gh-cc-idx-log';
const LS_IDX_KEY = 'gh-cc-idx-indexnow-key';

// ── Types ──
type PageStatus = 'unknown' | 'submitted' | 'crawled' | 'indexed' | 'discovered' | 'error';
type SortField = 'status' | 'pageName' | 'lastSubmit' | 'lastCheck';
type SortDir = 'asc' | 'desc';

interface IndexPage {
  url: string;
  status: PageStatus;
  lastSubmit?: string;
  lastCheck?: string;
  pageName?: string;
  source?: 'cluster' | 'pipeline' | 'sitemap' | 'manual';
  coverageState?: string;
}

interface LogEntry {
  id: number;
  ts: string;
  action: string;
  url: string;
  status: string;
  details: string;
}

// ═══════════════════════════════════════════════════
// INDEXING ACCELERATOR
// ═══════════════════════════════════════════════════
export default function IndexingPanel() {
  const { aeoPipeline } = useAppState();

  // ── State ──
  const [pages, setPages] = useState<IndexPage[]>(() => getFromStorage(LS_IDX_PAGES, []));
  const [log, setLog] = useState<LogEntry[]>(() => getFromStorage(LS_IDX_LOG, []));
  const [indexNowKey, setIndexNowKey] = useState(() => getFromStorage(LS_IDX_KEY, ''));

  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState<{ done: number; total: number } | null>(null);
  const [importingSitemap, setImportingSitemap] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showAddUrl, setShowAddUrl] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [bulkUrlInput, setBulkUrlInput] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const [filterStatus, setFilterStatus] = useState<PageStatus | 'all' | 'needs-attention'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const abortRef = useRef(false);

  // ── Persist ──
  useEffect(() => { saveToStorage(LS_IDX_PAGES, pages); }, [pages]);
  useEffect(() => { saveToStorage(LS_IDX_LOG, log); }, [log]);
  useEffect(() => { saveToStorage(LS_IDX_KEY, indexNowKey); }, [indexNowKey]);

  // ── Helpers ──
  const addLog = useCallback((action: string, url: string, status: string, details = '') => {
    setLog((prev) => [{ id: Date.now(), ts: new Date().toISOString(), action, url, status, details }, ...prev.slice(0, 199)]);
  }, []);

  const normalizeUrl = (url: string): string => {
    let u = url.trim();
    if (!u.startsWith('http')) u = `https://generationhealth.me/${u.replace(/^\//, '')}`;
    u = u.replace(/\/+$/, '');
    return u;
  };

  // ── Stats ──
  const stats = useMemo(() => {
    const s = { total: pages.length, indexed: 0, submitted: 0, crawled: 0, discovered: 0, unknown: 0, error: 0, needsAttention: 0 };
    pages.forEach((p) => {
      if (p.status === 'indexed') s.indexed++;
      else if (p.status === 'submitted') s.submitted++;
      else if (p.status === 'crawled') { s.crawled++; s.needsAttention++; }
      else if (p.status === 'discovered') { s.discovered++; s.needsAttention++; }
      else if (p.status === 'error') { s.error++; s.needsAttention++; }
      else s.unknown++;
    });
    return s;
  }, [pages]);

  // ── Filtered + sorted pages ──
  const filteredPages = useMemo(() => {
    let result = [...pages];
    if (filterStatus === 'needs-attention') {
      result = result.filter((p) => ['crawled', 'discovered', 'error', 'unknown'].includes(p.status));
    } else if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.url.toLowerCase().includes(q) || (p.pageName || '').toLowerCase().includes(q));
    }
    const statusOrder: Record<PageStatus, number> = { error: 0, discovered: 1, crawled: 2, unknown: 3, submitted: 4, indexed: 5 };
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'status') cmp = statusOrder[a.status] - statusOrder[b.status];
      else if (sortField === 'pageName') cmp = (a.pageName || '').localeCompare(b.pageName || '');
      else if (sortField === 'lastSubmit') cmp = (a.lastSubmit || '').localeCompare(b.lastSubmit || '');
      else if (sortField === 'lastCheck') cmp = (a.lastCheck || '').localeCompare(b.lastCheck || '');
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [pages, filterStatus, searchQuery, sortField, sortDir]);

  // ══════════════════════════════════════
  // LOAD PAGES — from clusters + pipeline
  // ══════════════════════════════════════
  const loadFromClusters = useCallback(() => {
    const urls = new Set(pages.map((p) => p.url));
    const newPages: IndexPage[] = [...pages];
    let added = 0;
    clusters.forEach((c) => {
      c.posts.forEach((p) => {
        if (p.slug) {
          const url = normalizeUrl(p.slug);
          if (!urls.has(url)) {
            newPages.push({ url, status: 'unknown', pageName: p.name, source: 'cluster' });
            urls.add(url);
            added++;
          }
        }
      });
    });
    aeoPipeline.forEach((p) => {
      const url = normalizeUrl(p.slug);
      if (!urls.has(url)) {
        newPages.push({ url, status: 'unknown', pageName: `🎯 ${p.title}`, source: 'pipeline' });
        urls.add(url);
        added++;
      }
    });
    setPages(newPages);
    addLog('import', 'clusters+pipeline', 'done', `${added} new pages added (${newPages.length} total)`);
  }, [pages, aeoPipeline, addLog]);

  // ══════════════════════════════════════
  // IMPORT SITEMAP — fetch sitemap.xml
  // ══════════════════════════════════════
  const importSitemap = useCallback(async () => {
    setImportingSitemap(true);
    try {
      let sitemapUrls: string[] = [];
      for (const sitemapUrl of [
        'https://generationhealth.me/sitemap_index.xml',
        'https://generationhealth.me/sitemap.xml',
        'https://generationhealth.me/post-sitemap.xml',
        'https://generationhealth.me/page-sitemap.xml',
      ]) {
        try {
          const resp = await fetch(sitemapUrl);
          if (!resp.ok) continue;
          const text = await resp.text();
          const locMatches = text.match(/<loc>([^<]+)<\/loc>/g);
          if (locMatches) {
            for (const m of locMatches) {
              const url = m.replace(/<\/?loc>/g, '').trim();
              if (url.endsWith('.xml')) {
                try {
                  const subResp = await fetch(url);
                  if (subResp.ok) {
                    const subText = await subResp.text();
                    const subLocs = subText.match(/<loc>([^<]+)<\/loc>/g);
                    if (subLocs) {
                      subLocs.forEach((sl) => {
                        const subUrl = sl.replace(/<\/?loc>/g, '').trim();
                        if (!subUrl.endsWith('.xml')) sitemapUrls.push(subUrl);
                      });
                    }
                  }
                } catch { /* skip sub-sitemap errors */ }
              } else {
                sitemapUrls.push(url);
              }
            }
          }
        } catch { /* try next sitemap URL */ }
      }
      sitemapUrls = Array.from(new Set(sitemapUrls));
      if (sitemapUrls.length === 0) {
        alert('No URLs found in sitemap. Check that generationhealth.me/sitemap_index.xml or /sitemap.xml exists.');
        addLog('sitemap-import', 'sitemap', 'error', 'No URLs found');
        setImportingSitemap(false);
        return;
      }
      const existingUrls = new Set(pages.map((p) => p.url));
      const newPages = [...pages];
      let added = 0;
      for (const rawUrl of sitemapUrls) {
        const url = rawUrl.replace(/\/+$/, '');
        if (!existingUrls.has(url) && !existingUrls.has(url + '/')) {
          const slug = url.replace('https://generationhealth.me/', '').replace(/\/$/, '');
          const pageName = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          newPages.push({ url, status: 'unknown', pageName, source: 'sitemap' });
          existingUrls.add(url);
          added++;
        }
      }
      setPages(newPages);
      addLog('sitemap-import', 'sitemap', 'done', `${added} new from sitemap (${sitemapUrls.length} total in sitemap, ${newPages.length} tracked)`);
      alert(`Imported ${added} new URLs from sitemap (${sitemapUrls.length} found total, ${newPages.length} now tracked).`);
    } catch (e) {
      addLog('sitemap-import', 'sitemap', 'error', e instanceof Error ? e.message : String(e));
      alert('Failed to fetch sitemap: ' + (e instanceof Error ? e.message : String(e)));
    }
    setImportingSitemap(false);
  }, [pages, addLog]);

  // ══════════════════════════════════════
  // ADD SINGLE URL
  // ══════════════════════════════════════
  const addSingleUrl = useCallback(() => {
    if (!newUrlInput.trim()) return;
    const url = normalizeUrl(newUrlInput);
    if (pages.some((p) => p.url === url)) { alert('URL already tracked.'); return; }
    const slug = url.replace('https://generationhealth.me/', '').replace(/\/$/, '');
    const pageName = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    setPages((prev) => [...prev, { url, status: 'unknown', pageName, source: 'manual' }]);
    addLog('add', url, 'unknown', 'Manually added');
    setNewUrlInput('');
    setShowAddUrl(false);
  }, [newUrlInput, pages, addLog]);

  // ══════════════════════════════════════
  // BULK ADD URLs
  // ══════════════════════════════════════
  const addBulkUrls = useCallback(() => {
    const lines = bulkUrlInput.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const existingUrls = new Set(pages.map((p) => p.url));
    const newPages = [...pages];
    let added = 0;
    for (const line of lines) {
      const url = normalizeUrl(line);
      if (!existingUrls.has(url)) {
        const slug = url.replace('https://generationhealth.me/', '').replace(/\/$/, '');
        const pageName = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        newPages.push({ url, status: 'unknown', pageName, source: 'manual' });
        existingUrls.add(url);
        added++;
      }
    }
    setPages(newPages);
    addLog('bulk-add', `${lines.length} URLs`, 'done', `${added} new added`);
    setBulkUrlInput('');
    setShowBulkAdd(false);
    alert(`Added ${added} new URLs (${lines.length - added} duplicates skipped).`);
  }, [bulkUrlInput, pages, addLog]);

  // ══════════════════════════════════════
  // IndexNow SUBMISSION
  // ══════════════════════════════════════
  const submitIndexNow = useCallback(async (urls: string[]) => {
    if (!indexNowKey) { alert('Enter your IndexNow key in settings first.'); return; }
    if (urls.length === 0) { alert('No URLs to submit.'); return; }
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
      } else {
        addLog('indexnow', `${urls.length} URLs`, 'error', data.error || 'Unknown error');
        alert('IndexNow error: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      addLog('indexnow', `${urls.length} URLs`, 'error', e instanceof Error ? e.message : String(e));
      alert('IndexNow error: ' + (e instanceof Error ? e.message : String(e)));
    }
    setSubmitting(false);
  }, [indexNowKey, addLog]);

  // ══════════════════════════════════════
  // GSC INDEXING API — Request indexing
  // ══════════════════════════════════════
  const requestGscIndexing = useCallback(async (url: string) => {
    const token = getGSCToken();
    if (!token) { alert('Connect via Performance → GSC OAuth first.'); return; }
    setSubmitting(true);
    try {
      const resp = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: 'URL_UPDATED' }),
      });
      if (resp.ok) {
        addLog('gsc-index', url, 'submitted', 'Indexing request sent via GSC API');
        setPages((prev) => prev.map((p) => p.url === url ? { ...p, status: 'submitted' as const, lastSubmit: new Date().toISOString() } : p));
      } else {
        const errText = await resp.text();
        addLog('gsc-index', url, 'error', `HTTP ${resp.status}: ${errText.slice(0, 200)}`);
        alert(`GSC Indexing error (${resp.status}): ${errText.slice(0, 200)}`);
      }
    } catch (e) {
      addLog('gsc-index', url, 'error', e instanceof Error ? e.message : String(e));
    }
    setSubmitting(false);
  }, [addLog]);

  // ══════════════════════════════════════
  // GSC URL INSPECTION API — Check status
  // ══════════════════════════════════════
  const checkGscStatus = useCallback(async (url: string): Promise<string> => {
    const token = getGSCToken();
    if (!token) return 'no-token';
    try {
      const resp = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl: url, siteUrl: 'https://generationhealth.me/' }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const coverageState: string = data.inspectionResult?.indexStatusResult?.coverageState || 'unknown';
        const verdict: string = data.inspectionResult?.indexStatusResult?.verdict || '';
        let status: PageStatus = 'unknown';
        if (coverageState === 'Submitted and indexed' || verdict === 'PASS') {
          status = 'indexed';
        } else if (coverageState.includes('Crawled') && coverageState.includes('not indexed')) {
          status = 'crawled';
        } else if (coverageState.includes('Discovered') || coverageState.includes('not indexed')) {
          status = 'discovered';
        } else if (coverageState.includes('error') || coverageState.includes('Error')) {
          status = 'error';
        }
        setPages((prev) => prev.map((p) => p.url === url ? { ...p, status, lastCheck: new Date().toISOString(), coverageState } : p));
        addLog('inspect', url, status, coverageState);
        return status;
      } else {
        const errText = await resp.text();
        if (resp.status === 401) {
          addLog('inspect', url, 'error', 'OAuth token expired — reconnect in Performance tab');
        } else {
          addLog('inspect', url, 'error', `HTTP ${resp.status}: ${errText.slice(0, 150)}`);
        }
        return 'error';
      }
    } catch (e) {
      addLog('inspect', url, 'error', e instanceof Error ? e.message : String(e));
      return 'error';
    }
  }, [addLog]);

  // ══════════════════════════════════════
  // BULK CHECK ALL — with progress + abort
  // ══════════════════════════════════════
  const checkAll = useCallback(async () => {
    const token = getGSCToken();
    if (!token) { alert('Connect GSC OAuth first (Performance tab → Connect GSC).'); return; }
    setChecking(true);
    abortRef.current = false;
    const total = pages.length;
    setCheckProgress({ done: 0, total });
    let checked = 0;
    for (const p of pages) {
      if (abortRef.current) break;
      await checkGscStatus(p.url);
      checked++;
      setCheckProgress({ done: checked, total });
      await new Promise((r) => setTimeout(r, 1200));
    }
    setChecking(false);
    setCheckProgress(null);
    addLog('bulk-check', `${checked}/${total}`, 'done', abortRef.current ? 'Aborted by user' : 'Complete');
  }, [pages, checkGscStatus, addLog]);

  const stopChecking = useCallback(() => { abortRef.current = true; }, []);

  // ══════════════════════════════════════
  // REMOVE / CLEAR
  // ══════════════════════════════════════
  const removePage = useCallback((url: string) => {
    setPages((prev) => prev.filter((p) => p.url !== url));
    addLog('remove', url, 'removed', '');
  }, [addLog]);

  const clearAll = useCallback(() => {
    if (!confirm(`Remove all ${pages.length} pages from tracker? This cannot be undone.`)) return;
    setPages([]);
    addLog('clear', 'all', 'cleared', `${pages.length} pages removed`);
  }, [pages, addLog]);

  // ══════════════════════════════════════
  // GSC / SITEMAP / CSV
  // ══════════════════════════════════════
  const openGSC = useCallback(() => {
    window.open('https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fgenerationhealth.me%2F', '_blank');
    addLog('external', 'google', 'opened', 'Opened GSC');
  }, [addLog]);

  const generateSitemap = useCallback(() => {
    if (pages.length === 0) return;
    const now = new Date().toISOString().split('T')[0];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    pages.forEach((p) => { xml += `  <url>\n    <loc>${p.url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`; });
    xml += '</urlset>';
    const blob = new Blob([xml], { type: 'application/xml' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = u; a.download = 'sitemap.xml'; a.click();
    URL.revokeObjectURL(u);
    addLog('sitemap', 'sitemap.xml', 'generated', `${pages.length} URLs`);
  }, [pages, addLog]);

  const exportCsv = useCallback(() => {
    if (pages.length === 0) return;
    const header = 'URL,Status,Page Name,Source,Last Submit,Last Check,Coverage State\n';
    const rows = pages.map((p) =>
      `"${p.url}","${p.status}","${(p.pageName || '').replace(/"/g, '""')}","${p.source || ''}","${p.lastSubmit || ''}","${p.lastCheck || ''}","${(p.coverageState || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = u; a.download = `gh-indexing-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(u);
    addLog('export', 'csv', 'done', `${pages.length} pages exported`);
  }, [pages, addLog]);

  // ── Sort toggle ──
  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }, [sortField]);

  // ── Visual helpers ──
  const statusColor = (s: PageStatus) => s === 'indexed' ? 'text-emerald-400' : s === 'submitted' ? 'text-amber-400' : s === 'crawled' ? 'text-blue-400' : s === 'discovered' ? 'text-purple-400' : s === 'error' ? 'text-red-400' : 'text-gh-text-faint';
  const statusBg = (s: PageStatus) => s === 'indexed' ? 'bg-emerald-400/10 border-emerald-400/30' : s === 'submitted' ? 'bg-amber-400/10 border-amber-400/30' : s === 'crawled' ? 'bg-blue-400/10 border-blue-400/30' : s === 'discovered' ? 'bg-purple-400/10 border-purple-400/30' : s === 'error' ? 'bg-red-400/10 border-red-400/30' : 'bg-white/[0.04] border-white/[0.08]';
  const StatusIcon = ({ status }: { status: PageStatus }) => status === 'indexed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : status === 'submitted' ? <Clock className="w-3.5 h-3.5 text-amber-400" /> : status === 'crawled' ? <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> : status === 'discovered' ? <Search className="w-3.5 h-3.5 text-purple-400" /> : status === 'error' ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : <X className="w-3.5 h-3.5 text-gh-text-faint" />;
  const indexRate = stats.total > 0 ? Math.round((stats.indexed / stats.total) * 100) : 0;

  // ══════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════
  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <span>🚀</span> Indexing Accelerator
          </h2>
          <p className="text-xs text-gh-text-muted mt-1">
            Track · Submit · Inspect · Accelerate — {stats.total} pages tracked, {stats.indexed} indexed ({indexRate}%)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddUrl(!showAddUrl)} className="px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]">
            <Plus className="w-3 h-3 inline mr-1" />Add URL
          </button>
          <button onClick={() => setShowBulkAdd(!showBulkAdd)} className="px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04]">
            <Upload className="w-3 h-3 inline mr-1" />Bulk Add
          </button>
          <button onClick={loadFromClusters} className="px-3 py-2 rounded-xl text-xs font-bold border border-carolina/30 bg-carolina/10 text-carolina">
            <Plus className="w-3 h-3 inline mr-1" />Load Clusters
          </button>
          <button onClick={importSitemap} disabled={importingSitemap} className="px-3 py-2 rounded-xl text-xs font-bold border border-teal-400/30 bg-teal-400/10 text-teal-400 disabled:opacity-40">
            {importingSitemap ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : <Download className="w-3 h-3 inline mr-1" />}
            Import Sitemap
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 text-gh-text-muted">⚙️</button>
        </div>
      </div>

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <div className="card p-4 space-y-3">
          <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest">Settings</div>
          <div>
            <label className="text-[10px] font-bold text-gh-text-muted block mb-1">IndexNow API Key</label>
            <input value={indexNowKey} onChange={(e) => setIndexNowKey(e.target.value)} placeholder="Your IndexNow key" className="w-full max-w-md px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={exportCsv} disabled={pages.length === 0} className="px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft hover:bg-white/[0.04] disabled:opacity-40">
              <Download className="w-3 h-3 inline mr-1" />Export CSV
            </button>
            <button onClick={clearAll} disabled={pages.length === 0} className="px-3 py-2 rounded-xl text-xs font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40">
              <Trash2 className="w-3 h-3 inline mr-1" />Clear All Pages
            </button>
          </div>
        </div>
      )}

      {/* ── ADD SINGLE URL ── */}
      {showAddUrl && (
        <div className="card p-4">
          <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest mb-2">Add URL</div>
          <div className="flex gap-2 items-center">
            <input value={newUrlInput} onChange={(e) => setNewUrlInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSingleUrl()} placeholder="e.g. medicare-advantage-quotes-nc or full URL" className="flex-1 max-w-lg px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none" />
            <button onClick={addSingleUrl} className="px-4 py-2 rounded-xl text-xs font-bold bg-carolina text-white">Add</button>
            <button onClick={() => setShowAddUrl(false)} className="px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-muted">Cancel</button>
          </div>
        </div>
      )}

      {/* ── BULK ADD URLs ── */}
      {showBulkAdd && (
        <div className="card p-4">
          <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-widest mb-2">Bulk Add URLs <span className="text-gh-text-faint font-normal">(one per line — slug or full URL)</span></div>
          <textarea value={bulkUrlInput} onChange={(e) => setBulkUrlInput(e.target.value)} placeholder={'medicare-advantage-quotes-nc\nmedigap-quotes-nc\nhttps://generationhealth.me/turning-65-medicare-north-carolina'} rows={6} className="w-full px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none font-mono" />
          <div className="flex gap-2 mt-2">
            <button onClick={addBulkUrls} className="px-4 py-2 rounded-xl text-xs font-bold bg-carolina text-white">Add {bulkUrlInput.split('\n').filter(Boolean).length} URLs</button>
            <button onClick={() => setShowBulkAdd(false)} className="px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-muted">Cancel</button>
          </div>
        </div>
      )}

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {([
          { label: 'TOTAL', value: stats.total, color: 'text-white', filter: 'all' as const },
          { label: 'INDEXED', value: stats.indexed, color: 'text-emerald-400', filter: 'indexed' as const },
          { label: 'SUBMITTED', value: stats.submitted, color: 'text-amber-400', filter: 'submitted' as const },
          { label: 'CRAWLED', value: stats.crawled, color: 'text-blue-400', filter: 'crawled' as const },
          { label: 'DISCOVERED', value: stats.discovered, color: 'text-purple-400', filter: 'discovered' as const },
          { label: 'UNKNOWN', value: stats.unknown, color: 'text-gh-text-muted', filter: 'unknown' as const },
          { label: 'ERRORS', value: stats.error, color: 'text-red-400', filter: 'error' as const },
          { label: 'ATTENTION', value: stats.needsAttention, color: 'text-nc-gold', filter: 'needs-attention' as const },
        ]).map((s) => (
          <button key={s.label} onClick={() => setFilterStatus(filterStatus === s.filter ? 'all' : s.filter)} className={`card p-3 text-center cursor-pointer transition-all ${filterStatus === s.filter ? 'ring-1 ring-carolina/50 bg-carolina/5' : 'hover:bg-white/[0.02]'}`}>
            <div className={`text-xl font-extrabold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[9px] font-semibold text-gh-text-muted uppercase tracking-wider mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── INDEX RATE BAR ── */}
      {stats.total > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gh-text-soft">Index Rate</span>
            <span className="text-sm font-extrabold text-emerald-400 tabular-nums">{indexRate}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${indexRate}%`, background: indexRate >= 90 ? '#34d399' : indexRate >= 70 ? '#fbbf24' : '#f87171' }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-gh-text-faint">
            <span>{stats.indexed} indexed</span>
            <span>{stats.total - stats.indexed} remaining</span>
          </div>
        </div>
      )}

      {/* ── ACTION BAR ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gh-text-faint" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search pages..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white text-xs outline-none" />
        </div>
        {filterStatus !== 'all' && (
          <button onClick={() => setFilterStatus('all')} className="px-3 py-2 rounded-xl text-xs font-bold border border-carolina/30 bg-carolina/10 text-carolina flex items-center gap-1">
            <Filter className="w-3 h-3" />{filterStatus} <X className="w-3 h-3 ml-1" />
          </button>
        )}
        <div className="flex-1" />
        {checking ? (
          <button onClick={stopChecking} className="px-3 py-2 rounded-xl text-xs font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10">
            Stop ({checkProgress?.done}/{checkProgress?.total})
          </button>
        ) : (
          <button onClick={checkAll} disabled={pages.length === 0} className="px-3 py-2 rounded-xl text-xs font-bold border border-purple-400/30 bg-purple-400/10 text-purple-400 disabled:opacity-40">
            <RefreshCw className="w-3 h-3 inline mr-1" />Check All Status
          </button>
        )}
        <button onClick={() => submitIndexNow(filteredPages.filter((p) => p.status !== 'indexed').map((p) => p.url))} disabled={submitting || !indexNowKey} className="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 disabled:opacity-40">
          <Send className="w-3 h-3 inline mr-1" />IndexNow {filterStatus !== 'all' ? 'Filtered' : 'All'}
        </button>
        <button onClick={openGSC} className="px-3 py-2 rounded-xl text-xs font-bold border border-white/10 text-gh-text-soft">
          <ExternalLink className="w-3 h-3 inline mr-1" />GSC
        </button>
        <button onClick={generateSitemap} disabled={pages.length === 0} className="px-3 py-2 rounded-xl text-xs font-bold border border-nc-gold/30 bg-nc-gold/10 text-nc-gold disabled:opacity-40">
          <FileText className="w-3 h-3 inline mr-1" />Sitemap
        </button>
      </div>

      {/* ── CHECK PROGRESS BAR ── */}
      {checkProgress && (
        <div className="card p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gh-text-soft">Checking GSC status...</span>
            <span className="text-xs font-bold text-carolina tabular-nums">{checkProgress.done}/{checkProgress.total}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-carolina transition-all duration-300" style={{ width: `${(checkProgress.done / checkProgress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* ── PAGE TABLE ── */}
      {pages.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🚀</div>
          <div className="text-sm text-gh-text-muted mb-4">No pages tracked yet.</div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={loadFromClusters} className="px-4 py-2 rounded-xl text-xs font-bold bg-carolina text-white">Load from Clusters + Pipeline</button>
            <button onClick={importSitemap} disabled={importingSitemap} className="px-4 py-2 rounded-xl text-xs font-bold border border-teal-400/30 bg-teal-400/10 text-teal-400">Import Sitemap</button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-[10px] text-gh-text-faint mb-1">
            Showing {filteredPages.length} of {pages.length} pages
            {filterStatus !== 'all' && ` — filtered by: ${filterStatus}`}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {([
                    { key: 'status' as SortField, label: 'STATUS' },
                    { key: 'pageName' as SortField, label: 'PAGE' },
                    { key: 'status' as SortField, label: 'URL' },
                    { key: 'lastCheck' as SortField, label: 'LAST CHECK' },
                    { key: 'lastSubmit' as SortField, label: 'LAST SUBMIT' },
                  ]).map((h, i) => (
                    <th key={i} onClick={() => toggleSort(h.key)} className="px-2.5 py-2 text-[10px] font-bold text-gh-text-muted uppercase tracking-wider border-b border-white/[0.06] text-left cursor-pointer hover:text-gh-text-soft">
                      <span className="flex items-center gap-1">{h.label}{sortField === h.key && <ArrowUpDown className="w-2.5 h-2.5" />}</span>
                    </th>
                  ))}
                  <th className="px-2.5 py-2 text-[10px] font-bold text-gh-text-muted uppercase tracking-wider border-b border-white/[0.06] text-left">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((p, i) => (
                  <tr key={i} className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${p.source === 'pipeline' ? 'bg-nc-gold/[0.03]' : ''}`}>
                    <td className="px-2.5 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${statusBg(p.status)} ${statusColor(p.status)}`}>
                        <StatusIcon status={p.status} />{p.status}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 text-xs text-white">
                      {p.pageName || '—'}
                      {p.source === 'pipeline' && <span className="ml-1 text-[9px] text-nc-gold">AEO</span>}
                    </td>
                    <td className="px-2.5 py-2.5 text-[10px] text-gh-text-faint truncate max-w-[250px]">{p.url.replace('https://generationhealth.me/', '/')}</td>
                    <td className="px-2.5 py-2.5 text-[10px] text-gh-text-faint">{p.lastCheck ? new Date(p.lastCheck).toLocaleDateString() : '—'}</td>
                    <td className="px-2.5 py-2.5 text-[10px] text-gh-text-faint">{p.lastSubmit ? new Date(p.lastSubmit).toLocaleDateString() : '—'}</td>
                    <td className="px-2.5 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => requestGscIndexing(p.url)} disabled={submitting} className="px-2 py-1 rounded text-[10px] font-bold border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 disabled:opacity-40" title="Request via GSC API">GSC</button>
                        <button onClick={() => submitIndexNow([p.url])} disabled={submitting || !indexNowKey} className="px-2 py-1 rounded text-[10px] font-bold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40" title="Submit via IndexNow">INow</button>
                        <button onClick={() => checkGscStatus(p.url)} className="px-2 py-1 rounded text-[10px] font-bold border border-purple-400/30 text-purple-400 hover:bg-purple-400/10" title="Check status">?</button>
                        <button onClick={() => setPages((prev) => prev.map((pg) => pg.url === p.url ? { ...pg, status: 'indexed' as const } : pg))} className="px-2 py-1 rounded text-[10px] font-bold border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" title="Mark indexed">✓</button>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded text-[10px] border border-white/10 text-gh-text-faint hover:bg-white/[0.04] flex items-center" title="Open page"><ExternalLink className="w-3 h-3" /></a>
                        <button onClick={() => removePage(p.url)} className="px-2 py-1 rounded text-[10px] border border-red-500/20 text-red-400/60 hover:bg-red-500/10 hover:text-red-400" title="Remove"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── NEEDS ATTENTION CALLOUT ── */}
      {stats.needsAttention > 0 && filterStatus === 'all' && (
        <div className="card p-4 border-l-4 border-l-nc-gold/60">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-nc-gold" />
            <span className="text-xs font-bold text-nc-gold">{stats.needsAttention} Pages Need Attention</span>
          </div>
          <p className="text-[11px] text-gh-text-muted leading-relaxed">
            {stats.crawled > 0 && <>{stats.crawled} crawled but not indexed — Google saw these but chose not to index them. Improve content quality, add internal links, or resubmit. </>}
            {stats.discovered > 0 && <>{stats.discovered} discovered but not crawled — Google knows about these but hasn&apos;t visited yet. Submit via IndexNow or GSC API. </>}
            {stats.error > 0 && <>{stats.error} with errors — check GSC for details. </>}
          </p>
          <button onClick={() => setFilterStatus('needs-attention')} className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-nc-gold/30 bg-nc-gold/10 text-nc-gold">
            Show Only Problem Pages
          </button>
        </div>
      )}

      {/* ── ACTIVITY LOG ── */}
      {log.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold text-gh-text-muted uppercase tracking-widest">Activity Log</div>
            <button onClick={() => setLog([])} className="text-[10px] text-gh-text-faint hover:text-red-400">Clear</button>
          </div>
          <div className="space-y-1 max-h-[250px] overflow-y-auto">
            {log.slice(0, 30).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-[11px] text-gh-text-faint py-1 border-b border-white/[0.03]">
                <span className="text-gh-text-muted w-16 shrink-0">{new Date(entry.ts).toLocaleTimeString()}</span>
                <span className={`font-semibold w-20 shrink-0 ${entry.status === 'error' ? 'text-red-400' : entry.status === 'done' || entry.status === 'indexed' ? 'text-emerald-400' : 'text-gh-text-soft'}`}>{entry.action}</span>
                <span className="truncate flex-1">{entry.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
