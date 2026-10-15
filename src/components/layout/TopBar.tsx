'use client';

import React from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuth } from '@/context/AuthContext';
import { SYNTHETIC_DATASETS } from '@/lib/db/syntheticDatasets';
import { NavigationView } from './Sidebar';
import {
  Sun,
  Moon,
  Menu,
  Upload,
  Database,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export interface TopBarProps {
  currentView: NavigationView;
  onToggleMobileMenu: () => void;
  activeDatasetId: string;
  onSelectDataset: (id: string) => void;
  onOpenCsvModal: () => void;
  onRefreshData: () => void;
  refreshing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onToggleMobileMenu,
  activeDatasetId,
  onSelectDataset,
  onOpenCsvModal,
  onRefreshData,
  refreshing,
}) => {
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const { role, switchMockRole } = useAuth();

  const viewTitles: Record<NavigationView, string> = {
    overview: 'Executive Cockpit',
    'project-match': 'Talent Match & WSGA',
    workload: 'Workload & Rebalance',
    skills: 'Skills & Heatmap',
    training: 'Upskill & Training',
    predictions: 'RF ML Workload Simulator',
    employees: 'Employee Roster',
    projects: 'Project Pipeline',
  };

  return (
    <header className="sticky top-0 z-20 w-full glass-chrome border-b border-[var(--border-subtle)] px-4 sm:px-6 py-3 flex items-center justify-between transition-colors">
      {/* Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] md:hidden focus:outline-none cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-tertiary)] hidden sm:inline">
            Vortex Intel
          </span>
          <span className="text-xs text-[var(--text-tertiary)] hidden sm:inline">/</span>
          <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
            {viewTitles[currentView]}
          </span>
        </div>
      </div>

      {/* Right Controls: Dataset Switcher, CSV Upload, Theme Toggle, Role */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Synthetic Dataset Selector */}
        <div className="flex items-center bg-[var(--bg-surface-secondary)] rounded-xl px-2 py-1 border border-[var(--border-subtle)] text-xs shadow-xs">
          <span className="text-[var(--text-secondary)] pr-1.5 flex items-center gap-1 font-medium hidden sm:flex">
            <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
            Dataset:
          </span>
          <select
            value={activeDatasetId}
            onChange={(e) => onSelectDataset(e.target.value)}
            className="bg-transparent text-[var(--accent)] font-bold text-xs focus:outline-none cursor-pointer py-0.5"
            aria-label="Select synthetic dataset"
          >
            {Object.values(SYNTHETIC_DATASETS).map((ds) => (
              <option key={ds.id} value={ds.id} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                {ds.name}
              </option>
            ))}
          </select>
        </div>

        {/* CSV Import Button */}
        <button
          onClick={onOpenCsvModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all active:scale-95 cursor-pointer shadow-xs"
          title="Import CSV with preview & validation"
        >
          <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="hidden sm:inline">Import CSV</span>
        </button>

        {/* Refresh Live Analytics */}
        <button
          onClick={onRefreshData}
          disabled={refreshing}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] border border-transparent hover:border-[var(--border-subtle)] transition-all active:scale-95 cursor-pointer"
          title="Refresh analytics and re-run models"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 text-[var(--accent)] ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Dark / Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] border border-transparent hover:border-[var(--border-subtle)] transition-all active:scale-95 cursor-pointer"
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--accent)]" />}
        </button>

        {/* Evaluator Role Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-[var(--bg-surface-secondary)] rounded-xl p-0.5 border border-[var(--border-subtle)] text-[11px]">
          {(['manager', 'admin', 'employee'] as const).map((r) => (
            <button
              key={r}
              onClick={() => switchMockRole(r)}
              className={`px-2 py-0.5 rounded-lg capitalize font-medium transition cursor-pointer ${
                role === r
                  ? 'bg-[var(--accent)] text-white font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
