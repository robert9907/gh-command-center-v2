'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, AlertTriangle, BarChart3, LogOut } from 'lucide-react';

type RangeKey = '7d' | '14d' | '30d' | '90d';

interface FunnelResponse {
  range: { startDate: string; endDate: string; days: number; label: string };
  eventCounts: Record<string, number>;
  counties: Array<{ county: string; sessions: number; completions: number; conversionRate: number }>;
  countyAvailable: boolean;
  fetchedAt: string;
}

const FUNNEL_STEPS: Array<{ id: string; label: string }> = [
  { id: 'pm_flow_start', label: 'Flow Start' },
  { id: 'pm_about_complete', label: 'About' },
  { id: 'pm_meds_complete', label: 'Meds' },
  { id: 'pm_providers_complete', label: 'Providers' },
  { id: 'pm_zip_complete', label: 'ZIP' },
  { id: 'pm_priorities_complete', label: 'Priorities' },
  { id: 'pm_results_view', label: 'Results' },
  { id: 'pm_plan_detail_view', label: 'Plan Detail' },
  { id: 'pm_enroll_start', label: 'Enroll Start' },
  { id: 'pm_enroll_submit', label: 'Enroll Submit' },
];

// Color gradient: green (high retention) → red (high drop-off).
function retentionColor(retention: number): string {
  const r = Math.max(0, Math.min(1, retention));
  if (r >= 0.85) return '#22C55E';
  if (r >= 0.70) return '#4ADE80';
  if (r >= 0.55) return '#FACC15';
  if (r >= 0.40) return '#FB923C';
  return '#EF4444';
}

function fmt(n: number): string {
  return n.toLocaleString();
}

function pct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)}%`;
}

export default function FunnelDashboard() {
  const [authState, setAuthState] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [range, setRange] = useState<RangeKey>('30d');
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: RangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/ga4/funnel?range=${r}`, { cache: 'no-store' });
      if (resp.status === 401) {
        setAuthState('disconnected');
        setData(null);
        return;
      }
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        setError(j?.error || `Request failed: ${resp.status}`);
        return;
      }
      const j = (await resp.json()) as FunnelResponse;
      setData(j);
      setAuthState('connected');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Surface OAuth callback errors on the URL
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const err = sp.get('ga4_error');
      if (err) setError(`OAuth error: ${err}`);
    }
    load(range);
  }, [load, range]);

  const onConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const onDisconnect = async () => {
    document.cookie = 'gh_ga4_session=; path=/; max-age=0';
    setAuthState('disconnected');
    setData(null);
  };

  const summary = useMemo(() => {
    if (!data) return null;
    const counts = data.eventCounts;
    const start = counts.pm_flow_start || 0;
    const submit = counts.pm_enroll_submit || 0;
    const abandonment = counts.pm_abandonment || 0;
    const completion = start > 0 ? submit / start : 0;

    let biggestLeakIdx = -1;
    let biggestLeakRetention = 1;
    for (let i = 1; i < FUNNEL_STEPS.length; i++) {
      const prev = counts[FUNNEL_STEPS[i - 1].id] || 0;
      const cur = counts[FUNNEL_STEPS[i].id] || 0;
      if (prev <= 0) continue;
      const retention = cur / prev;
      if (retention < biggestLeakRetention) {
        biggestLeakRetention = retention;
        biggestLeakIdx = i;
      }
    }

    return {
      sessions: start,
      submit,
      completion,
      abandonment,
      biggestLeakIdx,
      biggestLeakStep: biggestLeakIdx >= 0 ? FUNNEL_STEPS[biggestLeakIdx] : null,
      biggestLeakDropoff: biggestLeakIdx >= 0 ? 1 - biggestLeakRetention : 0,
    };
  }, [data]);

  const waterfall = useMemo(() => {
    if (!data) return [];
    const counts = data.eventCounts;
    const max = Math.max(1, ...FUNNEL_STEPS.map((s) => counts[s.id] || 0));
    return FUNNEL_STEPS.map((step, i) => {
      const value = counts[step.id] || 0;
      const prev = i === 0 ? value : counts[FUNNEL_STEPS[i - 1].id] || 0;
      const retention = i === 0 || prev === 0 ? 1 : value / prev;
      const dropoff = 1 - retention;
      return {
        ...step,
        value,
        widthPct: (value / max) * 100,
        retention,
        dropoff,
        color: retentionColor(retention),
      };
    });
  }, [data]);

  // ── Disconnected state ──
  if (authState === 'disconnected') {
    return (
      <div className="space-y-6">
        <PanelHeader />
        <div className="card p-10 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-carolina mb-4" />
          <h3 className="font-display text-xl font-bold text-white mb-2">Connect Google Analytics</h3>
          <p className="text-sm text-gh-text-soft mb-6 max-w-md mx-auto">
            Authorize read-only access to GA4 property{' '}
            <span className="text-nc-gold font-mono">501343914</span> to view the Plan Match funnel.
          </p>
          <button
            onClick={onConnect}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-carolina text-white font-medium hover:bg-carolina/90 transition-colors"
          >
            Connect Google Analytics
          </button>
          {error && (
            <div className="mt-6 inline-flex items-center gap-2 text-sm text-red-300 bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Loading / unknown ──
  if (authState === 'unknown' || (loading && !data)) {
    return (
      <div className="space-y-6">
        <PanelHeader />
        <div className="card p-10 text-center text-gh-text-soft">
          <Loader2 className="w-6 h-6 mx-auto animate-spin mb-3" />
          Loading funnel data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PanelHeader />

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1">
          {(['7d', '14d', '30d', '90d'] as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === r ? 'bg-carolina text-white' : 'text-gh-text-soft hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(range)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gh-text-soft hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
          <button
            onClick={onDisconnect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gh-text-muted hover:text-red-300 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 flex items-start gap-2 text-sm text-red-200">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Sessions"
            value={fmt(summary.sessions)}
            sub="pm_flow_start"
            tone="neutral"
          />
          <SummaryCard
            label="Completion Rate"
            value={pct(summary.completion)}
            sub={`${fmt(summary.submit)} of ${fmt(summary.sessions)}`}
            tone={summary.completion >= 0.1 ? 'good' : summary.completion >= 0.04 ? 'warn' : 'bad'}
          />
          <SummaryCard
            label="Biggest Drop-off"
            value={summary.biggestLeakStep ? pct(summary.biggestLeakDropoff, 0) : '—'}
            sub={summary.biggestLeakStep ? `at ${summary.biggestLeakStep.label}` : 'no data'}
            tone="bad"
          />
          <SummaryCard
            label="Abandonment"
            value={fmt(summary.abandonment)}
            sub="pm_abandonment events"
            tone="warn"
          />
        </div>
      )}

      {/* Waterfall */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Funnel Waterfall</h3>
            <p className="text-xs text-gh-text-muted mt-0.5">
              Each bar shows event count and retention vs. previous step ({data?.range.label} window)
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {waterfall.map((step, i) => {
            const isLeak = summary?.biggestLeakIdx === i;
            return (
              <div
                key={step.id}
                className={`relative rounded-lg ${isLeak ? 'ring-2 ring-red-500/60 bg-red-500/[0.04]' : ''}`}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-32 flex-shrink-0">
                    <div className="text-xs font-medium text-white">{step.label}</div>
                    <div className="text-[10px] text-gh-text-muted font-mono">{step.id}</div>
                  </div>
                  <div className="flex-1 relative h-9 bg-white/[0.04] rounded-md overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-500"
                      style={{
                        width: `${Math.max(step.widthPct, 0.5)}%`,
                        background: `linear-gradient(90deg, ${step.color}cc, ${step.color}88)`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3">
                      <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                        {fmt(step.value)}
                      </span>
                      <span className="text-[11px] font-medium text-white/90">
                        {i === 0 ? 'baseline' : `${pct(step.retention, 1)} retained`}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 flex-shrink-0 text-right">
                    {i === 0 ? (
                      <span className="text-[10px] text-gh-text-muted">—</span>
                    ) : (
                      <span
                        className="text-xs font-medium"
                        style={{ color: step.dropoff > 0.5 ? '#FCA5A5' : step.dropoff > 0.3 ? '#FCD34D' : '#86EFAC' }}
                      >
                        −{pct(step.dropoff, 0)}
                      </span>
                    )}
                  </div>
                </div>
                {isLeak && (
                  <div className="absolute -top-2 right-3 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                    Biggest leak
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-4 text-[10px] text-gh-text-muted">
          <span>Color scale:</span>
          <LegendDot color="#22C55E" label="≥85% retained" />
          <LegendDot color="#FACC15" label="55–70%" />
          <LegendDot color="#EF4444" label="<40%" />
        </div>
      </div>

      {/* County breakdown */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white">County Breakdown</h3>
            <p className="text-xs text-gh-text-muted mt-0.5">
              Sessions and conversion by county (custom event parameter)
            </p>
          </div>
          {data && (
            <span className="text-[10px] text-gh-text-muted">
              {data.countyAvailable
                ? `${data.counties.length} counties with sessions`
                : 'county dimension unavailable'}
            </span>
          )}
        </div>
        {!data?.countyAvailable ? (
          <div className="text-sm text-gh-text-muted py-6 text-center">
            County dimension not registered as a custom event parameter in GA4.
          </div>
        ) : data.counties.length === 0 ? (
          <div className="text-sm text-gh-text-muted py-6 text-center">
            No county-tagged sessions in this date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-gh-text-muted border-b border-white/[0.06]">
                  <th className="text-left font-medium py-2 px-3">County</th>
                  <th className="text-right font-medium py-2 px-3">Sessions</th>
                  <th className="text-right font-medium py-2 px-3">Completions</th>
                  <th className="text-right font-medium py-2 px-3">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.counties.map((c) => (
                  <tr key={c.county} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-white">{c.county}</td>
                    <td className="py-2 px-3 text-right text-gh-text-soft font-mono">{fmt(c.sessions)}</td>
                    <td className="py-2 px-3 text-right text-gh-text-soft font-mono">{fmt(c.completions)}</td>
                    <td
                      className="py-2 px-3 text-right font-mono"
                      style={{ color: retentionColor(c.conversionRate * 5) }}
                    >
                      {pct(c.conversionRate, 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && (
        <div className="text-[10px] text-gh-text-muted text-right">
          Property {process.env.NEXT_PUBLIC_GA4_PROPERTY_ID || '501343914'} · fetched{' '}
          {new Date(data.fetchedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-carolina/10 border border-carolina/20">
        <BarChart3 className="w-5 h-5 text-carolina" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Plan Match Funnel</h2>
        <p className="text-xs text-gh-text-muted">
          GA4 event-based funnel for the Plan Match flow · property 501343914
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const accent =
    tone === 'good' ? '#22C55E' : tone === 'warn' ? '#FACC15' : tone === 'bad' ? '#EF4444' : '#4B9CD3';
  return (
    <div className="card p-4 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: accent, opacity: 0.6 }}
      />
      <div className="text-[10px] uppercase tracking-wide text-gh-text-muted font-medium">{label}</div>
      <div className="mt-1.5 font-display text-2xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-gh-text-muted mt-0.5 truncate">{sub}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </span>
  );
}
