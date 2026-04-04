import { TrendDirection, WeeklyMetrics } from '@/types';

// ── localStorage with error handling ──
export function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

// ── Trend Calculation ──
export function calcTrend(current: number, previous: number): TrendDirection {
  if (current === previous) return 'stable';
  return current > previous ? 'up' : 'down';
}

export function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ── For metrics where DOWN is good (cost, CPA, CPC) ──
export function invertTrend(trend: TrendDirection): TrendDirection {
  if (trend === 'up') return 'down';
  if (trend === 'down') return 'up';
  return 'stable';
}

// ── Formatting ──
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

// ── Week-over-week summary ──
export function getLatestTwoWeeks(data: WeeklyMetrics[]): { current: WeeklyMetrics; previous: WeeklyMetrics } | null {
  if (data.length < 2) return null;
  const sorted = [...data].sort((a, b) => b.weekOf.localeCompare(a.weekOf));
  return { current: sorted[0], previous: sorted[1] };
}

// ── CTR calculation ──
export function calcCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}
