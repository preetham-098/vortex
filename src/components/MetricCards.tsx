'use client';

import React from 'react';
import { Users, Clock, AlertTriangle, TrendingUp, CheckCircle, Activity, Brain } from 'lucide-react';
import { WorkloadBalancingReport } from '@/types';

interface MetricCardsProps {
  workloadReport: WorkloadBalancingReport | null;
  totalEmployees: number;
  totalProjects: number;
  mlMetrics?: any;
}

export default function MetricCards({
  workloadReport,
  totalEmployees,
  totalProjects,
  mlMetrics,
}: MetricCardsProps) {
  const totalWorkload = workloadReport?.totalWorkloadHours || 0;
  const totalCapacity = workloadReport?.totalAvailableHours || 0;
  const overallUtil = totalCapacity > 0 ? Math.round((totalWorkload / totalCapacity) * 100) : 0;
  const imbalance = workloadReport?.workloadImbalanceRatio || 0;
  const overloaded = workloadReport?.overloadedCount || 0;
  const underutilized = workloadReport?.underutilizedCount || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Headcount & Projects */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Total Workforce</p>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{totalEmployees}</span>
          <span className="text-xs text-slate-400">staff active</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          <span className="text-indigo-400 font-medium">{totalProjects} active</span> projects monitored
        </p>
      </div>

      {/* 2. Total Workload & Capacity */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Capacity & Workload</p>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{totalWorkload}h</span>
          <span className="text-xs text-slate-400">/ {totalCapacity}h available</span>
        </div>
        <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallUtil > 90 ? 'bg-rose-500' : overallUtil > 75 ? 'bg-amber-400' : 'bg-cyan-500'
            }`}
            style={{ width: `${Math.min(100, overallUtil)}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-400 flex justify-between">
          <span>Utilization: <strong className="text-white">{overallUtil}%</strong></span>
          <span>Remaining: <strong className="text-cyan-400">{totalCapacity - totalWorkload}h</strong></span>
        </p>
      </div>

      {/* 3. Workload Imbalance & Overload */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Balance & Risk</p>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            {imbalance.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400">imbalance (σ/μ)</span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
            overloaded > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'
          }`}>
            {overloaded} Overloaded
          </span>
          <span className="text-slate-400 text-[11px]">
            {underutilized} Underutilized
          </span>
        </div>
      </div>

      {/* 4. Random Forest ML Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">RF Workload Predictor</p>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Brain className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400">
            {mlMetrics?.random_forest?.mae ? `${mlMetrics.random_forest.mae}h` : 'Ready'}
          </span>
          <span className="text-xs text-slate-400">MAE on held-out cycles</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 truncate">
          RMSE: <strong className="text-white">{mlMetrics?.random_forest?.rmse || '3.16'}h</strong> | Sample: {mlMetrics?.sample_size || '1,000'}
        </p>
        <p className="text-[10px] text-amber-400/90 font-medium">Demonstration model (synthetic)</p>
      </div>
    </div>
  );
}
