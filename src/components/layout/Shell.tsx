'use client';

import React, { useState } from 'react';
import { Sidebar, NavigationView } from './Sidebar';
import { TopBar } from './TopBar';
import { Drawer } from '../ui/Drawer';
import { EmployeeDetailDrawer } from '../skills/EmployeeDetailDrawer';
import { Employee, Assignment } from '@/types';
import {
  LayoutDashboard,
  Sparkles,
  Scale,
  Grid,
  GraduationCap,
  Layers,
  RotateCcw,
  BrainCircuit,
  Users,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

export interface ShellProps {
  currentView: NavigationView;
  onSelectView: (view: NavigationView) => void;
  activeDatasetId: string;
  onSelectDataset: (id: string) => void;
  onOpenCsvModal: () => void;
  onRefreshData: () => void;
  onResetSeed: () => void;
  overloadedCount: number;
  selectedEmployee: Employee | null;
  onCloseEmployeeDrawer: () => void;
  assignments: Assignment[];
  toastMessage: string | null;
  onCloseToast: () => void;
  refreshing?: boolean;
  resetting?: boolean;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentView,
  onSelectView,
  activeDatasetId,
  onSelectDataset,
  onOpenCsvModal,
  onRefreshData,
  onResetSeed,
  overloadedCount,
  selectedEmployee,
  onCloseEmployeeDrawer,
  assignments,
  toastMessage,
  onCloseToast,
  refreshing,
  resetting,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavigationView; label: string; icon: any }[] = [
    { id: 'overview', label: 'Executive Cockpit', icon: LayoutDashboard },
    { id: 'project-match', label: 'Talent Match & WSGA', icon: Sparkles },
    { id: 'workload', label: 'Workload & Rebalance', icon: Scale },
    { id: 'skills', label: 'Skills & Heatmap', icon: Grid },
    { id: 'training', label: 'Upskill & Training', icon: GraduationCap },
    { id: 'predictions', label: 'RF ML Simulator', icon: BrainCircuit },
    { id: 'employees', label: 'Employee Roster', icon: Users },
    { id: 'projects', label: 'Project Pipeline', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)] antialiased transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={onSelectView}
        overloadedCount={overloadedCount}
        onResetSeed={onResetSeed}
        resetting={resetting}
      />

      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Navigation"
        description="Vortex Workforce Modules"
        width="max-w-xs"
      >
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-[var(--border-subtle)] mt-4">
            <button
              onClick={() => {
                onResetSeed();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--bg-surface-secondary)] text-xs font-semibold text-[var(--accent)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Seed
            </button>
          </div>
        </div>
      </Drawer>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentView={currentView}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          activeDatasetId={activeDatasetId}
          onSelectDataset={onSelectDataset}
          onOpenCsvModal={onOpenCsvModal}
          onRefreshData={onRefreshData}
          refreshing={refreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Employee Detail Drawer */}
      <EmployeeDetailDrawer
        employee={selectedEmployee}
        onClose={onCloseEmployeeDrawer}
        assignments={assignments}
      />

      {/* Global Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-elevated px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[var(--accent)]/40 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">{toastMessage}</span>
          <button
            onClick={onCloseToast}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] ml-2 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
