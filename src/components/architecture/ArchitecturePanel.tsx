'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Check, Target } from 'lucide-react';
import { PHASES, STD_TASKS } from '@/data/config';
import { useAppState } from '@/lib/AppState';
import { clusters } from '@/data/clusters';

function ValueBadge({ label, value }: { label: string; value: string }) {
  const color = value === 'Very High' ? '#4ADE80' : value === 'High' ? '#60A5FA' : value === 'Medium-High' ? '#FFC72C' : '#6B7B8D';
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{label}: {value}</span>;
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'done' ? '#16A34A' : status === 'in-progress' ? '#D97706' : '#6B7B8D';
  const label = status === 'done' ? 'Live' : status === 'in-progress' ? 'In Progress' : 'Planned';
  return <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} /><span className="text-[10px] font-semibold" style={{ color }}>{label}</span></span>;
}

function TaskCheck({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`w-[18px] h-[18px] rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'bg-emerald-600 border-emerald-600' : 'border-white/20 bg-white/[0.04] hover:border-white/30'}`}>
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </button>
  );
}

function NoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={(e) => e.key === 'Enter' && setEditing(false)} className="mt-1 w-full px-2 py-1 rounded text-[10px] border border-white/[0.12] bg-white/[0.04] text-gh-text-soft outline-none" placeholder="Add note..." />;
  }
  return <button onClick={() => setEditing(true)} className="mt-1 text-[10px] text-gh-text-faint hover:text-carolina transition-colors">{value || '+ Add note'}</button>;
}

export default function ArchitecturePanel() {
  const [phaseFilter, setPhaseFilter] = useState(0);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const { taskDone: done, taskIsDone: isDone, taskToggle: toggle, taskGetNote: getNote, taskSetNote: setNote, taskRecentId: recentId, focusClusterId, setFocusClusterId, navigateToTab } = useAppState();

  const filtered = useMemo(() => {
    if (phaseFilter === 0) return clusters;
    return clusters.filter((c) => c.phase === phaseFilter);
  }, [phaseFilter]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setPhaseFilter(0)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${phaseFilter === 0 ? 'bg-white/[0.15] text-white' : 'bg-white/[0.04] text-gh-text-muted hover:bg-white/[0.08]'}`}>All</button>
        {PHASES.map((p) => (
          <button key={p.id} onClick={() => setPhaseFilter(p.id)} className="px-4 py-2 rounded-xl text-xs font-bold transition-all" style={{ background: phaseFilter === p.id ? `${p.color}30` : 'rgba(255,255,255,0.04)', color: phaseFilter === p.id ? p.color : '#6B7B8D' }}>{p.active && '● '}{p.label}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((cluster) => {
          const ph = PHASES.find((p) => p.id === cluster.phase) || PHASES[0];
          const isExp = expandedCluster === cluster.id;
          const doneCount = cluster.posts.filter((p, i) => p.status === 'done' || isDone(`cr-${cluster.id}-${i}`)).length;
          const isFocus = focusClusterId === cluster.id;

          return (
            <div key={cluster.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: isExp ? `2px solid ${ph.color}` : isFocus ? '2px solid #FFC72C' : '1px solid rgba(255,255,255,0.06)', boxShadow: isExp ? `0 8px 32px ${ph.color}18` : 'none' }}>
              <div onClick={() => setExpandedCluster(isExp ? null : cluster.id)} className="px-6 py-5 cursor-pointer flex items-center justify-between gap-4" style={{ background: isExp ? `${ph.color}08` : 'transparent' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: ph.color }}>{cluster.type === 'county-system' ? 'County System' : 'Pillar Cluster'}</span>
                    <StatusDot status={cluster.status} />
                    {cluster.gameplanPriority && <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">#{cluster.gameplanPriority}</span>}
                    {isFocus && <span className="text-[10px] font-extrabold bg-nc-gold/20 text-nc-gold px-2 py-0.5 rounded">🎯 FOCUS</span>}
                    {cluster.templateUsed && <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">Master Template v3.0</span>}
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">{cluster.name}</h3>
                  <div className="flex gap-1.5 mt-2 flex-wrap"><ValueBadge label="SEO" value={cluster.seoValue} /><ValueBadge label="AEO" value={cluster.aeoValue} /><ValueBadge label="GEO" value={cluster.geoValue} /></div>
                </div>
                <div className="text-right flex-shrink-0"><div className="text-2xl font-extrabold text-white">{doneCount}/{cluster.posts.length}</div><div className="text-[11px] text-gh-text-muted">pages</div></div>
                {isExp ? <ChevronDown className="w-5 h-5 text-gh-text-muted" /> : <ChevronRight className="w-5 h-5 text-gh-text-muted" />}
              </div>
              {isExp && (
                <div className="px-6 pb-6 border-t border-white/[0.06]">
                  {/* Focus cluster button */}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setFocusClusterId(isFocus ? null : cluster.id)} className="px-4 py-1.5 rounded-lg text-xs font-bold border-[1.5px] transition-all" style={{ borderColor: 'rgba(255,199,44,0.5)', background: isFocus ? 'rgba(255,199,44,0.15)' : 'transparent', color: '#FFC72C' }}>
                      <Target className="w-3 h-3 inline mr-1" />{isFocus ? '🎯 In Focus' : '🎯 Set as Focus Cluster'}
                    </button>
                  </div>
                  {cluster.gameplanNote && <div className="mt-4 px-4 py-3 bg-amber-500/[0.06] border-l-[3px] border-amber-500 rounded-r-lg text-sm text-amber-200"><strong>Note:</strong> {cluster.gameplanNote}</div>}
                  {cluster.templateUsed && <div className="mt-3 px-4 py-3 bg-blue-500/[0.06] border-l-[3px] border-blue-500 rounded-r-lg text-sm text-blue-300"><strong>Master Template v3.0</strong></div>}
                  {/* Pages */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-extrabold tracking-wider uppercase" style={{ color: ph.color }}>Pages ({doneCount}/{cluster.posts.length})</span>
                      <div className="flex gap-4 text-[10px] font-bold text-gh-text-muted uppercase tracking-wider"><span>Created</span><span>Indexed</span></div>
                    </div>
                    {cluster.posts.map((post, i) => {
                      const createdId = `cr-${cluster.id}-${i}`;
                      const indexedId = `ix-${cluster.id}-${i}`;
                      const isCreated = post.status === 'done' || isDone(createdId);
                      const isIndexed = isDone(indexedId);
                      const isPillar = i === 0;
                      const borderColor = isIndexed ? '#16A34A' : isCreated ? '#D97706' : 'rgba(255,255,255,0.1)';
                      return (
                        <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 my-1 rounded-lg text-sm transition-colors" style={{ background: isIndexed ? 'rgba(22,163,74,0.06)' : isCreated ? 'rgba(217,119,6,0.06)' : 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${borderColor}` }}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isPillar && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase" style={{ background: `${ph.color}20`, color: ph.color }}>Pillar</span>}
                              <span className={`text-xs ${isPillar ? 'font-bold' : 'font-normal'} text-gh-text-soft`}>{post.name}</span>
                              {post.hospital && <span className="text-[10px] text-gh-text-faint"> — {post.hospital}</span>}
                            </div>
                            {post.slug && <div className="text-[10px] text-gh-text-faint mt-0.5 truncate">/{post.slug}</div>}
                            {post.publishDate && <div className="text-[10px] font-bold text-blue-400 mt-1">Publish: {post.publishDate}</div>}
                            {/* Build Page button for planned pages */}
                            {post.status === 'planned' && post.slug && (
                              <button onClick={(e) => { e.stopPropagation(); navigateToTab('pageBuilder', { slug: post.slug || '', title: post.name, mode: 'build' }); }} className="mt-1.5 px-3 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:brightness-110">📄 Build Page</button>
                            )}
                          </div>
                          <div className="flex gap-4 items-center flex-shrink-0">
                            {post.status === 'done' ? <div className="w-[18px] h-[18px] rounded-md bg-emerald-600 flex items-center justify-center"><Check className="w-3 h-3 text-white" strokeWidth={3} /></div> : <TaskCheck checked={isDone(createdId)} onToggle={() => toggle(createdId)} />}
                            <TaskCheck checked={isIndexed} onToggle={() => toggle(indexedId)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* STD_TASKS */}
                  <div className="mt-6">
                    <div className="text-[11px] font-extrabold tracking-wider text-teal-500 uppercase mb-3">Optimization Checklist ({STD_TASKS.filter((t) => isDone(`std-${cluster.id}-${t.id}`)).length}/{STD_TASKS.length})</div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                      {STD_TASKS.map((task, i) => {
                        const tid = `std-${cluster.id}-${task.id}`;
                        const d = isDone(tid);
                        return (
                          <div key={task.id} className={`flex items-start gap-2.5 py-2 text-sm ${i < STD_TASKS.length - 1 ? 'border-b border-white/[0.04]' : ''}`} style={{ animation: recentId === tid ? 'donePulse 1s ease' : 'none' }}>
                            <TaskCheck checked={d} onToggle={() => toggle(tid)} />
                            <div className="flex-1">
                              <span className={`text-xs transition-all ${d ? 'text-emerald-400 line-through' : 'text-gh-text-soft'}`}>{task.label}</span>
                              {d && <NoteField value={getNote(tid)} onChange={(v) => setNote(tid, v)} />}
                            </div>
                            {d && done[tid] && <span className="text-[10px] text-gh-text-faint flex-shrink-0">{new Date(done[tid]).toLocaleDateString()}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Cluster-specific */}
                  {cluster.phase1Tasks.length > 0 && (
                    <div className="mt-5">
                      <div className="text-[11px] font-bold text-amber-500 tracking-wider uppercase mb-3">Cluster-Specific ({cluster.phase1Tasks.filter((_, i) => isDone(`cl-${cluster.id}-${i}`)).length}/{cluster.phase1Tasks.length})</div>
                      {cluster.phase1Tasks.map((task, i) => {
                        const tid = `cl-${cluster.id}-${i}`;
                        const d = isDone(tid);
                        return (
                          <div key={i} className="flex items-start gap-2.5 py-2 text-sm border-b border-white/[0.04] last:border-0">
                            <TaskCheck checked={d} onToggle={() => toggle(tid)} />
                            <div className="flex-1">
                              <span className={`text-xs transition-all ${d ? 'text-emerald-400 line-through' : 'text-gh-text-soft'}`}>{task}</span>
                              {d && <NoteField value={getNote(tid)} onChange={(v) => setNote(tid, v)} />}
                            </div>
                            {d && done[tid] && <span className="text-[10px] text-gh-text-faint flex-shrink-0">{new Date(done[tid]).toLocaleDateString()}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
