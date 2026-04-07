'use client';

// ═══════════════════════════════════════════════════════════════════════════
// QueryRow.tsx
// ═══════════════════════════════════════════════════════════════════════════
// Single row in the Citation Monitor query queue. Shows:
//   - Selection checkbox
//   - Query text (truncated)
//   - Intent badge (HIGH/MED/LOW)
//   - Source badge (Seed / Reddit / Medicare.gov / eHealth / Competitor / Manual)
//   - County badge (if detected)
//   - 4-LLM citation status dots (Claude / ChatGPT / Perplexity / Gemini)
//   - Competitor chips
//   - Pipeline status badge
//   - Action buttons: Test, Generate Page, Edit, Delete
//
// Ported from aeo3-integrated/index.html single-file Babel build.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  Sparkles,
  MessageSquare,
  Globe,
  ShoppingBag,
  Target,
  User,
  TestTube,
  FileText,
  ClipboardCopy,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { QueryCandidate, QuerySource } from '@/lib/seedExpansion';

// ── Style tables ───────────────────────────────────────────────────────────

interface SourceMeta {
  label: string;
  Icon: typeof Sparkles;
}

const SOURCE_META: Record<QuerySource, SourceMeta> = {
  seed_expansion: { label: 'Seed', Icon: Sparkles },
  reddit: { label: 'Reddit', Icon: MessageSquare },
  medicare_gov: { label: 'Medicare.gov', Icon: Globe },
  ehealth: { label: 'eHealth', Icon: ShoppingBag },
  competitor: { label: 'Competitor', Icon: Target },
  manual: { label: 'Manual', Icon: User },
};

const INTENT_STYLES: Record<'high' | 'medium' | 'low', { bg: string; label: string }> = {
  high: { bg: '#ef4444', label: 'HIGH' },
  medium: { bg: '#f59e0b', label: 'MED' },
  low: { bg: '#6b7280', label: 'LOW' },
};

type PipelineStatus = 'not_built' | 'built' | 'promoted' | 'indexed';

const PIPELINE_STYLES: Record<PipelineStatus, { bg: string; fg: string; label: string }> = {
  not_built: { bg: 'rgba(107,114,128,0.18)', fg: '#9ca3af', label: 'NOT BUILT' },
  built: { bg: 'rgba(0,113,227,0.18)', fg: '#60a5fa', label: 'BUILT' },
  promoted: { bg: 'rgba(34,197,94,0.18)', fg: '#4ade80', label: 'PROMOTED' },
  indexed: { bg: 'rgba(168,85,247,0.18)', fg: '#c084fc', label: 'INDEXED' },
};

const LLM_ORDER: Array<{ key: 'claude' | 'chatgpt' | 'perplexity' | 'gemini'; label: string }> = [
  { key: 'claude', label: 'Claude' },
  { key: 'chatgpt', label: 'ChatGPT' },
  { key: 'perplexity', label: 'Perplexity' },
  { key: 'gemini', label: 'Gemini' },
];

function truncate(s: string, max = 80): string {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// ── IconButton helper ──────────────────────────────────────────────────────

interface IconButtonProps {
  children: ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  ariaLabel: string;
  danger?: boolean;
}

function IconButton({ children, onClick, title, disabled, ariaLabel, danger }: IconButtonProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.08)',
        background:
          hover && !disabled
            ? danger
              ? 'rgba(239,68,68,0.18)'
              : 'rgba(0,113,227,0.18)'
            : 'rgba(255,255,255,0.03)',
        color: disabled ? '#94a3b8' : hover ? (danger ? '#dc2626' : '#0071e3') : '#334155',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 150ms',
      }}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export interface QueryRowProps {
  query: QueryCandidate;
  selected: boolean;
  isTesting: boolean;
  onSelect: (id: string, checked: boolean, shiftKey?: boolean) => void;
  onTest: (query: QueryCandidate) => void;
  onGeneratePage: (query: QueryCandidate) => void;
  onCopyEmbed: (query: QueryCandidate) => void;
  onEdit: (query: QueryCandidate) => void;
  onRefresh: (id: string) => void;
}

export default function QueryRow({
  query,
  selected,
  isTesting,
  onSelect,
  onTest,
  onGeneratePage,
  onCopyEmbed,
  onEdit,
  onRefresh,
}: QueryRowProps) {
  const [hovered, setHovered] = useState(false);
  const intent = INTENT_STYLES[query.intent] || INTENT_STYLES.low;
  const sourceMeta = SOURCE_META[query.source] || SOURCE_META.manual;
  const SourceIcon = sourceMeta.Icon;
  const pipelineKey: PipelineStatus =
    ((query as { pipelineStatus?: PipelineStatus }).pipelineStatus) || 'not_built';
  const pipeline = PIPELINE_STYLES[pipelineKey] || PIPELINE_STYLES.not_built;
  const citation = query.citationStatus || { claude: null, chatgpt: null, perplexity: null, gemini: null };
  const competitors = query.competitors || [];
  const visibleCompetitors = competitors.slice(0, 3);
  const extraCompetitors = competitors.length - visibleCompetitors.length;
  const canGeneratePage = Boolean(query.county);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === ' ') {
      e.preventDefault();
      onSelect(query.id, !selected);
    } else if (e.key === 'Enter' && canGeneratePage) {
      e.preventDefault();
      onGeneratePage(query);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onRefresh(query.id);
    }
  };

  return (
    <div
      role="row"
      tabIndex={0}
      aria-selected={selected}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 14px 12px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderLeft: selected ? '4px solid #0071e3' : '4px solid transparent',
        background: selected
          ? 'rgba(0,113,227,0.08)'
          : hovered
          ? 'rgba(255,255,255,0.03)'
          : 'transparent',
        transition: 'background 150ms, border-color 150ms',
        outline: 'none',
        cursor: 'default',
      }}
    >
      <div style={{ paddingTop: 2 }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(query.id, e.target.checked)}
          onClick={(e) => {
            if (e.shiftKey) {
              e.preventDefault();
              onSelect(query.id, !selected, true);
            }
          }}
          aria-label={`Select query: ${query.query}`}
          style={{ width: 16, height: 16, accentColor: '#0071e3', cursor: 'pointer' }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          title={query.query}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#0f172a',
            marginBottom: 8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {truncate(query.query, 80)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            title={`Intent Score: ${query.intentScore || '—'}/10`}
            style={{
              padding: '2px 8px',
              borderRadius: 10,
              background: intent.bg,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            {intent.label}
          </span>
          <span
            title={`Source: ${sourceMeta.label}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'rgba(15,23,42,0.06)',
              color: '#475569',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <SourceIcon size={10} />
            {sourceMeta.label}
          </span>
          {query.county && (
            <span
              title={`County: ${query.county}`}
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                background: 'rgba(0,113,227,0.18)',
                color: '#60a5fa',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {query.county}
            </span>
          )}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'rgba(15,23,42,0.04)',
              marginLeft: 4,
            }}
          >
            {LLM_ORDER.map(({ key, label }) => {
              const v = citation[key];
              const icon = v === true ? '✓' : v === false ? '✗' : '●';
              const color = v === true ? '#4ade80' : v === false ? '#ef4444' : '#6b7280';
              return (
                <span
                  key={key}
                  title={`${label}: ${
                    v === true ? 'cited' : v === false ? 'not cited' : 'untested'
                  }`}
                  style={{
                    color,
                    fontSize: 11,
                    fontWeight: 700,
                    width: 12,
                    textAlign: 'center',
                    animation: isTesting ? 'gh-pulse 1.2s ease-in-out infinite' : 'none',
                  }}
                >
                  {icon}
                </span>
              );
            })}
          </div>
          {visibleCompetitors.map((c, i) => (
            <span
              key={`${c}-${i}`}
              title={competitors.join(', ')}
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                color: '#9ca3af',
                fontSize: 10,
                fontWeight: 500,
              }}
            >
              {c}
            </span>
          ))}
          {extraCompetitors > 0 && (
            <span
              title={competitors.join(', ')}
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                color: '#9ca3af',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              +{extraCompetitors} more
            </span>
          )}
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 10,
              background: pipeline.bg,
              color: pipeline.fg,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.3,
              marginLeft: 'auto',
            }}
          >
            {pipeline.label}
          </span>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          opacity: hovered || selected ? 1 : 0.7,
          transition: 'opacity 150ms',
          color: '#334155',
        }}
      >
        <IconButton
          title="Test citation across 4 LLMs"
          onClick={() => onTest(query)}
          disabled={isTesting}
          ariaLabel="Test citation"
        >
          <TestTube size={15} />
        </IconButton>
        <IconButton
          title={canGeneratePage ? 'Generate county landing page' : 'No county detected'}
          onClick={() => onGeneratePage(query)}
          disabled={!canGeneratePage || isTesting}
          ariaLabel="Generate page"
        >
          <FileText size={15} />
        </IconButton>
        <IconButton
          title={
            canGeneratePage
              ? 'Copy WordPress-ready HTML to clipboard'
              : 'No county detected'
          }
          onClick={() => onCopyEmbed(query)}
          disabled={!canGeneratePage || isTesting}
          ariaLabel="Copy HTML for WordPress"
        >
          <ClipboardCopy size={15} />
        </IconButton>
        <IconButton
          title="Edit query"
          onClick={() => onEdit(query)}
          disabled={isTesting}
          ariaLabel="Edit query"
        >
          <Edit2 size={15} />
        </IconButton>
        <IconButton
          title="Reset to Not Built"
          onClick={() => onRefresh(query.id)}
          disabled={isTesting}
          ariaLabel="Delete query"
          danger
        >
          <RefreshCw size={15} />
        </IconButton>
      </div>
    </div>
  );
}
