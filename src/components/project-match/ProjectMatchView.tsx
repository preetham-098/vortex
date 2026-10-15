'use client';

import React, { useState, useEffect } from 'react';
import { Project, MatchCandidateResult, MatchingWeights, Employee } from '@/types';
import { DEFAULT_MATCHING_WEIGHTS } from '@/lib/algorithms/matching';
import { ScoreRing } from '../ui/ScoreRing';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../common/EmptyState';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Sliders,
  BookOpen,
  Sparkles,
  Award,
  Clock,
  Layers,
} from 'lucide-react';

export interface ProjectMatchViewProps {
  projects: Project[];
  employees?: Employee[];
  onSelectEmployee?: (emp: Employee) => void;
}

export const ProjectMatchView: React.FC<ProjectMatchViewProps> = ({
  projects,
  employees = [],
  onSelectEmployee,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.projectId || '');
  const [weights, setWeights] = useState<MatchingWeights>(DEFAULT_MATCHING_WEIGHTS);
  const [candidates, setCandidates] = useState<MatchCandidateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidateResult | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const selectedProject = projects.find((p) => p.projectId === selectedProjectId);

  useEffect(() => {
    if (projects.length > 0 && !projects.some((p) => p.projectId === selectedProjectId)) {
      setSelectedProjectId(projects[0].projectId);
      setSelectedCandidate(null);
    }
  }, [projects, selectedProjectId]);

  const weightsSum = Number(
    (weights.skills + weights.experience + weights.availability + weights.performance).toFixed(2)
  );
  const isWeightsValid = Math.abs(weightsSum - 1.0) < 0.001;

  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchRankings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/algorithms/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProjectId,
            weights: isWeightsValid ? weights : DEFAULT_MATCHING_WEIGHTS,
          }),
        });
        const data = await res.json();
        if (data.rankings) {
          setCandidates(data.rankings);
          if (!selectedCandidate && data.rankings.length > 0) {
            setSelectedCandidate(data.rankings[0]);
          } else if (selectedCandidate) {
            const matched = data.rankings.find(
              (r: MatchCandidateResult) => r.employeeId === selectedCandidate.employeeId
            );
            if (matched) setSelectedCandidate(matched);
          }
        }
      } catch (e) {
        console.error('Failed to load candidate rankings:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [selectedProjectId, weights.skills, weights.experience, weights.availability, weights.performance, isWeightsValid]);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-8 h-8 text-[var(--accent)]" />}
        title="No Projects Available for Matching"
        description="Please create a project or select another synthetic dataset from the top navigation bar to evaluate employee-project matching rankings."
      />
    );
  }

  const priorityVariants: Record<string, any> = {
    critical: 'overloaded',
    high: 'warning',
    medium: 'accent',
    low: 'neutral',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Project Switcher */}
      <div className="card-dark p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-micro text-[var(--accent)]">
                AI Match & WSGA Engine
              </span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
              <span className="text-xs text-[var(--text-secondary)]">Multi-objective constraint scoring</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {selectedProject?.name || 'Candidate Matching'}
              </h1>
              {selectedProject && (
                <Badge variant={priorityVariants[selectedProject.priority] || 'accent'} size="sm">
                  {selectedProject.priority} Priority
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Project Selector Dropdown */}
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedCandidate(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] shadow-xs"
            >
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                  {p.name} ({p.priority.toUpperCase()})
                </option>
              ))}
            </select>

            {/* Config Weights Toggle */}
            <Button
              variant={showConfig ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Sliders className="w-3.5 h-3.5 mr-1" />
              Weight Tuner
            </Button>
          </div>
        </div>

        {/* Configurable Weights Drawer */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-[var(--text-secondary)] flex justify-between font-medium">
                <span>Skill Weight (w_s):</span>
                <strong className="text-[var(--accent)] font-mono">{weights.skills}</strong>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.skills}
                onChange={(e) => setWeights({ ...weights, skills: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent)] mt-1.5 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] flex justify-between font-medium">
                <span>Experience Weight (w_e):</span>
                <strong className="text-indigo-400 font-mono">{weights.experience}</strong>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.experience}
                onChange={(e) => setWeights({ ...weights, experience: parseFloat(e.target.value) })}
                className="w-full accent-indigo-400 mt-1.5 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] flex justify-between font-medium">
                <span>Availability Weight (w_a):</span>
                <strong className="text-emerald-400 font-mono">{weights.availability}</strong>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.availability}
                onChange={(e) => setWeights({ ...weights, availability: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 mt-1.5 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] flex justify-between font-medium">
                <span>Performance Weight (w_p):</span>
                <strong className="text-amber-400 font-mono">{weights.performance}</strong>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.performance}
                onChange={(e) => setWeights({ ...weights, performance: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 mt-1.5 cursor-pointer"
              />
            </div>
            <div className="sm:col-span-4 flex items-center justify-between text-[11px] pt-1">
              <span className={`font-mono font-semibold ${isWeightsValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                Weight Sum: {weightsSum} (Target: 1.0)
              </span>
              <button
                onClick={() => setWeights(DEFAULT_MATCHING_WEIGHTS)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] underline cursor-pointer"
              >
                Reset to Standard Defaults (0.50 / 0.20 / 0.20 / 0.10)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Candidates List + Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidates Roster Column */}
        <div className="card-dark p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Ranked Candidates ({candidates.length})
            </h3>
            <span className="text-[11px] text-[var(--text-tertiary)]">Score_ip Formula</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[var(--text-tertiary)] animate-pulse">
              Computing candidate multi-criteria matches...
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)] italic">
              No matching candidates found for this project.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {candidates.map((cand, idx) => {
                const isSelected = selectedCandidate?.employeeId === cand.employeeId;
                return (
                  <div
                    key={cand.employeeId}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[var(--accent-muted)] border-[var(--accent)] shadow-xs'
                        : 'bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent)]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 text-center font-mono text-xs font-bold text-[var(--text-tertiary)]">
                        #{idx + 1}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-[var(--text-primary)] truncate flex items-center gap-1.5">
                          {cand.employeeName}
                          {cand.isEligible ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] truncate">
                          {cand.designation} • {cand.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ScoreRing score={cand.totalScore} size={46} strokeWidth={4} />
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-[var(--accent)] translate-x-0.5' : 'text-[var(--text-tertiary)]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Candidate Inspector & WSGA Skill Gap Column */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCandidate ? (
            <>
              {/* Profile & Score Component Card */}
              <div className="card-dark p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        {selectedCandidate.employeeName}
                      </h2>
                      <Badge
                        size="sm"
                        variant={selectedCandidate.isEligible ? 'healthy' : 'warning'}
                      >
                        {selectedCandidate.isEligible ? 'Meets Mandatory Skills' : 'Gap in Mandatory Skills'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {selectedCandidate.designation} • {selectedCandidate.department}
                    </p>
                  </div>

                  {onSelectEmployee && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const empObj = employees.find((e) => e.employeeId === selectedCandidate.employeeId);
                        if (empObj) onSelectEmployee(empObj);
                      }}
                    >
                      View Full Profile
                    </Button>
                  )}
                </div>

                {/* Score Component Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                      Skill Score (S_ip)
                    </span>
                    <span className="text-lg font-bold font-mono text-[var(--accent)] mt-0.5 block">
                      {selectedCandidate.componentScores.skillMatch}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                      Experience (E_ip)
                    </span>
                    <span className="text-lg font-bold font-mono text-indigo-400 mt-0.5 block">
                      {selectedCandidate.componentScores.experienceMatch}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                      Availability (A_i)
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                      {selectedCandidate.componentScores.availability}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                      Performance (P_i)
                    </span>
                    <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">
                      {selectedCandidate.componentScores.performance}%
                    </span>
                  </div>
                </div>

                {/* Performance Disclosure */}
                {selectedCandidate.performanceDisclosure && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{selectedCandidate.performanceDisclosure}</span>
                  </div>
                )}
              </div>

              {/* WSGA Skill Gap Analysis Table */}
              <div className="card-dark overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      Weighted Skill Gap Analysis (WSGA)
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Gap_ij = max(0, Required_j - Employee_ij) • Training Priority TP_ij = Gap_ij * PriorityWeight_j
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4 font-bold">Skill Requirement</th>
                        <th className="py-2.5 px-3 font-bold">Mandatory</th>
                        <th className="py-2.5 px-3 font-bold">Req Level</th>
                        <th className="py-2.5 px-3 font-bold">Candidate</th>
                        <th className="py-2.5 px-3 font-bold">Gap</th>
                        <th className="py-2.5 px-3 font-bold">Training Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {selectedCandidate.skillGaps.map((gap) => {
                        const isMandatory = selectedProject?.mandatorySkills?.includes(gap.skill) || false;
                        return (
                          <tr key={gap.skill} className="hover:bg-[var(--bg-surface-secondary)]/50 transition">
                            <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                              {gap.skill}
                            </td>
                            <td className="py-3 px-3">
                              {isMandatory ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                  Mandatory
                                </span>
                              ) : (
                                <span className="text-[10px] text-[var(--text-tertiary)]">Optional</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-[var(--text-primary)]">
                              Lvl {gap.requiredProficiency}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              <span
                                className={`font-semibold ${
                                  gap.employeeProficiency >= gap.requiredProficiency
                                    ? 'text-emerald-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                Lvl {gap.employeeProficiency}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono">
                              {gap.gap > 0 ? (
                                <span className="text-rose-400 font-bold">-{gap.gap}</span>
                              ) : (
                                <span className="text-emerald-400 font-semibold">0 (Covered)</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-[var(--accent)] font-semibold">
                              {gap.trainingPriority > 0 ? gap.trainingPriority.toFixed(2) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card-dark p-12 text-center text-xs text-[var(--text-tertiary)] italic">
              Select a candidate from the roster to inspect detailed WSGA skill gaps and multi-criteria breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
