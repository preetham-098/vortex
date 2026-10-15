import React from 'react';
import { cn } from './Button';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'healthy' | 'overloaded' | 'underutilized' | 'neutral' | 'accent' | 'warning';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  size = 'md',
}) => {
  const variants = {
    healthy: 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success)]/20',
    overloaded: 'bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger)]/20',
    underutilized: 'bg-[var(--status-underutilized-bg)] text-[var(--status-underutilized)] border-[var(--status-underutilized)]/20',
    warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/20',
    accent: 'bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent)]/30',
    neutral: 'bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 tracking-tight',
    md: 'text-xs px-2.5 py-1 tracking-tight',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border select-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
};
