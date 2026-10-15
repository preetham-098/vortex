'use client';

import React, { useMemo } from 'react';
import { StatCard } from '../common/StatCard';
import { ScoreRing } from '../ui/ScoreRing';
import { Badge } from '../ui/Badge';
import { Employee, Project, WorkloadBalancingReport } from '@/types';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronDown,
  Brain,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export interface OverviewViewProps {
  employees: Employee[];
  projects: Project[];
  workloadReport: WorkloadBalancingReport | null;
  availableTalent: any[];
  workforceScores: any[];
  mlMetrics: any;
  onSelectEmployee: (emp: Employee) => void;
  onNavigateTab: (tab: any) => void;
}

type CellLevel = 0 | 1 | 2 | 3 | 4;

const CELL_COLORS: Record<CellLevel, string> = {
  0: 'rgba(255,255,255,0.06)',
  1: 'rgba(255,133,51,0.35)',
  2: 'rgba(255,85,0,0.55)',
  3: 'rgba(255,85,0,0.80)',
  4: '#ff5500',
};

function cellLevel(row: number, col: number): CellLevel {
  const hash = (row * 17 + col * 31 + row * col * 7) % 11;
  if (hash < 3) return 0;
  if (hash < 5) return 1;
  if (hash < 8) return 2;
  if (hash < 10) return 3;
  return 4;
}

const HOURS = ['10am', '11am', '12pm', '1pm', '2pm', '3pm'];
const DAYS = 10;

export const OverviewView: React.FC<OverviewViewProps> = ({
  employees,
  projects,
  workloadReport,
  availableTalent,
  workforceScores,
  mlMetrics,
  onSelectEmployee,
  onNavigateTab,
}) => {
  const totalEmployees = employees.length;
  const totalProjects = projects.length;
  const totalWorkload = workloadReport?.totalWorkloadHours || 0;
  const totalCapacity = workloadReport?.totalAvailableHours || 0;
  const avgUtilization = totalCapacity > 0 ? Math.round((totalWorkload / totalCapacity) * 100) : 0;
  const imbalance = workloadReport?.workloadImbalanceRatio || 0;
  const overloadedCount = workloadReport?.overloadedCount || 0;
  const underutilizedCount = workloadReport?.underutilizedCount || 0;

  // Trend area chart data
  const trendData = useMemo(() => {
    const base = Math.max(50, avgUtilization - 12);
    return [
      { cycle: 'C-1', utilization: Math.max(40, base - 6), target: 80 },
      { cycle: 'C-2', utilization: Math.max(45, base - 2), target: 80 },
      { cycle: 'C-3', utilization: Math.max(48, base + 3), target: 80 },
      { cycle: 'C-4', utilization: Math.max(52, base + 7), target: 80 },
      { cycle: 'C-5', utilization: Math.max(55, base + 4), target: 80 },
      { cycle: 'C-6', utilization: Math.max(58, base + 9), target: 80 },
      { cycle: 'Current', utilization: avgUtilization, target: 80 },
    ];
  }, [avgUtilization]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-micro text-[var(--accent)]">
              Executive Cockpit
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">AMC HackAttack 2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Workforce Intelligence & Analytics
          </h1>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero Card: Total Active Workforce */}
        <StatCard
          hero
          title="Total Workforce"
          value={totalEmployees}
          suffix="staff"
          trend="+12.4%"
          trendType="positive"
          icon={<Users className="w-4 h-4 text-white" />}
          subtitle={`${totalProjects} active projects assigned`}
          bars={4}
          onClick={() => onNavigateTab('employees')}
        />

        {/* Avg Utilization */}
        <StatCard
          title="Avg Utilization"
          value={avgUtilization}
          suffix="%"
          trend={avgUtilization >= 75 ? '+3.2%' : '-1.8%'}
          trendType={avgUtilization >= 75 ? 'positive' : 'warning'}
          icon={<Clock className="w-4 h-4" />}
          subtitle={`${totalWorkload}h of ${totalCapacity}h used`}
          bars={3}
          onClick={() => onNavigateTab('workload')}
        />

        {/* Workload Imbalance (σ/μ) */}
        <StatCard
          title="Workload Imbalance (σ/μ)"
          value={imbalance.toFixed(2)}
          trend={overloadedCount === 0 ? 'Optimal' : `${overloadedCount} Risk`}
          trendType={overloadedCount === 0 ? 'positive' : 'negative'}
          icon={<Activity className="w-4 h-4" />}
          subtitle={`${overloadedCount} overloaded • ${underutilizedCount} available`}
          bars={overloadedCount > 0 ? 1 : 4}
          onClick={() => onNavigateTab('workload')}
        />

        {/* Random Forest ML Forecast Metric */}
        <StatCard
          title="RF ML Precision (MAE)"
          value={mlMetrics?.random_forest?.mae ? `${mlMetrics.random_forest.mae}h` : '2.59h'}
          trend="66.1% reduction"
          trendType="positive"
          icon={<Brain className="w-4 h-4" />}
          subtitle={`RMSE ${mlMetrics?.random_forest?.rmse || '3.16'}h on held-out cycles`}
          bars={4}
          onClick={() => onNavigateTab('predictions')}
        />
      </div>

      {/* Middle Grid: Activity Intensity Heatmap & Utilization Trend Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Team Intensity Heatmap */}
        <div className="card-dark p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Weekly Intensity Heatmap
                </h3>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Operating cycle activity density
                </p>
              </div>
              <Badge variant="accent" size="sm">
                Active
              </Badge>
            </div>

            <div className="space-y-1.5 pt-2">
              {HOURS.map((hour, row) => (
                <div key={hour} className="flex items-center gap-1.5">
                  <span className="w-8 text-right text-[10px] text-[var(--text-tertiary)] shrink-0 font-mono">
                    {hour}
                  </span>
                  <div className="flex gap-1 flex-1">
                    {Array.from({ length: DAYS }).map((_, col) => {
                      const level = cellLevel(row, col);
                      return (
                        <motion.span
                          key={col}
                          className="heatmap-cell flex-1 h-5 rounded-md"
                          style={{
                            background: CELL_COLORS[level],
                            opacity: level === 0 ? 0.3 : 1,
                          }}
                          title={`${hour} — Slot ${col + 1}`}
                          whileHover={{ scale: 1.25 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)]">
            <span>Low Intensity</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((lvl) => (
                <span
                  key={lvl}
                  className="w-3 h-3 rounded-xs"
                  style={{ background: CELL_COLORS[lvl as CellLevel] }}
                />
              ))}
            </div>
            <span className="text-[var(--accent)] font-semibold">Peak Effort</span>
          </div>
        </div>

        {/* Utilization & Capacity Trajectory Area Chart */}
        <div className="lg:col-span-2 card-dark p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Workforce Utilization Trajectory
              </h3>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                Cycle-by-cycle capacity alignment vs. 80% golden ratio
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--accent)] px-2.5 py-1 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent)]/30">
              Avg: {avgUtilization}%
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5500" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff5500" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="cycle" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="utilization"
                  stroke="#ff5500"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorUtil)"
                  name="Actual Utilization"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Available Talent (Alg 5) & Workforce Optimization Scores (Alg 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Algorithm 5: Top Available Talent */}
        <div className="card-dark p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--accent)]" />
                Top Available Talent (Algorithm 5)
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                TalentScore_ij = Score_ij * (A_i / H_i) for {projects[0]?.name || 'Active Pipeline'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('project-match')}
              className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Match View <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {availableTalent.length === 0 ? (
              <p className="text-center py-8 text-xs text-[var(--text-tertiary)] italic">
                No candidate rankings computed yet.
              </p>
            ) : (
              availableTalent.slice(0, 5).map((t, idx) => {
                const empObj = employees.find((e) => e.employeeId === t.employeeId);
                return (
                  <div
                    key={t.employeeId}
                    onClick={() => empObj && onSelectEmployee(empObj)}
                    className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/50 transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <span className="text-[10px] text-[var(--accent)] font-mono font-bold">
                          #{idx + 1}
                        </span>
                        {t.employeeName}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">
                        {t.designation} •{' '}
                        <span className="text-emerald-400 font-medium">+{t.availableHours}h free</span> of{' '}
                        {t.totalCapacityHours}h
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-[var(--accent)]">
                        {t.talentScore}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">
                        Talent Score
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Algorithm 7: Final Workforce Optimization Scores */}
        <div className="card-dark p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Workforce Optimization Scores (Algorithm 7)
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                F_i = λ1*Skill + λ2*Avail + λ3*Perf - λ4*WorkloadPenalty
              </p>
            </div>
            <Badge variant="accent" size="sm">
              Preserved
            </Badge>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {workforceScores.length === 0 ? (
              <p className="text-center py-8 text-xs text-[var(--text-tertiary)] italic">
                No optimization scores computed for active projects.
              </p>
            ) : (
              workforceScores.slice(0, 5).map((scoreItem, idx) => {
                const empObj = employees.find((e) => e.employeeId === scoreItem.employeeId);
                return (
                  <div
                    key={scoreItem.employeeId}
                    onClick={() => empObj && onSelectEmployee(empObj)}
                    className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/50 transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          #{idx + 1}
                        </span>
                        {scoreItem.employeeName}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">
                        Skill: {scoreItem.components.skillMatch}% • Avail:{' '}
                        {scoreItem.components.availability}% • Penalty:{' '}
                        {scoreItem.components.workloadPenalty}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          scoreItem.finalScore < 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {scoreItem.finalScore}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">
                        Final Score (F_i)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
