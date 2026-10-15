'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Sparkles,
  Scale,
  Grid,
  GraduationCap,
  Layers,
  RotateCcw,
  ShieldCheck,
  BrainCircuit,
  Users,
  Briefcase,
} from 'lucide-react';

export type NavigationView =
  | 'overview'
  | 'project-match'
  | 'workload'
  | 'skills'
  | 'training'
  | 'predictions'
  | 'employees'
  | 'projects';

export interface SidebarProps {
  currentView: NavigationView;
  onSelectView: (view: NavigationView) => void;
  overloadedCount: number;
  onResetSeed: () => void;
  resetting?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  overloadedCount,
  onResetSeed,
  resetting,
}) => {
  const navItems: {
    id: NavigationView;
    label: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Executive Cockpit', icon: LayoutDashboard },
    { id: 'project-match', label: 'Talent Match & WSGA', icon: Sparkles },
    {
      id: 'workload',
      label: 'Workload & Rebalance',
      icon: Scale,
      badge: overloadedCount > 0 ? `${overloadedCount}` : undefined,
      badgeColor: 'bg-[#ef4444] text-white',
    },
    { id: 'skills', label: 'Skills & Heatmap', icon: Grid },
    { id: 'training', label: 'Upskill & Training', icon: GraduationCap },
    { id: 'predictions', label: 'RF ML Simulator', icon: BrainCircuit },
    { id: 'employees', label: 'Employee Roster', icon: Users },
    { id: 'projects', label: 'Project Pipeline', icon: Briefcase },
  ];

  return (
    <aside
      className="w-[230px] h-screen sticky top-0 flex-shrink-0 flex flex-col justify-between z-30 select-none hidden md:flex sidebar-surface border-r border-[var(--sidebar-border)]"
      aria-label="Main Navigation"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      <div className="p-4">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: '#ff5500', boxShadow: '0 4px 14px rgba(255,85,0,0.45)' }}
          >
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block text-white">
              Vortex Intel
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              AMC HackAttack 2026
            </span>
          </div>
        </div>

        {/* Section Label */}
        <span
          className="px-2 text-[10px] font-bold uppercase tracking-[0.1em] block mb-2 text-slate-500"
        >
          Intelligence Modules
        </span>

        {/* Nav Items */}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className="relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5500]"
                style={{
                  color: isActive ? '#f4f4f5' : '#a1a1aa',
                  background: isActive ? 'rgba(255,85,0,0.15)' : 'transparent',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active Pill Animation */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-xl -z-10"
                    style={{
                      background: 'rgba(255,85,0,0.15)',
                      border: '1px solid rgba(255,85,0,0.3)',
                    }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  />
                )}

                {/* Hover highlight */}
                {!isActive && (
                  <span
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />
                )}

                <div className="flex items-center gap-2.5">
                  <Icon
                    className="w-4 h-4 flex-shrink-0 transition-colors"
                    style={{ color: isActive ? '#ff5500' : '#71717a' }}
                  />
                  <span className="text-[12px] truncate font-medium">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] min-w-[18px] h-4 px-1 rounded-full font-bold flex items-center justify-center font-mono ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Area */}
      <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Status Chip */}
        <div
          className="p-3 rounded-xl text-xs space-y-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Evaluation Ready</span>
          </div>
          <p className="leading-tight text-[11px] text-slate-400">
            Multi-objective optimization active.
          </p>
        </div>

        {/* Reset Demo Seed Button */}
        <button
          onClick={onResetSeed}
          disabled={resetting}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          title="Reset current synthetic dataset"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-[var(--accent)] ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo Seed'}</span>
        </button>
      </div>
    </aside>
  );
};
