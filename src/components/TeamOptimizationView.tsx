'use client';

import React, { useState, useEffect } from 'react';
import { Project, Recommendation } from '@/types';
import { Layers, CheckCircle, AlertTriangle, Users, Clock, ShieldCheck, Sparkles } from 'lucide-react';

interface TeamOptimizationViewProps {
  projects: Project[];
}

export default function TeamOptimizationView({ projects }: TeamOptimizationViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.projectId || '');
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const selectedProject = projects.find(p => p.projectId === selectedProjectId);

  useEffect(() => {
    if (projects.length > 0 && !projects.some(p => p.projectId === selectedProjectId)) {
      setSelectedProjectId(projects[0].projectId);
      setOptimizationResult(null);
    }
  }, [projects, selectedProjectId]);

  const runTeamOptimization = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/algorithms/team-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });
      const data = await res.json();
      setOptimizationResult(data);
    } catch (e) {
      console.error('Failed to run team optimization:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      runTeamOptimization();
    }
  }, [selectedProjectId]);

  if (projects.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center space-y-3">
        <Layers className="h-10 w-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">No Projects Available for Team Optimization</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please create a project or select another synthetic dataset from the top navigation bar to optimize complementary teams.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Complementary Team Optimization
            </h2>
            <p className="text-xs text-slate-400">
              Selects complementary employees to maximize collective competency coverage rather than duplicating highest individual scores.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name} (Team Size: {p.teamSize})
                </option>
              ))}
            </select>

            <button
              onClick={runTeamOptimization}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {loading ? 'Optimizing...' : 'Re-Optimize Team'}
            </button>
          </div>
        </div>
      </div>

      {optimizationResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selected Complementary Roster */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Proposed Complementary Squad</h3>
                <p className="text-xs text-slate-400">
                  {optimizationResult.selectedEmployees.length} of {optimizationResult.teamSizeTarget} target seats filled
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                optimizationResult.capacityMet
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {optimizationResult.capacityMet ? 'Capacity Met' : 'Capacity Shortfall'}
              </span>
            </div>

            <div className="space-y-3">
              {optimizationResult.selectedEmployees.map((emp: any, idx: number) => (
                <div key={emp.employeeId} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {emp.name}
                    </span>
                    <span className="font-mono text-cyan-400 font-semibold">{emp.individualScore}/100</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{emp.designation} &bull; {emp.department}</div>
                  <div className="text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/60">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    {emp.complementaryContribution}
                  </div>
                </div>
              ))}
            </div>

            {/* Capacity Summary */}
            <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>Team Available Capacity:</span>
                <strong className="text-white font-mono">{optimizationResult.totalAllocatedHours} hrs</strong>
              </div>
              <div className="flex justify-between">
                <span>Required Project Effort:</span>
                <strong className="text-white font-mono">{optimizationResult.requiredCapacityHours} hrs</strong>
              </div>
            </div>
          </div>

          {/* Collective Skill Coverage Matrix */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Team Collective Skill Coverage Matrix</h3>
                <p className="text-xs text-slate-400">
                  Evaluates E_team,j = max_(i in Team)(E_ij) against required proficiency R_j
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-cyan-400">
                  {optimizationResult.teamSkillCoverage.coveragePercentage}%
                </span>
                <span className="text-xs text-slate-400 block">Coverage</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Competency / Skill</th>
                    <th className="py-2.5 px-3">Required (R_j)</th>
                    <th className="py-2.5 px-3">Team Max (E_team)</th>
                    <th className="py-2.5 px-3">Gap (M_team)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {optimizationResult.teamSkillCoverage.gaps.map((gap: any) => (
                    <tr key={gap.skill} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-medium text-white">{gap.skill}</td>
                      <td className="py-3 px-3 font-mono">Level {gap.required}</td>
                      <td className="py-3 px-3 font-mono">
                        <span className={`font-semibold ${gap.teamMax >= gap.required ? 'text-emerald-400' : 'text-amber-400'}`}>
                          Level {gap.teamMax}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {gap.gap > 0 ? (
                          <span className="text-rose-400">-{gap.gap}</span>
                        ) : (
                          <span className="text-slate-500">0 (Fully Met)</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {gap.gap === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle className="h-3 w-3" /> Covered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-800">
                            <AlertTriangle className="h-3 w-3" /> Training Needed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Explanation */}
            <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 italic">
              {optimizationResult.explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
