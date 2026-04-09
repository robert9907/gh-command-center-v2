'use client';

// ═══════════════════════════════════════════════════════════════════════════
// CitationMonitorPanel.tsx — AEO 3.0
// ═══════════════════════════════════════════════════════════════════════════
// Top-level 4-tab container for the AEO 3.0 Citation Monitor.
//
//   Queue    — query list, filters, bulk actions, search, per-row testing
//   Generate — QueueManagerPanel (Claude-powered seed expansion)
//   Scrape   — runs window.GHScrapers (Reddit, Medicare.gov, eHealth, competitors)
//   Settings — LLM API keys (Claude, ChatGPT, Perplexity, Gemini)
//
// Persistence:
//   - gh-cc-query-queue-v3  → query queue
//   - gh-cc-cm-apikeys      → API keys
//
// Replaces the legacy v2 CitationMonitorPanel. Wired into src/app/page.tsx
// via `{activeTab === 'citationMonitor' && <CitationMonitorPanel />}`.
//
// Ported from aeo3-integrated/index.html single-file Babel build.
// ═══════════════════════════════════════════════════════════════════════════

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  Activity,
  List,
  Sparkles,
  DownloadCloud,
  Settings,
  Search,
  Download,
  Trash2,
  TestTube,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Globe,
  ShoppingBag,
  Target,
  Play,
  Loader2,
  Save,
  Check,
  Eye,
  EyeOff,
  X,
  Inbox,
} from 'lucide-react';
import type { QueryCandidate, APIKeys } from '@/lib/seedExpansion';
import { classifyIntent } from '@/lib/intentClassifier';
import { deduplicateQueries } from '@/lib/queryDeduplication';
import { testCitations, batchTestWithProgress } from '@/lib/citationTester';
import { buildPageForQuery } from '@/lib/pageBuilder';
import { useAppState, type AeoPipelineEntry } from '@/lib/AppState';
import QueryRow from './QueryRow';
import PageGenerationModal from './PageGenerationModal';
import QueueManagerPanel from './QueueManagerPanel';

// ═══════════════════════════════════════════════════════════════════════════
// Storage
// ═══════════════════════════════════════════════════════════════════════════

const LS_QUEUE = 'gh-cc-query-queue-v3';
const LS_KEYS = 'gh-cc-cm-apikeys';

function loadQueueFromLS(): QueryCandidate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_QUEUE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveQueueToLS(queue: QueryCandidate[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('[CitationMonitor] localStorage write failed:', e);
  }
}

function loadAllKeys(): APIKeys {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LS_KEYS);
    if (raw) return (JSON.parse(raw) as APIKeys) || {};
  } catch {
    /* ignore */
  }
  return {};
}

function saveAllKeys(keys: APIKeys): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEYS, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared styles
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// Filter definitions
// ═══════════════════════════════════════════════════════════════════════════

const INTENT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
] as const;

const PIPELINE_FILTERS = [
  { id: 'all', label: 'All stages' },
  { id: 'not_built', label: 'Not built' },
  { id: 'built', label: 'Built' },
  { id: 'promoted', label: 'Promoted' },
  { id: 'indexed', label: 'Indexed' },
] as const;

const SOURCE_FILTERS = [
  { id: 'all', label: 'All sources' },
  { id: 'seed_expansion', label: 'Seed' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'medicare_gov', label: 'Medicare.gov' },
  { id: 'ehealth', label: 'eHealth' },
  { id: 'competitor', label: 'Competitor' },
  { id: 'manual', label: 'Manual' },
] as const;

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: active ? 'rgba(0,113,227,0.22)' : 'rgba(255,255,255,0.04)',
        color: active ? '#60a5fa' : '#cbd5e1',
        border: `1px solid ${
          active ? 'rgba(0,113,227,0.4)' : 'rgba(255,255,255,0.08)'
        }`,
        cursor: 'pointer',
        transition: 'all 150ms',
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QueueTab
// ═══════════════════════════════════════════════════════════════════════════

interface BatchProgress {
  current: number;
  total: number;
  queryText: string;
}

interface QueueTabProps {
  queue: QueryCandidate[];
  setQueue: (updater: QueryCandidate[] | ((prev: QueryCandidate[]) => QueryCandidate[])) => void;
  apiKeys: APIKeys;
}

function QueueTab({ queue, setQueue, apiKeys }: QueueTabProps) {
  const { addToPipeline } = useAppState();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'intentScore' | 'dateAdded' | 'query'>('intentScore');
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [modalQuery, setModalQuery] = useState<QueryCandidate | null>(null);
  const [copyToast, setCopyToast] = useState<string>('');
  const lastClickedIdRef = useRef<string | null>(null);

  // ── filtering + sorting ──
  const filtered = useMemo(() => {
    let out = queue.slice();
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      out = out.filter(
        (q) =>
          q.query.toLowerCase().includes(s) ||
          (q.county || '').toLowerCase().includes(s) ||
          (q.category || '').toLowerCase().includes(s)
      );
    }
    if (intentFilter !== 'all') out = out.filter((q) => q.intent === intentFilter);
    if (pipelineFilter !== 'all') {
      out = out.filter((q) => {
        const status = (q as { pipelineStatus?: string }).pipelineStatus || 'not_built';
        return status === pipelineFilter;
      });
    }
    if (sourceFilter !== 'all') out = out.filter((q) => q.source === sourceFilter);
    out.sort((a, b) => {
      if (sortBy === 'intentScore') return (b.intentScore || 0) - (a.intentScore || 0);
      if (sortBy === 'dateAdded')
        return (b.dateAdded || '').localeCompare(a.dateAdded || '');
      if (sortBy === 'query') return a.query.localeCompare(b.query);
      return 0;
    });
    return out;
  }, [queue, search, intentFilter, pipelineFilter, sourceFilter, sortBy]);

  // ── stats ──
  const stats = useMemo(() => {
    const total = queue.length;
    const tested = queue.filter((q) => {
      const s = (q.citationStatus || {}) as import('@/lib/seedExpansion').CitationStatus;
      return (
        s.claude !== null ||
        s.chatgpt !== null ||
        s.perplexity !== null ||
        s.gemini !== null
      );
    }).length;
    const cited = queue.filter((q) => {
      const s = (q.citationStatus || {}) as import('@/lib/seedExpansion').CitationStatus;
      return (
        s.claude === true ||
        s.chatgpt === true ||
        s.perplexity === true ||
        s.gemini === true
      );
    }).length;
    const high = queue.filter((q) => q.intent === 'high').length;
    const built = queue.filter((q) => {
      const status = (q as { pipelineStatus?: string }).pipelineStatus;
      return status === 'built' || status === 'promoted' || status === 'indexed';
    }).length;
    return { total, tested, cited, high, built };
  }, [queue]);

  const allSelected =
    filtered.length > 0 && filtered.every((q) => selectedIds.has(q.id));

  // ── selection ──
  const handleSelect = (id: string, selected: boolean, shiftKey?: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastClickedIdRef.current) {
        const ids = filtered.map((q) => q.id);
        const fromIdx = ids.indexOf(lastClickedIdRef.current);
        const toIdx = ids.indexOf(id);
        if (fromIdx !== -1 && toIdx !== -1) {
          const [lo, hi] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
          for (let i = lo; i <= hi; i++) next.add(ids[i]);
        }
      } else {
        if (selected) next.add(id);
        else next.delete(id);
      }
      lastClickedIdRef.current = id;
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((q) => q.id)));
  };

  // ── mutations ──
  const handleRefresh = (id: string) => {
    setQueue(q => q.map(x => x.id === id ? { ...x, pipelineStatus: 'not_built', lastBuilt: undefined } : x));
  };
  const handleDelete = (id: string) => {
    setQueue((q) => q.filter((x) => x.id !== id));
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} queries?`)) return;
    setQueue((q) => q.filter((x) => !selectedIds.has(x.id)));
    setSelectedIds(new Set());
  };

  const handleEdit = (query: QueryCandidate) => {
    const next = window.prompt('Edit query:', query.query);
    if (next == null || !next.trim() || next === query.query) return;
    setQueue((q) =>
      q.map((x) =>
        x.id === query.id ? classifyIntent([{ ...x, query: next.trim() }])[0] : x
      )
    );
  };

  const handleClear = () => {
    if (queue.length === 0) return;
    if (!window.confirm(`Clear all ${queue.length} queries?`)) return;
    setQueue([]);
    setSelectedIds(new Set());
  };

  // ── citation testing ──
  const hasAnyKey = !!(
    apiKeys.claude ||
    apiKeys.chatgpt ||
    apiKeys.perplexity ||
    apiKeys.gemini
  );

  const handleTestOne = async (query: QueryCandidate) => {
    if (!hasAnyKey) {
      window.alert('Add at least one LLM API key in Settings first.');
      return;
    }
    setTestingIds((prev) => new Set(prev).add(query.id));
    try {
      const [updated] = await testCitations([query], apiKeys);
      setQueue((q) => q.map((x) => (x.id === query.id ? updated : x)));
    } catch (err) {
      console.error('[CitationMonitor] test failed:', err);
      window.alert('Test failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setTestingIds((prev) => {
        const n = new Set(prev);
        n.delete(query.id);
        return n;
      });
    }
  };

  const handleTestSelected = async () => {
    if (!hasAnyKey) {
      window.alert('Add at least one LLM API key in Settings first.');
      return;
    }
    if (selectedIds.size === 0) {
      window.alert('No queries selected.');
      return;
    }
    const targets = queue.filter((q) => selectedIds.has(q.id));
    setTestingIds(new Set(targets.map((q) => q.id)));
    setBatchProgress({ current: 0, total: targets.length, queryText: '' });
    try {
      const updated = await batchTestWithProgress(
        targets,
        apiKeys,
        (current, total, queryText) => {
          setBatchProgress({ current, total, queryText });
        }
      );
      const byId = new Map(updated.map((u) => [u.id, u]));
      setQueue((q) => q.map((x) => byId.get(x.id) || x));
    } catch (err) {
      console.error('[CitationMonitor] batch test failed:', err);
      window.alert(
        'Batch test failed: ' + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setTestingIds(new Set());
      setBatchProgress(null);
    }
  };

  const handleGeneratePage = (query: QueryCandidate) => {
    setModalQuery(query);
  };

  const handlePageGenerated = (updated: QueryCandidate) => {
    setQueue((q) => q.map((x) => (x.id === updated.id ? updated : x)));
  };

  // ── Copy-for-WordPress headless quick action ──
  // Runs the full detect/load/generate/validate pipeline without opening the
  // modal, then writes a WordPress-embed-shaped HTML fragment to the clipboard
  // (no outer <html>/<head>/<body>, <style> block inlined, JSON-LD preserved).
  // On success: flips the row to BUILT, pushes an entry into the AEO Pipeline
  // tracker, and shows a 2-second toast. On failure: shows the reason in the
  // toast for 3 seconds.
  const handleCopyEmbed = async (query: QueryCandidate) => {
    const result = buildPageForQuery(query, 'wp-embed');

    if (!result.ok) {
      setCopyToast(`✗ ${result.failureReason || 'Copy failed'}`);
      setTimeout(() => setCopyToast(''), 3000);
      return;
    }

    try {
      await navigator.clipboard.writeText(result.html);
    } catch {
      setCopyToast('✗ Clipboard blocked by browser');
      setTimeout(() => setCopyToast(''), 3000);
      return;
    }

    // Push into AEO Pipeline tracker (same contract as PageGenerationModal)
    const entry: AeoPipelineEntry = {
      id: `aeo3-${query.id}-${Date.now()}`,
      queryId: query.id,
      query: query.query,
      title: result.title || `Medicare Broker ${result.county} NC`,
      slug: `medicare-broker-${result.slug}-nc`,
      html: result.html,
    };
    addToPipeline(entry);

    // Flip the row to BUILT
    setQueue((q) =>
      q.map((x) =>
        x.id === query.id
          ? ({
              ...x,
              county: result.county,
              ...({
                pipelineStatus: 'built',
                lastBuilt: new Date().toISOString(),
              } as object),
            } as QueryCandidate)
          : x
      )
    );

    const warnCount = result.warnings.length;
    setCopyToast(
      warnCount > 0
        ? `✓ Copied to clipboard (${warnCount} warning${warnCount === 1 ? '' : 's'})`
        : '✓ Copied to clipboard — ready to paste into Elementor'
    );
    setTimeout(() => setCopyToast(''), 2500);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(queue, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gh-queue-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Total', value: stats.total, color: '#fff' },
          { label: 'Tested', value: stats.tested, color: '#60a5fa' },
          { label: 'Cited', value: stats.cited, color: '#4ade80' },
          { label: 'High', value: stats.high, color: '#f87171' },
          { label: 'Built', value: stats.built, color: '#c084fc' },
        ].map((s, i) => (
          <div key={i} className="card p-3 text-center">
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: s.color,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--gh-text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search + sort */}
      <div
        className="card p-3"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
            }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queries, counties, categories…"
            style={{ width: '100%', paddingLeft: 32 }}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'intentScore' | 'dateAdded' | 'query')}
        >
          <option value="intentScore">Sort: Intent Score</option>
          <option value="dateAdded">Sort: Date Added</option>
          <option value="query">Sort: A–Z</option>
        </select>
        <button onClick={handleExport} style={{ ...secondaryBtnStyle, padding: '8px 12px' }}>
          <Download size={13} style={{ marginRight: 6 }} />
          Export JSON
        </button>
        <button
          onClick={handleClear}
          style={{ ...secondaryBtnStyle, padding: '8px 12px', color: '#fca5a5' }}
        >
          <Trash2 size={13} style={{ marginRight: 6 }} />
          Clear All
        </button>
      </div>

      {/* Filter pills */}
      <div
        className="card p-3"
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--gh-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Intent:
          </span>
          {INTENT_FILTERS.map((f) => (
            <FilterPill
              key={f.id}
              active={intentFilter === f.id}
              onClick={() => setIntentFilter(f.id)}
            >
              {f.label}
            </FilterPill>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--gh-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Stage:
          </span>
          <select value={pipelineFilter} onChange={(e) => setPipelineFilter(e.target.value)}>
            {PIPELINE_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--gh-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Source:
          </span>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            {SOURCE_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          className="card p-3"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderColor: 'rgba(0,113,227,0.35)',
            background: 'rgba(0,113,227,0.06)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>
            {selectedIds.size} selected
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={handleTestSelected} style={primaryBtnStyle}>
            <TestTube size={13} style={{ marginRight: 6 }} />
            Test Citations
          </button>
          <button
            onClick={handleBulkDelete}
            style={{ ...secondaryBtnStyle, color: '#fca5a5' }}
          >
            <Trash2 size={13} style={{ marginRight: 6 }} />
            Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} style={secondaryBtnStyle}>
            Clear
          </button>
        </div>
      )}

      {/* Batch progress */}
      {batchProgress && (
        <div className="card p-3" style={{ borderColor: 'rgba(0,113,227,0.35)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--gh-text-soft)',
              marginBottom: 6,
            }}
          >
            <span>
              Testing: <em style={{ color: '#cbd5e1' }}>{batchProgress.queryText || '…'}</em>
            </span>
            <span style={{ color: '#60a5fa', fontWeight: 700 }}>
              {batchProgress.current} / {batchProgress.total}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg,#0071e3,#60a5fa)',
                width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                transition: 'width 300ms',
              }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px 10px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            aria-label="Select all visible"
            style={{ width: 16, height: 16, accentColor: '#0071e3', cursor: 'pointer' }}
          />
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--gh-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {filtered.length} {filtered.length === 1 ? 'query' : 'queries'}
            {filtered.length !== queue.length && ` (of ${queue.length})`}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gh-text-faint)' }}>
            {queue.length === 0 ? (
              <div>
                <Inbox size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>Queue is empty.</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  Head to the <strong>Generate</strong> tab to expand seeds, or{' '}
                  <strong>Scrape</strong> to pull queries from the web.
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13 }}>No queries match the current filters.</div>
            )}
          </div>
        ) : (
          filtered.map((q) => (
            <QueryRow
              key={q.id}
              query={q}
              selected={selectedIds.has(q.id)}
              isTesting={testingIds.has(q.id)}
              onSelect={handleSelect}
              onTest={handleTestOne}
              onGeneratePage={handleGeneratePage}
              onCopyEmbed={handleCopyEmbed}
              onEdit={handleEdit}
              onRefresh={handleRefresh}
            />
          ))
        )}
      </div>

      {/* Generation modal */}
      {modalQuery && (
        <PageGenerationModal
          query={modalQuery}
          onClose={() => setModalQuery(null)}
          onGenerated={handlePageGenerated}
        />
      )}

      {/* Copy-to-clipboard toast */}
      {copyToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: copyToast.startsWith('✗') ? '#7f1d1d' : '#064e3b',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            border: `1px solid ${
              copyToast.startsWith('✗') ? '#b91c1c' : '#10b981'
            }`,
            zIndex: 9999,
            maxWidth: '90vw',
          }}
        >
          {copyToast}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GenerateTab — QueueManagerPanel wrapper
// ═══════════════════════════════════════════════════════════════════════════

interface GenerateTabProps {
  queue: QueryCandidate[];
  setQueue: (updater: QueryCandidate[] | ((prev: QueryCandidate[]) => QueryCandidate[])) => void;
}

function GenerateTab({ queue, setQueue }: GenerateTabProps) {
  const [lastMerge, setLastMerge] = useState<{
    generated: number;
    addedAfterDedup: number;
    totalNow: number;
  } | null>(null);

  const handleGenerated = (newQueries: QueryCandidate[]) => {
    const combined = [...queue, ...newQueries];
    const deduped = deduplicateQueries(combined);
    setQueue(deduped);
    setLastMerge({
      generated: newQueries.length,
      addedAfterDedup: deduped.length - queue.length,
      totalNow: deduped.length,
    });
  };

  return (
    <div className="space-y-4">
      <QueueManagerPanel onQueriesGenerated={handleGenerated} />
      {lastMerge && (
        <div className="card p-4" style={{ borderColor: 'rgba(74,222,128,0.22)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle size={16} style={{ color: '#4ade80' }} />
            <strong style={{ fontSize: 13, color: '#fff' }}>Merged into queue</strong>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gh-text-soft)' }}>
            Generated <strong>{lastMerge.generated}</strong> queries · Added{' '}
            <strong>{lastMerge.addedAfterDedup}</strong> after dedup · Queue now has{' '}
            <strong>{lastMerge.totalNow}</strong> total.
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ScrapeTab
// ═══════════════════════════════════════════════════════════════════════════

// window.GHScrapers type (loaded via public/gh-scrapers.js)
interface GHScrapersAPI {
  runAll: (opts?: { competitorUrls?: string[] }) => Promise<QueryCandidate[]>;
  scrapeReddit: () => Promise<QueryCandidate[]>;
  scrapeMedicareGov: () => Promise<QueryCandidate[]>;
  scrapeEhealth: () => Promise<QueryCandidate[]>;
  scrapeCompetitors: (urls: string[]) => Promise<QueryCandidate[]>;
}

declare global {
  interface Window {
    GHScrapers?: GHScrapersAPI;
  }
}

interface ScrapeSource {
  id: string;
  label: string;
  Icon: typeof MessageSquare;
  desc: string;
  fn: keyof GHScrapersAPI;
  needsUrls?: boolean;
}

const SCRAPE_SOURCES: ScrapeSource[] = [
  {
    id: 'reddit',
    label: 'Reddit',
    Icon: MessageSquare,
    desc: 'Scrapes r/Medicare and related subs for real-person questions.',
    fn: 'scrapeReddit',
  },
  {
    id: 'medicare_gov',
    label: 'Medicare.gov',
    Icon: Globe,
    desc: 'Pulls FAQ/Help topics via the PHP scrape proxy.',
    fn: 'scrapeMedicareGov',
  },
  {
    id: 'ehealth',
    label: 'eHealth',
    Icon: ShoppingBag,
    desc: 'Scrapes eHealthInsurance Medicare pages via proxy.',
    fn: 'scrapeEhealth',
  },
  {
    id: 'competitors',
    label: 'Competitors',
    Icon: Target,
    desc: 'Scrapes competitor landing pages (configurable URLs).',
    fn: 'scrapeCompetitors',
    needsUrls: true,
  },
];

interface ScrapeLogEntry {
  source: string;
  ts: string;
  count?: number;
  added?: number;
  error?: string;
}

interface ScrapeTabProps {
  queue: QueryCandidate[];
  setQueue: (updater: QueryCandidate[] | ((prev: QueryCandidate[]) => QueryCandidate[])) => void;
}

function ScrapeTab({ queue, setQueue }: ScrapeTabProps) {
  const [running, setRunning] = useState<string | null>(null);
  const [log, setLog] = useState<ScrapeLogEntry[]>([]);
  const [competitorUrls, setCompetitorUrls] = useState(
    'https://www.boomerbenefits.com/medicare/\nhttps://www.ehealthinsurance.com/medicare/'
  );
  const [ghAvailable, setGhAvailable] = useState(false);

  useEffect(() => {
    // window.GHScrapers is set by public/gh-scrapers.js loaded via <Script>
    setGhAvailable(typeof window !== 'undefined' && !!window.GHScrapers);
  }, []);

  const appendLog = (entry: ScrapeLogEntry) =>
    setLog((l) => [entry, ...l].slice(0, 20));

  const runScraper = async (source: ScrapeSource) => {
    const GH = window.GHScrapers;
    if (!GH || typeof GH[source.fn] !== 'function') {
      appendLog({
        source: source.label,
        error: 'Scraper function not available',
        ts: new Date().toISOString(),
      });
      return;
    }
    setRunning(source.id);
    try {
      let results: QueryCandidate[];
      if (source.needsUrls) {
        const urls = competitorUrls.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        results = await GH.scrapeCompetitors(urls);
      } else if (source.fn === 'scrapeReddit') {
        results = await GH.scrapeReddit();
      } else if (source.fn === 'scrapeMedicareGov') {
        results = await GH.scrapeMedicareGov();
      } else if (source.fn === 'scrapeEhealth') {
        results = await GH.scrapeEhealth();
      } else {
        results = [];
      }
      const arr = Array.isArray(results) ? results : [];

      // Run through intent classifier
      const classified = classifyIntent(arr);
      // Merge + dedup
      const combined = [...queue, ...classified];
      const deduped = deduplicateQueries(combined);
      const added = deduped.length - queue.length;
      setQueue(deduped);

      appendLog({
        source: source.label,
        count: arr.length,
        added,
        ts: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Scrape]', err);
      appendLog({
        source: source.label,
        error: err instanceof Error ? err.message : String(err),
        ts: new Date().toISOString(),
      });
    } finally {
      setRunning(null);
    }
  };

  const runAll = async () => {
    for (const source of SCRAPE_SOURCES) {
      await runScraper(source);
    }
  };

  return (
    <div className="space-y-4">
      {!ghAvailable && (
        <div
          className="card p-3"
          style={{
            background: 'rgba(239,68,68,0.08)',
            borderColor: 'rgba(239,68,68,0.3)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5' }}>
                window.GHScrapers not loaded
              </div>
              <div style={{ fontSize: 11, color: 'var(--gh-text-muted)', marginTop: 2 }}>
                Check the browser console. The scraper IIFE at /gh-scrapers.js should run
                before React mounts.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>
              Scrape Sources
            </h3>
            <p style={{ fontSize: 11, color: 'var(--gh-text-muted)', marginTop: 2 }}>
              Results are classified, deduped, and merged into the queue automatically.
            </p>
          </div>
          <button
            onClick={runAll}
            disabled={!ghAvailable || !!running}
            style={{
              ...primaryBtnStyle,
              padding: '10px 16px',
              opacity: !ghAvailable || running ? 0.4 : 1,
              cursor: !ghAvailable || running ? 'not-allowed' : 'pointer',
            }}
          >
            <Play size={13} style={{ marginRight: 6 }} />
            Run All
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
            gap: 10,
          }}
        >
          {SCRAPE_SOURCES.map((source) => {
            const SourceIcon = source.Icon;
            return (
              <div
                key={source.id}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
                >
                  <SourceIcon size={14} style={{ color: '#60a5fa' }} />
                  <strong style={{ fontSize: 13, color: '#fff' }}>{source.label}</strong>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--gh-text-muted)',
                    marginBottom: 10,
                    minHeight: 30,
                  }}
                >
                  {source.desc}
                </p>
                {source.needsUrls && (
                  <textarea
                    value={competitorUrls}
                    onChange={(e) => setCompetitorUrls(e.target.value)}
                    rows={3}
                    style={{ width: '100%', fontSize: 11, marginBottom: 8 }}
                    placeholder="One URL per line"
                  />
                )}
                <button
                  onClick={() => runScraper(source)}
                  disabled={!ghAvailable || !!running}
                  style={{
                    ...secondaryBtnStyle,
                    width: '100%',
                    justifyContent: 'center',
                    opacity: !ghAvailable || running ? 0.4 : 1,
                  }}
                >
                  {running === source.id ? (
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Loader2 size={12} className="gh-spin" />
                      Running…
                    </span>
                  ) : (
                    <>
                      <Download size={12} style={{ marginRight: 6 }} />
                      Run {source.label}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {log.length > 0 && (
        <div className="card p-4">
          <h3
            style={{
              margin: '0 0 10px',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--gh-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Recent Runs
          </h3>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11 }}>
            {log.map((e, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ color: '#6b7280', minWidth: 70 }}>{e.ts.slice(11, 19)}</span>
                <span style={{ color: '#60a5fa', minWidth: 90 }}>{e.source}</span>
                {e.error ? (
                  <span style={{ color: '#fca5a5' }}>✗ {e.error}</span>
                ) : (
                  <span style={{ color: '#4ade80' }}>
                    ✓ {e.count} queries
                    {e.added != null && ` (+${e.added} after dedup)`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SettingsTab
// ═══════════════════════════════════════════════════════════════════════════

interface SettingsTabProps {
  apiKeys: APIKeys;
  setApiKeys: Dispatch<SetStateAction<APIKeys>>;
}

const PROVIDERS: Array<{
  key: keyof APIKeys;
  label: string;
  placeholder: string;
  docs: string;
}> = [
  {
    key: 'claude',
    label: 'Claude (Anthropic)',
    placeholder: 'sk-ant-...',
    docs: 'https://console.anthropic.com/',
  },
  {
    key: 'chatgpt',
    label: 'ChatGPT (OpenAI)',
    placeholder: 'sk-...',
    docs: 'https://platform.openai.com/api-keys',
  },
  {
    key: 'perplexity',
    label: 'Perplexity',
    placeholder: 'pplx-...',
    docs: 'https://www.perplexity.ai/settings/api',
  },
  {
    key: 'gemini',
    label: 'Gemini (Google)',
    placeholder: 'AIza...',
    docs: 'https://aistudio.google.com/apikey',
  },
];

function SettingsTab({ apiKeys, setApiKeys }: SettingsTabProps) {
  const [local, setLocal] = useState<APIKeys>(apiKeys);
  const [saved, setSaved] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocal(apiKeys);
  }, [apiKeys]);

  const handleSave = () => {
    saveAllKeys(local);
    setApiKeys(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = (key: keyof APIKeys) => {
    const next = { ...local, [key]: '' };
    setLocal(next);
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>
            LLM API Keys
          </h3>
          <p style={{ fontSize: 11, color: 'var(--gh-text-muted)', marginTop: 2 }}>
            Stored locally in{' '}
            <code
              style={{
                fontSize: 10,
                background: 'rgba(255,255,255,0.06)',
                padding: '1px 5px',
                borderRadius: 3,
              }}
            >
              gh-cc-cm-apikeys
            </code>
            . Keys never leave the browser except as outbound API calls.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {PROVIDERS.map((p) => {
            const value = local[p.key] || '';
            const hasKey = !!value;
            const show = !!revealed[p.key];
            return (
              <div key={p.key}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>
                    {p.label}
                    {hasKey && (
                      <span
                        style={{
                          fontSize: 9,
                          marginLeft: 6,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: 'rgba(74,222,128,0.15)',
                          color: '#4ade80',
                          fontWeight: 700,
                        }}
                      >
                        SET
                      </span>
                    )}
                  </label>
                  <a
                    href={p.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 10, color: '#60a5fa', textDecoration: 'none' }}
                  >
                    Get key ↗
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => setLocal({ ...local, [p.key]: e.target.value })}
                    placeholder={p.placeholder}
                    style={{ flex: 1, fontFamily: 'ui-monospace,monospace' }}
                  />
                  <button
                    onClick={() => setRevealed((r) => ({ ...r, [p.key]: !r[p.key] }))}
                    style={{ ...secondaryBtnStyle, padding: '8px 10px' }}
                    aria-label={show ? 'Hide' : 'Show'}
                  >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {hasKey && (
                    <button
                      onClick={() => handleClear(p.key)}
                      style={{ ...secondaryBtnStyle, padding: '8px 10px', color: '#fca5a5' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <button onClick={handleSave} style={primaryBtnStyle}>
            <Save size={13} style={{ marginRight: 6 }} />
            Save Keys
          </button>
          {saved && (
            <span
              style={{
                fontSize: 12,
                color: '#4ade80',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Check size={13} />
              Saved
            </span>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h3
          style={{
            margin: '0 0 10px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--gh-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Storage
        </h3>
        <div style={{ fontSize: 11, color: 'var(--gh-text-soft)', lineHeight: 1.6 }}>
          <div>
            Queue: <code style={{ color: '#60a5fa' }}>gh-cc-query-queue-v3</code>
          </div>
          <div>
            Keys: <code style={{ color: '#60a5fa' }}>gh-cc-cm-apikeys</code>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Top-level: CitationMonitorPanel with 4 tabs
// ═══════════════════════════════════════════════════════════════════════════

type TabId = 'queue' | 'generate' | 'scrape' | 'settings';

const TABS: Array<{ id: TabId; label: string; Icon: typeof List }> = [
  { id: 'queue', label: 'Queue', Icon: List },
  { id: 'generate', label: 'Generate', Icon: Sparkles },
  { id: 'scrape', label: 'Scrape', Icon: DownloadCloud },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export default function CitationMonitorPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('queue');
  const [queue, setQueueState] = useState<QueryCandidate[]>(() => loadQueueFromLS());
  const [apiKeys, setApiKeys] = useState<APIKeys>(() => loadAllKeys());

  // Persist queue on every mutation
  const setQueue = useCallback(
    (updater: QueryCandidate[] | ((prev: QueryCandidate[]) => QueryCandidate[])) => {
      setQueueState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        saveQueueToLS(next);
        return next;
      });
    },
    []
  );

  const queueCount = queue.length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg,#0071e3,#2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={18} style={{ color: '#fff' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>
              Citation Monitor
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'rgba(20,184,166,0.15)',
                color: '#2dd4bf',
                letterSpacing: '0.1em',
              }}
            >
              AEO 3.0
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--gh-text-muted)', marginTop: 6 }}>
            Track GenerationHealth.me citations across Claude, ChatGPT, Perplexity, and
            Gemini.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--gh-border)',
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--gh-text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Queue
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {queueCount}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          borderBottom: '1px solid var(--gh-border)',
        }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                border: 'none',
                background: 'transparent',
                color: active ? '#fff' : 'var(--gh-text-muted)',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                borderBottom: active ? '2px solid #0071e3' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 150ms',
              }}
            >
              <TabIcon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'queue' && (
        <QueueTab queue={queue} setQueue={setQueue} apiKeys={apiKeys} />
      )}
      {activeTab === 'generate' && <GenerateTab queue={queue} setQueue={setQueue} />}
      {activeTab === 'scrape' && <ScrapeTab queue={queue} setQueue={setQueue} />}
      {activeTab === 'settings' && (
        <SettingsTab apiKeys={apiKeys} setApiKeys={setApiKeys} />
      )}
    </div>
  );
}
