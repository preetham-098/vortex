'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Briefcase,
  Layers,
  BrainCircuit,
  BarChart3,
  BookOpen,
  RefreshCw,
  Upload,
  Database,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { SYNTHETIC_DATASETS } from '@/lib/db/syntheticDatasets';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefreshData: () => void;
  onOpenCsvModal: () => void;
  activeDatasetId: string;
  onSelectDataset: (id: string) => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onRefreshData,
  onOpenCsvModal,
  activeDatasetId,
  onSelectDataset,
}: NavbarProps) {
  const { user, role, organizationId, switchMockRole } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleResetData = async () => {
    try {
      setSeeding(true);
      const res = await fetch(`/api/seed?force=true&dataset=${activeDatasetId}`, {
        method: 'POST',
        headers: {
          'x-organization-id': organizationId,
          'x-user-role': role,
        },
      });
      const data = await res.json();
      setNotice(data.message || 'Data re-seeded successfully');
      onRefreshData();
      setTimeout(() => setNotice(null), 4000);
    } catch (e) {
      console.error('Reset error:', e);
    } finally {
      setSeeding(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'matching', label: 'Talent Match & WSGA', icon: Users },
    { id: 'team_opt', label: 'Team Optimization', icon: Layers },
    { id: 'tasks', label: 'Task Allocation ILP', icon: Briefcase },
    { id: 'predictions', label: 'RF Workload Prediction', icon: BrainCircuit },
    { id: 'employees', label: 'Employee Roster', icon: Users },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'training', label: 'Training Catalog', icon: BookOpen },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Vortex Workforce</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                AMC HackAttack
              </span>
            </div>
            <p className="text-xs text-slate-400">AI-Assisted Workforce Optimization & Analytics Platform</p>
          </div>
        </div>

        {/* Right Controls: Dataset Switcher, CSV Upload, Role, Reset */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Selectable Synthetic Dataset Dropdown */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700 text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1.5 font-medium">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              Dataset:
            </span>
            <select
              value={activeDatasetId}
              onChange={(e) => onSelectDataset(e.target.value)}
              className="bg-slate-900 text-cyan-300 font-semibold px-2 py-1 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer text-xs"
            >
              {Object.values(SYNTHETIC_DATASETS).map(ds => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.badge})
                </option>
              ))}
            </select>
          </div>

          {/* CSV Import Button */}
          <button
            onClick={onOpenCsvModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 hover:text-cyan-300 rounded-lg border border-slate-700 transition shadow-sm"
            title="Import custom employees or projects via CSV"
          >
            <Upload className="h-3.5 w-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          {/* Seed/Reset Data Button */}
          <button
            onClick={handleResetData}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition"
            title="Reset current dataset to clean defaults"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${seeding ? 'animate-spin text-cyan-400' : ''}`} />
            {seeding ? 'Resetting...' : 'Reset'}
          </button>

          {/* Role Switcher */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700 text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              Role:
            </span>
            {(['manager', 'admin', 'employee'] as const).map(r => (
              <button
                key={r}
                onClick={() => switchMockRole(r)}
                className={`px-2.5 py-1 rounded-md capitalize transition ${
                  role === r
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1 scrollbar-thin">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="bg-cyan-950/90 border-t border-b border-cyan-800 px-4 py-1.5 text-center text-xs text-cyan-200 flex items-center justify-center gap-2 transition-all">
          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
          {notice}
        </div>
      )}
    </header>
  );
}
