'use client';

import React, { useState, useEffect } from 'react';
import { Project, TaskAllocationResult } from '@/types';
import {
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Play,
  Save,
  Clock,
  ArrowRight,
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

interface TaskAllocationViewProps {
  projects: Project[];
  onCommitSuccess: () => void;
}

export default function TaskAllocationView({ projects, onCommitSuccess }: TaskAllocationViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.projectId || '');
  const [allocationResult, setAllocationResult] = useState<TaskAllocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);

  const selectedProject = projects.find(p => p.projectId === selectedProjectId);

  useEffect(() => {
    if (projects.length > 0 && !projects.some(p => p.projectId === selectedProjectId)) {
      setSelectedProjectId(projects[0].projectId);
      setAllocationResult(null);
    }
  }, [projects, selectedProjectId]);

  const runAllocation = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setCommitMessage(null);
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
      console.error('Task allocation error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      runAllocation();
    }
  }, [selectedProjectId]);

  if (projects.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center space-y-3">
        <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">No Projects Available for Task Allocation</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please create a project or select another synthetic dataset from the top navigation bar to run Integer Linear Programming task allocation.
        </p>
      </div>
    );
  }

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
      setCommitMessage(data.message || 'Assignments committed to database.');
      onCommitSuccess();
    } catch (e) {
      console.error('Commit error:', e);
    } finally {
      setCommitting(false);
    }
  };

  // Prepare before/after workload chart data
  const chartData = allocationResult
    ? Object.keys(allocationResult.beforeWorkload).map(empId => ({
        empId,
        before: allocationResult.beforeWorkload[empId],
        after: allocationResult.afterWorkload[empId] || allocationResult.beforeWorkload[empId],
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-cyan-400" />
              Constrained Task Allocation (ILP Optimization)
            </h2>
            <p className="text-xs text-slate-400">
              Minimizes objective penalty under capacity constraints (Algorithm 4). Requires manager approval before persisting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name} ({p.tasks?.length || 0} tasks)
                </option>
              ))}
            </select>

            <button
              onClick={runAllocation}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            >
              <Play className="h-3.5 w-3.5 text-cyan-400" />
              {loading ? 'Solving...' : 'Re-Run ILP'}
            </button>
          </div>
        </div>

        {commitMessage && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{commitMessage}</span>
          </div>
        )}
      </div>

      {allocationResult && (
        <div className="space-y-6">
          {/* Unassignable / Infeasibility Alerts */}
          {allocationResult.capacityViolations.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 text-xs space-y-1.5">
              <div className="font-semibold text-rose-300 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Infeasible Task Allocations Detected ({allocationResult.unassignableTasks.length} unassigned)
              </div>
              <ul className="list-disc list-inside text-rose-200 text-[11px] space-y-0.5">
                {allocationResult.capacityViolations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Proposals Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Proposed Task Allocations ({allocationResult.proposals.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Solver Status: <strong className="text-cyan-400">{allocationResult.isOptimal ? 'Globally Optimal' : 'Constrained'}</strong> |
                  Objective Cost: <span className="font-mono text-white">{allocationResult.totalObjectiveCost}</span>
                </p>
              </div>

              {/* Manager Approval & Commit Button */}
              <button
                onClick={handleManagerApproveAndCommit}
                disabled={committing || allocationResult.proposals.every(p => p.feasibilityStatus !== 'feasible')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {committing ? 'Committing...' : 'Manager Approval: Commit Assignments'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Task</th>
                    <th className="py-2.5 px-3">Effort</th>
                    <th className="py-2.5 px-3">Assigned Candidate</th>
                    <th className="py-2.5 px-3">Skill Match</th>
                    <th className="py-2.5 px-3">Penalty Cost</th>
                    <th className="py-2.5 px-3">Feasibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {allocationResult.proposals.map((prop) => (
                    <tr key={prop.taskId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{prop.taskTitle}</div>
                        <div className="text-[10px] text-slate-400">{prop.notes}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-200">
                        {prop.effortHours} hrs
                      </td>
                      <td className="py-3 px-3">
                        {prop.assignedEmployeeName ? (
                          <span className="font-semibold text-cyan-300">
                            {prop.assignedEmployeeName}
                          </span>
                        ) : (
                          <span className="text-rose-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {prop.skillMatchScore > 0 ? `${prop.skillMatchScore}%` : '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {prop.penaltyCost.toFixed(1)}
                      </td>
                      <td className="py-3 px-3">
                        {prop.feasibilityStatus === 'feasible' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle className="h-3 w-3" /> Feasible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-800">
                            <AlertTriangle className="h-3 w-3" /> Infeasible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Before vs After Workload Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Workload Impact: Current vs. Proposed Allocations (Hours)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Demonstrates redistribution of active hours after applying ILP assignments.
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="empId" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="before" name="Current Workload" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="after" name="Proposed Workload" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
