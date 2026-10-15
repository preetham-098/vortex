'use client';

import React, { useState, useEffect } from 'react';
import { Project, MatchCandidateResult, MatchingWeights } from '@/types';
import { DEFAULT_MATCHING_WEIGHTS } from '@/lib/algorithms/matching';
import { Users, CheckCircle, AlertTriangle, Info, ChevronRight, Sliders, BookOpen } from 'lucide-react';

interface MatchingViewProps {
  projects: Project[];
}

export default function MatchingView({ projects }: MatchingViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.projectId || '');
  const [weights, setWeights] = useState<MatchingWeights>(DEFAULT_MATCHING_WEIGHTS);
  const [candidates, setCandidates] = useState<MatchCandidateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidateResult | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const selectedProject = projects.find(p => p.projectId === selectedProjectId);

  useEffect(() => {
    if (projects.length > 0 && !projects.some(p => p.projectId === selectedProjectId)) {
      setSelectedProjectId(projects[0].projectId);
      setSelectedCandidate(null);
    }
  }, [projects, selectedProjectId]);

  const weightsSum = Number((weights.skills + weights.experience + weights.availability + weights.performance).toFixed(2));
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center space-y-3">
        <Users className="h-10 w-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">No Projects Available for Matching</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please create a project or select another synthetic dataset from the top navigation bar to evaluate employee-project matching rankings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              Employee–Project Matching & WSGA Analysis
            </h2>
            <p className="text-xs text-slate-400">
              Evaluates multi-criteria suitability: Score_ip = w_s*S_ip + w_e*E_ip + w_a*A_i + w_p*P_i
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Project Dropdown */}
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedCandidate(null);
              }}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name} ({p.priority.toUpperCase()})
                </option>
              ))}
            </select>

            {/* Config Weights Toggle */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition ${
                showConfig
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Weights Config
            </button>
          </div>
        </div>

        {/* Configurable Weights Drawer */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-slate-400 flex justify-between">
                <span>Skill Weight (w_s):</span>
                <strong className="text-cyan-400">{weights.skills}</strong>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.skills}
                onChange={e => setWeights({ ...weights, skills: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400 flex justify-between">
                <span>Experience Weight (w_e):</span>
                <strong className="text-indigo-400">{weights.experience}</strong>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.experience}
                onChange={e => setWeights({ ...weights, experience: parseFloat(e.target.value) })}
                className="w-full accent-indigo-400 mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400 flex justify-between">
                <span>Availability Weight (w_a):</span>
                <strong className="text-emerald-400">{weights.availability}</strong>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.availability}
                onChange={e => setWeights({ ...weights, availability: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400 flex justify-between">
                <span>Performance Weight (w_p):</span>
                <strong className="text-amber-400">{weights.performance}</strong>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={weights.performance}
                onChange={e => setWeights({ ...weights, performance: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 mt-1"
              />
            </div>
            <div className="sm:col-span-4 flex items-center justify-between text-[11px] pt-1">
              <span className={isWeightsValid ? 'text-emerald-400' : 'text-rose-400'}>
                Sum: {weightsSum} (Constraint: sum = 1.0)
              </span>
              <button
                onClick={() => setWeights(DEFAULT_MATCHING_WEIGHTS)}
                className="text-slate-400 hover:text-white underline"
              >
                Reset to Standard Defaults (0.50 / 0.20 / 0.20 / 0.10)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Candidates List + Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidates Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Ranked Candidates ({candidates.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              {candidates.filter(c => c.isEligible).length} Eligible
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Candidate</th>
                  <th className="py-2.5 px-3">Total Score</th>
                  <th className="py-2.5 px-3">Skills (S)</th>
                  <th className="py-2.5 px-3">Avail (A)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {candidates.map((cand, idx) => {
                  const isSelected = selectedCandidate?.employeeId === cand.employeeId;
                  return (
                    <tr
                      key={cand.employeeId}
                      onClick={() => setSelectedCandidate(cand)}
                      className={`cursor-pointer transition hover:bg-slate-800/40 ${
                        isSelected ? 'bg-slate-800/70 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                          {cand.employeeName}
                        </div>
                        <div className="text-[11px] text-slate-400">{cand.designation} &bull; {cand.department}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-white text-sm">
                          {cand.totalScore}
                        </span>
                        <span className="text-[10px] text-slate-500">/100</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-cyan-400">{cand.componentScores.skillMatch}%</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-emerald-400">{cand.componentScores.availability}%</span>
                      </td>
                      <td className="py-3 px-3">
                        {cand.isEligible ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle className="h-3 w-3" />
                            Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-800" title={cand.hardConstraintViolations.join('; ')}>
                            <AlertTriangle className="h-3 w-3" />
                            Violations
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-500 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Inspector Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          {selectedCandidate ? (
            <>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Candidate Breakdown</span>
                <h3 className="text-base font-bold text-white">{selectedCandidate.employeeName}</h3>
                <p className="text-xs text-slate-400">{selectedCandidate.designation} &bull; {selectedCandidate.department}</p>
              </div>

              {/* Component breakdown meters */}
              <div className="space-y-2.5 bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span>Skill Match (S_ip):</span>
                    <strong className="text-cyan-400">{selectedCandidate.componentScores.skillMatch}%</strong>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${selectedCandidate.componentScores.skillMatch}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span>Experience Match (E_ip):</span>
                    <strong className="text-indigo-400">{selectedCandidate.componentScores.experienceMatch}%</strong>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${selectedCandidate.componentScores.experienceMatch}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span>Availability (A_i):</span>
                    <strong className="text-emerald-400">{selectedCandidate.componentScores.availability}%</strong>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${selectedCandidate.componentScores.availability}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span>Past Performance (P_i):</span>
                    <strong className="text-amber-400">{selectedCandidate.componentScores.performance}%</strong>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${selectedCandidate.componentScores.performance}%` }} />
                  </div>
                </div>
              </div>

              {/* WSGA Skill Gap Details */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  WSGA Skill Gap Breakdown (Algorithm 1)
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedCandidate.skillGaps.map(gap => (
                    <div key={gap.skill} className="bg-slate-800/60 p-2 rounded border border-slate-700/60 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-200">{gap.skill}</div>
                        <div className="text-[10px] text-slate-400">
                          Req: lv{gap.requiredProficiency} &bull; Current: lv{gap.employeeProficiency} &bull; Gap M_ij: {gap.gap}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          gap.gap === 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                        }`}>
                          TP: {gap.trainingPriority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hard Constraint Warnings */}
              {selectedCandidate.hardConstraintViolations.length > 0 && (
                <div className="bg-rose-950/40 border border-rose-800/80 p-3 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Hard Constraint Violations
                  </div>
                  <ul className="list-disc list-inside text-rose-200 text-[11px]">
                    {selectedCandidate.hardConstraintViolations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Performance Disclosure */}
              <div className="bg-slate-800/40 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400">
                <Info className="h-3.5 w-3.5 text-slate-500 inline mr-1" />
                {selectedCandidate.performanceDisclosure}
              </div>

              {/* Formal Explanation */}
              <div className="text-[11px] text-slate-400 italic">
                {selectedCandidate.explanation}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a candidate from the table to view mathematical explanation and WSGA skill breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
