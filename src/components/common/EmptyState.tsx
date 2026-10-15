import React from 'react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`glass-card p-10 flex flex-col items-center justify-center text-center rounded-2xl ${className}`}
      role="status"
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--accent)] flex items-center justify-center mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">
        {title}
      </h4>
      <p className="text-xs text-[var(--text-secondary)] max-w-md mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
