'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral' | 'warning';
  icon?: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  hero?: boolean;
  bars?: number;
}

function useCounted(target: number, duration = 600) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setDisplay(Math.round(eased * target));
      if (pct < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}

const TrendIcon = ({ type }: { type: StatCardProps['trendType'] }) => {
  if (type === 'positive') return <TrendingUp className="w-3 h-3" />;
  if (type === 'negative') return <TrendingDown className="w-3 h-3" />;
  if (type === 'warning') return <AlertTriangle className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
};

const trendStyles: Record<string, { bg: string; color: string }> = {
  positive: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80' },
  negative: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  warning:  { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  neutral:  { bg: 'rgba(255,255,255,0.08)', color: '#a1a1aa' },
};

const MiniBar: React.FC<{ bars: number; accent?: string }> = ({ bars, accent = '#ff5500' }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 4 }).map((_, i) => (
      <span
        key={i}
        className="rounded-full transition-all"
        style={{
          width: 18,
          height: 4,
          background: i < bars ? accent : 'rgba(255,255,255,0.12)',
        }}
      />
    ))}
  </div>
);

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix = '',
  trend,
  trendType = 'positive',
  icon,
  subtitle,
  onClick,
  className = '',
  hero = false,
  bars,
}) => {
  const numericValue = typeof value === 'number' ? value : NaN;
  const counted = useCounted(isNaN(numericValue) ? 0 : numericValue);
  const displayValue = isNaN(numericValue) ? value : counted;

  const ts = trendStyles[trendType || 'neutral'];

  if (hero) {
    return (
      <motion.div
        whileHover={{ y: -3, boxShadow: '0 20px 48px rgba(255,85,0,0.4)' }}
        transition={{ type: 'spring', damping: 20, stiffness: 280 }}
        onClick={onClick}
        className={`card-accent p-5 flex flex-col justify-between min-h-[140px] select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        style={{ boxShadow: '0 8px 32px rgba(255,85,0,0.3)' }}
      >
        <div className="flex items-start justify-between">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            {icon}
          </div>
          {trend && (
            <span
              className="delta-badge"
              style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}
            >
              <TrendIcon type={trendType} />
              {trend}
            </span>
          )}
        </div>

        <div>
          <span className="text-white/80 text-xs font-semibold uppercase tracking-micro block mb-1">
            {title}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
              {displayValue}
            </span>
            {suffix && <span className="text-lg font-semibold text-white/80">{suffix}</span>}
          </div>
          {subtitle && <p className="text-white/70 text-[11px] mt-1">{subtitle}</p>}
          {bars !== undefined && (
            <div className="mt-3">
              <MiniBar bars={bars} accent="rgba(255,255,255,0.85)" />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      onClick={onClick}
      className={`card-dark p-5 flex flex-col justify-between min-h-[140px] transition-shadow hover:shadow-lg select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,85,0,0.14)', color: '#ff5500' }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className="delta-badge"
            style={{ background: ts.bg, color: ts.color }}
          >
            <TrendIcon type={trendType} />
            {trend}
          </span>
        )}
      </div>

      <span
        className="text-xs font-semibold uppercase tracking-micro block"
        style={{ color: 'var(--text-secondary)' }}
      >
        {title}
      </span>

      <div className="flex items-baseline gap-1.5 my-1">
        <span
          className="text-3xl font-bold tracking-tight font-mono"
          style={{ color: 'var(--text-primary)' }}
        >
          {displayValue}
        </span>
        {suffix && (
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {suffix}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {subtitle && (
          <span className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
            {subtitle}
          </span>
        )}
        {bars !== undefined && (
          <MiniBar bars={bars} />
        )}
      </div>
    </motion.div>
  );
};
