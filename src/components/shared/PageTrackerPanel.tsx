'use client';

import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, Check, Search, Filter } from 'lucide-react';
import { useAppState } from '@/lib/AppState';
import type { PageTrackerEntry } from '@/lib/AppState';

// ── Status pipeline definitions ──
const EXISTING_STATUSES = ['needs-update', 'rebuilt', 'scanned', 'indexed'] as const;
const AEO_STATUSES = ['drafted', 'published', 'submitted', 'indexed', 'cited'] as const;

type ExistingStatus = typeof EXISTING_STATUSES[number];
type AeoStatus = typeof AEO_STATUSES[number];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'needs-update': { label: 'Needs Update', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  'rebuilt': { label: 'Rebuilt', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'scanned': { label: 'Scanned', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  'drafted': { label: 'Drafted', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  'published': { label: 'Published', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'submitted': { label: 'Submitted', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  'indexed': { label: 'Indexed', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
  'cited': { label: 'Cited', color: '#4B9CD3', bg: 'rgba(75,156,211,0.15)' },
  'done': { label: 'Done', color: '#16A34A', bg: 'rgba(22,163,74,0.12)' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6B7B8D', bg: 'rgba(107,123,141,0.1)' };
  return <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PageTrackerPanel({ open, onClose }: Props) {
  const { pageTracker, updatePageStatus, addPageToTracker, removePageFromTracker, navigateToTab } = useAppState();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'existing' | 'aeo'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'existing' | 'aeo'>('existing');

  // Filter and search
  const filtered = useMemo(() => {
    return pageTracker.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      }
      return true;
    });
  }, [pageTracker, typeFilter, statusFilter, search]);

  // Summary stats
  const stats = useMemo(() => {
    const existing = pageTracker.filter((p) => p.type === 'existing');
    const aeo = pageTracker.filter((p) => p.type === 'aeo');
    return {
      total: pageTracker.length,
      existingTotal: existing.length,
      existingNeedsUpdate: existing.filter((p) => p.status === 'needs-update').length,
      existingRebuilt: existing.filter((p) => p.status === 'rebuilt').length,
      existingDone: existing.filter((p) => p.status === 'indexed' || p.status === 'done').length,
      aeoTotal: aeo.length,
      aeoDrafted: aeo.filter((p) => p.status === 'drafted').length,
      aeoPublished: aeo.filter((p) => p.status === 'published').length,
      aeoCited: aeo.filter((p) => p.status === 'cited').length,
    };
  }, [pageTracker]);

  const getNextStatus = (entry: PageTrackerEntry): string | null => {
    if (entry.type === 'existing') {
      const idx = EXISTING_STATUSES.indexOf(entry.status as ExistingStatus);
      return idx < EXISTING_STATUSES.length - 1 ? EXISTING_STATUSES[idx + 1] : 'done';
    } else {
      const idx = AEO_STATUSES.indexOf(entry.status as AeoStatus);
      return idx < AEO_STATUSES.length - 1 ? AEO_STATUSES[idx + 1] : null;
    }
  };

  const getActionLabel = (entry: PageTrackerEntry): string | null => {
    const next = getNextStatus(entry);
    if (!next) return null;
    const labels: Record<string, string> = {
      'rebuilt': 'Mark Rebuilt',
      'scanned': 'Mark Scanned',
      'indexed': 'Mark Indexed',
      'done': 'Mark Done',
      'published': 'Mark Published',
      'submitted': 'Mark Submitted',
      'cited': 'Mark Cited',
    };
    return labels[next] || `→ ${next}`;
  };

  const getTabAction = (entry: PageTrackerEntry): { label: string; tab: string; payload?: Record<string, string> } | null => {
    if (entry.type === 'existing') {
      if (entry.status === 'needs-update') return { label: '📄 Open in Page Builder', tab: 'pageBuilder', payload: { slug: entry.slug, title: entry.title, mode: 'fix' } };
      if (entry.status === 'rebuilt') return { label: '🔍 Scan in Optimize', tab: 'optimize' };
      if (entry.status === 'scanned') return { label: '📤 Submit in Indexing', tab: 'indexing' };
    } else {
      if (entry.status === 'drafted') return { label: '📄 Open in Page Builder', tab: 'pageBuilder', payload: { slug: entry.slug, title: entry.title, mode: 'build' } };
      if (entry.status === 'published') return { label: '📤 Submit in Indexing', tab: 'indexing' };
      if (entry.status === 'submitted' || entry.status === 'indexed') return { label: '🎯 Check in Citation Monitor', tab: 'citationMonitor' };
    }
    return null;
  };

  const handleAdd = () => {
    if (!newSlug.trim()) return;
    addPageToTracker({
      id: `${newType}-${newSlug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}-${Date.now()}`,
      slug: newSlug.trim().replace(/^\/+|\/+$/g, ''),
      title: newTitle.trim() || newSlug.trim(),
      type: newType,
      status: newType === 'existing' ? 'needs-update' : 'drafted',
      addedAt: new Date().toISOString(),
    });
    setNewSlug('');
    setNewTitle('');
    setShowAddForm(false);
  };

  if (!open) return null;

  const inputCls = "px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none w-full";

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[560px] bg-[#0F1923] border-l border-white/[0.08] overflow-y-auto" style={{ animation: 'slideInRight 0.25s ease' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0F1923] border-b border-white/[0.08] px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Page Status Tracker</h2>
              <p className="text-[11px] text-gh-text-muted mt-0.5">{stats.total} pages tracked</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/[0.04] text-gh-text-muted hover:bg-white/[0.08]"><X className="w-4 h-4" /></button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
              <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-wider mb-1">Existing Pages</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-white">{stats.existingDone}/{stats.existingTotal}</span>
                <span className="text-[10px] text-gh-text-faint">complete</span>
              </div>
              {stats.existingNeedsUpdate > 0 && <div className="text-[10px] text-red-400 mt-1">{stats.existingNeedsUpdate} need update</div>}
              {stats.existingRebuilt > 0 && <div className="text-[10px] text-amber-400 mt-1">{stats.existingRebuilt} rebuilt, awaiting scan</div>}
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
              <div className="text-[10px] font-bold text-gh-text-muted uppercase tracking-wider mb-1">AEO Pages</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-white">{stats.aeoCited}/{stats.aeoTotal}</span>
                <span className="text-[10px] text-gh-text-faint">cited</span>
              </div>
              {stats.aeoDrafted > 0 && <div className="text-[10px] text-purple-400 mt-1">{stats.aeoDrafted} drafted</div>}
              {stats.aeoPublished > 0 && <div className="text-[10px] text-amber-400 mt-1">{stats.aeoPublished} published, not yet indexed</div>}
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-faint" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pages..." className="pl-8 pr-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none w-full" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | 'existing' | 'aeo')} className="px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none appearance-none cursor-pointer">
              <option value="all">All Types</option>
              <option value="existing">Existing</option>
              <option value="aeo">AEO</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-white/[0.12] bg-white/[0.04] text-white text-xs outline-none appearance-none cursor-pointer">
              <option value="all">All Status</option>
              <option value="needs-update">Needs Update</option>
              <option value="rebuilt">Rebuilt</option>
              <option value="drafted">Drafted</option>
              <option value="published">Published</option>
              <option value="submitted">Submitted</option>
              <option value="scanned">Scanned</option>
              <option value="indexed">Indexed</option>
              <option value="cited">Cited</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Add button */}
          <button onClick={() => setShowAddForm(!showAddForm)} className="mt-3 w-full px-4 py-2 rounded-xl text-xs font-bold border border-dashed border-white/20 text-gh-text-muted hover:bg-white/[0.04] transition-colors">+ Add Page</button>

          {/* Add form */}
          {showAddForm && (
            <div className="mt-3 p-4 bg-white/[0.03] rounded-xl border border-white/[0.08] space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Slug</label>
                  <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="medicare-durham-nc" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gh-text-muted block mb-1">Title</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Medicare Durham NC" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-[10px] font-bold text-gh-text-muted">Type:</label>
                <button onClick={() => setNewType('existing')} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${newType === 'existing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/[0.04] text-gh-text-muted border border-white/[0.08]'}`}>Existing</button>
                <button onClick={() => setNewType('aeo')} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${newType === 'aeo' ? 'bg-carolina/20 text-carolina border border-carolina/30' : 'bg-white/[0.04] text-gh-text-muted border border-white/[0.08]'}`}>AEO</button>
                <button onClick={handleAdd} disabled={!newSlug.trim()} className="ml-auto px-4 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white disabled:opacity-40">Add</button>
              </div>
            </div>
          )}
        </div>

        {/* Page List */}
        <div className="px-6 py-4 space-y-1.5">
          {filtered.length === 0 && <div className="text-center py-12 text-xs text-gh-text-faint">No pages match your filters</div>}
          {filtered.map((entry) => {
            const isExp = expandedId === entry.id;
            const nextStatus = getNextStatus(entry);
            const actionLabel = getActionLabel(entry);
            const tabAction = getTabAction(entry);
            const typeBadge = entry.type === 'aeo'
              ? <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-carolina/15 text-carolina uppercase tracking-wider">AEO</span>
              : <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 uppercase tracking-wider">Existing</span>;

            // Pipeline progress
            const pipeline = entry.type === 'existing' ? EXISTING_STATUSES : AEO_STATUSES;
            const currentIdx = pipeline.indexOf(entry.status as never);
            const isDone = entry.status === 'done' || entry.status === 'cited' || (entry.type === 'existing' && entry.status === 'indexed');

            return (
              <div key={entry.id} className="rounded-xl border transition-all" style={{ background: isDone ? 'rgba(22,163,74,0.04)' : 'rgba(255,255,255,0.02)', borderColor: isExp ? 'rgba(75,156,211,0.3)' : isDone ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.06)' }}>
                <div onClick={() => setExpandedId(isExp ? null : entry.id)} className="px-4 py-3 cursor-pointer flex items-center gap-3">
                  {isExp ? <ChevronDown className="w-3.5 h-3.5 text-gh-text-muted flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gh-text-muted flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {typeBadge}
                      <StatusBadge status={entry.status} />
                    </div>
                    <div className="text-xs font-medium text-white mt-1 truncate">{entry.title}</div>
                    <div className="text-[10px] text-gh-text-faint truncate">/{entry.slug}</div>
                  </div>
                  {isDone && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </div>

                {isExp && (
                  <div className="px-4 pb-4 border-t border-white/[0.06] pt-3 space-y-3">
                    {/* Pipeline visualization */}
                    <div className="flex items-center gap-1">
                      {pipeline.map((s, i) => {
                        const isCurrent = i === currentIdx;
                        const isPast = i < currentIdx || isDone;
                        const cfg = STATUS_CONFIG[s] || { label: s, color: '#6B7B8D', bg: 'transparent' };
                        return (
                          <div key={s} className="flex items-center gap-1 flex-1">
                            <div className="flex-1">
                              <div className="h-1.5 rounded-full" style={{ background: isPast || isCurrent ? cfg.color : 'rgba(255,255,255,0.08)' }} />
                              <div className="text-[8px] font-bold mt-1 text-center" style={{ color: isCurrent ? cfg.color : isPast ? '#4ADE80' : '#3A4D5F' }}>{cfg.label}</div>
                            </div>
                            {i < pipeline.length - 1 && <div className="text-[8px] text-gh-text-faint mt-[-8px]">→</div>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Timestamps */}
                    <div className="text-[10px] text-gh-text-faint space-y-0.5">
                      <div>Added: {new Date(entry.addedAt).toLocaleDateString()}</div>
                      {entry.updatedAt && <div>Last updated: {new Date(entry.updatedAt).toLocaleDateString()}</div>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {actionLabel && nextStatus && (
                        <button onClick={(e) => { e.stopPropagation(); updatePageStatus(entry.id, nextStatus); }} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:brightness-110">{actionLabel}</button>
                      )}
                      {tabAction && (
                        <button onClick={(e) => { e.stopPropagation(); navigateToTab(tabAction.tab as any, tabAction.payload); onClose(); }} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-carolina/30 text-carolina hover:bg-carolina/10">{tabAction.label}</button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Remove "${entry.title}" from tracker?`)) removePageFromTracker(entry.id); }} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-400/30 text-red-400 hover:bg-red-400/10 ml-auto">Remove</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
