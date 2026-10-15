'use client';

import React, { useState } from 'react';
import { Employee, Project, WorkloadBalancingReport, TaskAllocationResult } from '@/types';
import { UtilizationBar } from '../ui/UtilizationBar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Scale,
  ArrowRight,
  CheckCircle,
  AlertOctagon,
  TrendingDown,
  Sparkles,
  Search,
  Filter,
  Briefcase,
  Play,
  Save,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface WorkloadViewProps {
  employees: Employee[];
  projects: Project[];
  report: WorkloadBalancingReport | null;
  onSelectEmployee?: (emp: Employee) => void;
  onRefreshData: () => void;
  onShowToast: (msg: string) => void;
}

export const WorkloadView: React.FC<WorkloadViewProps> = ({
  employees,
  projects,
  report,
  onSelectEmployee,
  onRefreshData,
  onShowToast,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'overloaded' | 'underutilized' | 'healthy'>('all');
  const [search, setSearch] = useState('');
  const [isILPMode, setIsILPMode] = useState(false);

  // ILP Task Allocation State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.projectId || '');
  const [allocationResult, setAllocationResult] = useState<TaskAllocationResult | null>(null);
  const [solvingILP, setSolvingILP] = useState(false);
  const [committing, setCommitting] = useState(false);

  // Partition employees into groups based on report or calculations
  const employeeMetrics = report?.employeeMetrics || [];

  const overloadedList = employeeMetrics.filter((e) => e.status === 'overloaded');
  const underutilizedList = employeeMetrics.filter((e) => e.status === 'underutilized');
  const healthyList = employeeMetrics.filter((e) => e.status === 'optimal' || e.status === 'approaching_capacity');

  const filteredMetrics = employeeMetrics.filter((m) => {
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'healthy'
        ? m.status === 'optimal' || m.status === 'approaching_capacity'
        : m.status === activeFilter;

    const matchesSearch =
      m.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const runILP = async () => {
    if (!selectedProjectId) return;
    setSolvingILP(true);
    try {
      const res = await fetch('/api/algorithms/task-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          alpha: 0.5,
          beta: 0.3,
          gamma: 0.2,
          tau: 50,
        }),
      });
      const data = await res.json();
      setAllocationResult(data);
    } catch (e) {
      console.error('Task allocation solver error:', e);
    } finally {
      setSolvingILP(false);
    }
  };

  const handleManagerApproveAndCommit = async () => {
    if (!allocationResult || !allocationResult.proposals) return;
    setCommitting(true);
    try {
      const res = await fetch('/api/algorithms/task-allocation?commit=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          approvedProposals: allocationResult.proposals,
        }),
      });
      const data = await res.json();
      onShowToast(data.message || 'Task assignments successfully persisted.');
      onRefreshData();
    } catch (e) {
      console.error('Commit error:', e);
    } finally {
      setCommitting(false);
    }
  };

  const ilpChartData = allocationResult
    ? Object.keys(allocationResult.beforeWorkload).map((empId) => ({
        empId,
        before: allocationResult.beforeWorkload[empId],
        after: allocationResult.afterWorkload[empId] || allocationResult.beforeWorkload[empId],
      }))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-micro text-[var(--status-danger)]">
              Workload Intelligence & Optimization
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Burnout prevention & capacity balancing</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Capacity & Workload Rebalancing
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isILPMode ? 'primary' : 'secondary'}
            onClick={() => {
              setIsILPMode(!isILPMode);
              if (!isILPMode && !allocationResult && selectedProjectId) {
                runILP();
              }
            }}
          >
            <Scale className="w-4 h-4 mr-1.5" />
            {isILPMode ? 'Hide ILP Solver' : 'Open ILP Task Allocator'}
          </Button>
        </div>
      </div>

      {/* KPI Capacity Spectrum Radar */}
      <div className="card-dark p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overloaded Critical Radar */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'overloaded' ? 'all' : 'overloaded')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
              activeFilter === 'overloaded'
                ? 'bg-[var(--status-danger-bg)] border-[var(--status-danger)] ring-1 ring-[var(--status-danger)]'
                : 'bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)] hover:border-[var(--status-danger)]/40'
            }`}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-[var(--status-danger-bg)] border border-[var(--status-danger)]/40 flex items-center justify-center text-[var(--status-danger)] shadow-xs">
                <span className="text-xl font-bold font-mono">{overloadedList.length}</span>
              </div>
              {overloadedList.length > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--status-danger)] rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--status-danger)] rounded-full" />
                </>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Overloaded (&gt;100%)</h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Exceeding maximum standard weekly capacity
              </p>
            </div>
          </div>

          {/* Healthy / Balanced Radar */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'healthy' ? 'all' : 'healthy')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
              activeFilter === 'healthy'
                ? 'bg-[var(--status-success-bg)] border-[var(--status-success)] ring-1 ring-[var(--status-success)]'
                : 'bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)] hover:border-[var(--status-success)]/40'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--status-success-bg)] border border-[var(--status-success)]/40 flex items-center justify-center text-[var(--status-success)] shadow-xs">
              <span className="text-xl font-bold font-mono">{healthyList.length}</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Healthy (50% – 100%)</h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Optimal operational bandwidth
              </p>
            </div>
          </div>

          {/* Underutilized Radar */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'underutilized' ? 'all' : 'underutilized')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
              activeFilter === 'underutilized'
                ? 'bg-[var(--status-underutilized-bg)] border-[var(--status-underutilized)] ring-1 ring-[var(--status-underutilized)]'
                : 'bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)] hover:border-[var(--status-underutilized)]/40'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--status-underutilized-bg)] border border-[var(--status-underutilized)]/40 flex items-center justify-center text-[var(--status-underutilized)] shadow-xs">
              <span className="text-xl font-bold font-mono">{underutilizedList.length}</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)]">Underutilized (&lt;50%)</h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Available talent reserve for task intake
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Constrained Task Allocation ILP Optimization Solver (Algorithm 4) */}
      {isILPMode && (
        <div className="card-dark p-6 space-y-6 border-[var(--accent)]/40 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[var(--accent)]" />
                Integer Linear Programming (ILP) Task Solver
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Minimizes objective penalty under capacity constraints (Algorithm 4). Requires manager approval before persisting.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)]"
              >
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.name} ({p.tasks?.length || 0} tasks)
                  </option>
                ))}
              </select>

              <Button variant="primary" size="sm" onClick={runILP} disabled={solvingILP}>
                <Play className="w-3.5 h-3.5 mr-1" />
                {solvingILP ? 'Solving...' : 'Solve ILP'}
              </Button>
            </div>
          </div>

          {allocationResult && (
            <div className="space-y-6">
              {/* Proposals Table */}
              <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)]">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Solver Output: {allocationResult.isOptimal ? 'Globally Optimal' : 'Constrained'}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)] ml-2">
                      Objective Cost: {allocationResult.totalObjectiveCost}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleManagerApproveAndCommit}
                    disabled={committing || allocationResult.proposals.every((p) => p.feasibilityStatus !== 'feasible')}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {committing ? 'Committing...' : 'Manager Approval: Commit Assignments'}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-surface)] text-[var(--text-secondary)] uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Task</th>
                        <th className="py-2 px-3">Effort</th>
                        <th className="py-2 px-3">Assigned Candidate</th>
                        <th className="py-2 px-3">Skill Match</th>
                        <th className="py-2 px-3">Penalty Cost</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {allocationResult.proposals.map((prop) => (
                        <tr key={prop.taskId}>
                          <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                            {prop.taskTitle}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{prop.effortHours}h</td>
                          <td className="py-2.5 px-3 font-semibold text-[var(--accent)]">
                            {prop.assignedEmployeeName || 'Unassigned'}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{prop.skillMatchScore}%</td>
                          <td className="py-2.5 px-3 font-mono">{prop.penaltyCost.toFixed(1)}</td>
                          <td className="py-2.5 px-3">
                            <Badge
                              size="sm"
                              variant={prop.feasibilityStatus === 'feasible' ? 'healthy' : 'overloaded'}
                            >
                              {prop.feasibilityStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Before vs After Workload Chart */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ilpChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="empId" stroke="var(--text-tertiary)" fontSize={11} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={11} unit="h" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-subtle)',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="before" name="Pre-Allocation" fill="#71717a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" name="Post-Allocation" fill="#ff5500" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employee Capacity Roster Cards */}
      <div className="card-dark p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Workforce Capacity Spectrum ({filteredMetrics.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] w-60"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMetrics.map((m) => {
            const empObj = employees.find((e) => e.employeeId === m.employeeId);
            const rate = m.availableWorkingHours > 0 ? m.assignedWorkloadHours / m.availableWorkingHours : 0;

            return (
              <div
                key={m.employeeId}
                onClick={() => empObj && onSelectEmployee && onSelectEmployee(empObj)}
                className="p-4 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/50 transition cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">
                      {m.employeeName}
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">{m.department}</p>
                  </div>
                  <Badge
                    size="sm"
                    variant={
                      m.status === 'overloaded'
                        ? 'overloaded'
                        : m.status === 'underutilized'
                        ? 'underutilized'
                        : 'healthy'
                    }
                  >
                    {m.status}
                  </Badge>
                </div>

                <UtilizationBar
                  rate={rate}
                  assignedHours={m.assignedWorkloadHours}
                  capacity={m.availableWorkingHours}
                  showLabels={true}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
