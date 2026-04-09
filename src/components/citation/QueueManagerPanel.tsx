'use client';

// ═══════════════════════════════════════════════════════════════════════════
// QueueManagerPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// Generates ~60 Medicare query candidates by:
//   1. Expanding 10 seed queries via the Claude API (1 original + 5 variations each)
//   2. Deduplicating near-identical phrasings
//   3. Classifying each query's intent (1-10 score) and category
//   4. Sorting by intent score descending
//
// Designed to slot into the existing Citation Monitor panel. Reuses the
// same localStorage keys for API credentials (gh-cc-cm-apikeys, with
// gh-cc-pb-apikey as fallback), so Rob doesn't have to re-enter his key.
//
// Parent wires up the onQueriesGenerated callback to merge the result into
// the Citation Monitor query queue.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  expandSeedQueries,
  type SeedQuery,
  type QueryCandidate,
} from '@/lib/seedExpansion';
import { classifyIntent } from '@/lib/intentClassifier';
import { deduplicateQueries } from '@/lib/queryDeduplication';

// localStorage keys — SAME as existing Citation Monitor (don't create new ones).
const LS_CM_KEYS = 'gh-cc-cm-apikeys';
const LS_PB_KEY = 'gh-cc-pb-apikey';

// ── Default seeds ──────────────────────────────────────────────────────────

const DEFAULT_SEEDS: SeedQuery[] = [
  { query: 'Medicare broker Durham NC', category: 'county_city', priority: 5 },
  { query: 'turning 65 Medicare North Carolina', category: 'local_decisions', priority: 5 },
  { query: 'Medicare Advantage vs Medigap NC', category: 'authority_builders', priority: 4 },
  { query: 'best Medicare plans Wake County NC', category: 'county_city', priority: 5 },
  { query: 'Medicare enrollment deadlines 2026 North Carolina', category: 'local_decisions', priority: 5 },
  { query: 'ACA health insurance Durham NC', category: 'aca', priority: 4 },
  { query: 'Medicare Part D penalty calculator', category: 'local_decisions', priority: 4 },
  { query: 'Extra Help program North Carolina eligibility', category: 'savings_programs', priority: 4 },
  { query: 'Duke Health Medicare Advantage plans', category: 'county_city', priority: 5 },
  { query: 'lost employer coverage Medicare Special Enrollment', category: 'local_decisions', priority: 5 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Read the Claude API key from localStorage, following the same precedence
 * the rest of the Command Center uses:
 *   1. gh-cc-cm-apikeys → { claude: '...' }  (Citation Monitor multi-key)
 *   2. gh-cc-pb-apikey  → '...'              (Page Builder single key)
 * Returns an empty string if neither exists.
 */
function loadClaudeKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem(LS_CM_KEYS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.claude === 'string' && parsed.claude) {
        return parsed.claude;
      }
    }
  } catch {
    /* fall through to pb key */
  }
  try {
    const raw = window.localStorage.getItem(LS_PB_KEY);
    if (raw) {
      // Page Builder stores the key as a JSON-encoded string.
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') return parsed;
      } catch {
        // Not JSON — treat as raw string.
        return raw;
      }
    }
  } catch {
    /* empty */
  }
  return '';
}

// ── Props ──────────────────────────────────────────────────────────────────

interface QueueManagerPanelProps {
  /** Called once generation completes successfully with the final sorted list. */
  onQueriesGenerated: (queries: QueryCandidate[]) => void;
  /** Optional seed override. Defaults to DEFAULT_SEEDS. */
  seeds?: SeedQuery[];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function QueueManagerPanel({
  onQueriesGenerated,
  seeds = DEFAULT_SEEDS,
}: QueueManagerPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    total: number;
    high: number;
    medium: number;
    low: number;
  } | null>(null);

  const handleGenerate = async () => {
    const apiKey = loadClaudeKey();
    if (!apiKey) {
      setError(
        'No Claude API key found. Add one in Citation Monitor → API Keys first.'
      );
      return;
    }

    setError(null);
    setGenerating(true);
    setProgress(0);
    setLastResult(null);
    setStatus('Expanding seed queries via Claude...');

    try {
      // Step 1: seed expansion (0% → 70%)
      // Each seed gets ~1.2s of API time, so expansion is the bulk of the work.
      const expanded = await expandSeedQueries(seeds, apiKey, (current, total) => {
        // Map 1/10, 2/10, ... 10/10 → 0% ... 70%
        const pct = Math.round((current / total) * 70);
        setProgress(pct);
        setStatus(`Expanding seeds... ${current}/${total}`);
      });

      if (expanded.length === 0) {
        throw new Error(
          'Claude returned no variations. Check the browser console for API errors.'
        );
      }

      // Step 2: deduplication (70% → 80%)
      setStatus('Removing near-duplicates...');
      setProgress(75);
      const deduped = deduplicateQueries(expanded);

      // Step 3: intent classification (80% → 95%)
      setStatus('Classifying intent and categories...');
      setProgress(85);
      const classified = classifyIntent(deduped);

      // Step 4: sort by intent score descending (95% → 100%)
      setStatus('Sorting by intent score...');
      setProgress(95);
      const sorted = [...classified].sort((a, b) => b.intentScore - a.intentScore);

      setProgress(100);
      setStatus(`Done — generated ${sorted.length} queries.`);

      // Summary counts for the UI.
      const high = sorted.filter((q) => q.intent === 'high').length;
      const medium = sorted.filter((q) => q.intent === 'medium').length;
      const low = sorted.filter((q) => q.intent === 'low').length;
      setLastResult({ total: sorted.length, high, medium, low });

      onQueriesGenerated(sorted);
    } catch (err) {
      console.error('[QueueManager] Generation failed:', err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus('');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="card p-5 space-y-4 border-2 border-teal-500/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Queue Manager</h3>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-400 uppercase tracking-wider">
              AEO 3.0
            </span>
          </div>
          <p className="text-[11px] text-gh-text-muted mt-1">
            Expand {seeds.length} seeds into ~{seeds.length * 6} classified queries via
            Claude. Takes ~{Math.round((seeds.length * 1.2) / 6)}&ndash;
            {Math.round((seeds.length * 1.2) / 3)} minutes.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </span>
          ) : (
            `Generate ${seeds.length * 6} Queries`
          )}
        </button>
      </div>

      {/* Progress bar */}
      {generating && (
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-gh-text-soft">{status}</span>
            <span className="text-teal-400 font-bold tabular-nums">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-red-300">{error}</div>
        </div>
      )}

      {/* Last-run summary */}
      {lastResult && !generating && !error && (
        <div className="grid grid-cols-4 gap-2">
          <div className="card p-2 text-center">
            <div className="text-lg font-extrabold tabular-nums text-white">
              {lastResult.total}
            </div>
            <div className="text-[9px] font-bold text-gh-text-muted uppercase tracking-wider">
              Total
            </div>
          </div>
          <div className="card p-2 text-center">
            <div className="text-lg font-extrabold tabular-nums text-red-400">
              {lastResult.high}
            </div>
            <div className="text-[9px] font-bold text-gh-text-muted uppercase tracking-wider">
              High
            </div>
          </div>
          <div className="card p-2 text-center">
            <div className="text-lg font-extrabold tabular-nums text-amber-400">
              {lastResult.medium}
            </div>
            <div className="text-[9px] font-bold text-gh-text-muted uppercase tracking-wider">
              Medium
            </div>
          </div>
          <div className="card p-2 text-center">
            <div className="text-lg font-extrabold tabular-nums text-gh-text-faint">
              {lastResult.low}
            </div>
            <div className="text-[9px] font-bold text-gh-text-muted uppercase tracking-wider">
              Low
            </div>
          </div>
        </div>
      )}

      {/* Seed preview */}
      {!generating && !lastResult && (
        <div className="text-[10px] text-gh-text-faint">
          <div className="font-bold text-gh-text-muted mb-1">Seeds:</div>
          <ul className="space-y-0.5">
            {seeds.slice(0, 5).map((s, i) => (
              <li key={i} className="truncate">
                {i + 1}. {s.query}
              </li>
            ))}
            {seeds.length > 5 && <li>... and {seeds.length - 5} more</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
