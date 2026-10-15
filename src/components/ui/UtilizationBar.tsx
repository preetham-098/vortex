'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface UtilizationBarProps {
  rate: number; // e.g. 1.25 for 125%, 0.45 for 45%
  assignedHours: number;
  capacity?: number; // default 40
  showLabels?: boolean;
  className?: string;
}

export const UtilizationBar: React.FC<UtilizationBarProps> = ({
  rate,
  assignedHours,
  capacity = 40,
  showLabels = true,
  className = '',
}) => {
  const percentage = Math.round(rate * 100);

  // Status mapping:
  // Over 100% -> danger/overloaded
  // Under 50% -> underutilized
  // 50-100% -> healthy/success
  let color = 'var(--status-success)';
  let statusText = 'Healthy';
  if (percentage > 100) {
    color = 'var(--status-danger)';
    statusText = 'Overloaded';
  } else if (percentage < 50) {
    color = 'var(--status-underutilized)';
    statusText = 'Underutilized';
  }

  // Cap visual bar width display to 140% scale
  const visualWidth = Math.min(100, (percentage / 140) * 100);
  const mark100 = (100 / 140) * 100; // Position of 100% capacity line
  const mark50 = (50 / 140) * 100; // Position of 50% capacity line

  return (
    <div
      className={`flex flex-col gap-1.5 w-full ${className}`}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={150}
      aria-label={`Utilization: ${percentage}%, ${assignedHours} of ${capacity} hours assigned (${statusText})`}
    >
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="font-medium text-[var(--text-primary)]">
              {assignedHours}h <span className="text-[var(--text-tertiary)] font-normal">/ {capacity}h</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-tertiary)] text-[11px] font-medium">{statusText}</span>
            <span className="font-semibold text-xs font-mono" style={{ color }}>
              {percentage}%
            </span>
          </div>
        </div>
      )}

      {/* Bar container */}
      <div className="relative h-2 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
        {/* 50% threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-[var(--text-tertiary)] opacity-30 z-10"
          style={{ left: `${mark50}%` }}
          title="50% threshold"
        />
        {/* 100% threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-[1.5px] bg-[var(--text-secondary)] opacity-50 z-10"
          style={{ left: `${mark100}%` }}
          title="100% capacity threshold"
        />

        {/* Animated fill */}
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${visualWidth}%` }}
          transition={{
            type: 'spring',
            damping: 26,
            stiffness: 140,
            mass: 0.9,
          }}
        />
      </div>
    </div>
  );
};
