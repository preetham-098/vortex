'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface ScoreRingProps {
  score: number; // 0 to 100
  size?: number; // width/height in px (default 68)
  strokeWidth?: number; // default 6
  label?: string;
  showText?: boolean;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 68,
  strokeWidth = 6,
  label = 'Match Score',
  showText = true,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Determine semantic color based on score threshold
  const getColor = () => {
    if (clampedScore >= 80) return 'var(--status-success)';
    if (clampedScore >= 60) return 'var(--accent)';
    if (clampedScore >= 45) return 'var(--status-warning)';
    return 'var(--status-danger)';
  };

  const ringColor = getColor();

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      role="progressbar"
      aria-valuenow={clampedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${clampedScore} percent`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Fill Circle with Spring Physics */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            type: 'spring',
            damping: 24,
            stiffness: 160,
            mass: 0.8,
          }}
        />
      </svg>

      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-bold text-xs tracking-tight text-[var(--text-primary)] font-mono"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {clampedScore}%
          </motion.span>
        </div>
      )}
    </div>
  );
};
