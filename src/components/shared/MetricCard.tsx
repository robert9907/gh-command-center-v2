'use client';

import { TrendDirection } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  previousValue?: string;
  trend: TrendDirection;
  /** For cost metrics, "down" is good */
  invertColor?: boolean;
  percentChange?: number;
  subtitle?: string;
  className?: string;
  delay?: number;
}

export default function MetricCard({
  label,
  value,
  trend,
  invertColor = false,
  percentChange,
  subtitle,
  className = '',
  delay = 0,
}: MetricCardProps) {
  const effectiveTrend = invertColor
    ? (trend === 'up' ? 'down' : trend === 'down' ? 'up' : 'stable')
    : trend;

  const trendColor =
    effectiveTrend === 'up'
      ? 'text-emerald-400'
      : effectiveTrend === 'down'
      ? 'text-red-400'
      : 'text-amber-400';

  const trendBg =
    effectiveTrend === 'up'
      ? 'bg-emerald-500/10'
      : effectiveTrend === 'down'
      ? 'bg-red-500/10'
      : 'bg-amber-500/10';

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={`card p-5 opacity-0 animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay * 0.05}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-gh-text-muted uppercase tracking-wider leading-tight">
          {label}
        </span>
        {percentChange !== undefined && (
          <span className={`${trendBg} ${trendColor} badge text-[10px]`}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(percentChange)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white tracking-tight leading-none mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] text-gh-text-faint mt-1.5">{subtitle}</div>
      )}
    </div>
  );
}
