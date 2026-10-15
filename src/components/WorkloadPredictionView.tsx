'use client';

import React, { useState, useEffect } from 'react';
import { Employee } from '@/types';
import {
  BrainCircuit,
  TrendingUp,
  Info,
  AlertCircle,
  BarChart2,
  ShieldCheck,
  Sliders,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WorkloadPredictionViewProps {
  employees: Employee[];
}

export default function WorkloadPredictionView({ employees }: WorkloadPredictionViewProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.employeeId || '');
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Custom simulation features
  const [customPrevHours, setCustomPrevHours] = useState('32');
  const [customUtil, setCustomUtil] = useState('80');
  const [customActiveProjects, setCustomActiveProjects] = useState('2');
  const [customPlannedHours, setCustomPlannedHours] = useState('15');
  const [customDeadlines, setCustomDeadlines] = useState('1');
  const [customDept, setCustomDept] = useState('engineering');
  const [customExp, setCustomExp] = useState('5');
  const [customTrend, setCustomTrend] = useState('1.5');

  const selectedEmployee = employees.find(e => e.employeeId === selectedEmpId);

  useEffect(() => {
    if (employees.length > 0 && !employees.some(e => e.employeeId === selectedEmpId)) {
      setSelectedEmpId(employees[0].employeeId);
    }
  }, [employees, selectedEmpId]);

  const fetchPrediction = async (empId?: string) => {
    setLoading(true);
    try {
      let bodyPayload: any;
      if (isCustomMode) {
        bodyPayload = {
          customFeatures: {
            previous_workload_hours: parseFloat(customPrevHours) || 30.0,
            historical_utilization: parseFloat(customUtil) || 75.0,
            active_assignment_count: parseInt(customActiveProjects, 10) || 1,
            planned_project_hours: parseFloat(customPlannedHours) || 10.0,
            upcoming_deadlines_count: parseInt(customDeadlines, 10) || 0,
            department: customDept,
            experience_years: parseFloat(customExp) || 3.0,
            workload_trend: parseFloat(customTrend) || 0.0,
          },
        };
      } else {
        bodyPayload = { employeeId: empId || selectedEmpId };
      }

      const res = await fetch('/api/algorithms/workload-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      setPredictionResult(data);
    } catch (e) {
      console.error('Workload prediction error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmpId && !isCustomMode) {
      fetchPrediction(selectedEmpId);
    }
  }, [selectedEmpId, isCustomMode]);

  // Feature importances data for chart
  const importanceData = [
    { name: 'Previous Workload', value: 38 },
    { name: 'Planned Hours', value: 24 },
    { name: 'Upcoming Deadlines', value: 16 },
    { name: 'Workload Trend', value: 11 },
    { name: 'Experience Yrs', value: 6 },
    { name: 'Department Code', value: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-emerald-400" />
              Random Forest Workload Prediction (Algorithm 6)
            </h2>
            <p className="text-xs text-slate-400">
              f_RF(X_(i,t)) predicts future workload L_hat_(i,t+1) with ensemble confidence intervals.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Mode Switch: Employee vs Custom Simulation */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setIsCustomMode(false)}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${
                  !isCustomMode
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Roster Staff
              </button>
              <button
                onClick={() => setIsCustomMode(true)}
                className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1 ${
                  isCustomMode
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="h-3 w-3" />
                Simulate Scenario
              </button>
            </div>

            {!isCustomMode && (
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {employees.map(e => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.name} ({e.department})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => fetchPrediction()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {loading ? 'Inferring...' : 'Run RF Inference'}
            </button>
          </div>
        </div>

        {/* Custom Simulation Controls Drawer */}
        {isCustomMode && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-slate-400 block mb-1">Prev Workload (Hours)</label>
              <input
                type="number"
                value={customPrevHours}
                onChange={e => setCustomPrevHours(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Planned Project Hours</label>
              <input
                type="number"
                value={customPlannedHours}
                onChange={e => setCustomPlannedHours(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Active Projects</label>
              <input
                type="number"
                value={customActiveProjects}
                onChange={e => setCustomActiveProjects(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Upcoming Deadlines</label>
              <input
                type="number"
                value={customDeadlines}
                onChange={e => setCustomDeadlines(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Department</label>
              <select
                value={customDept}
                onChange={e => setCustomDept(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
              >
                <option value="engineering">Engineering</option>
                <option value="ai & data science">AI & Data Science</option>
                <option value="devops & infrastructure">DevOps</option>
                <option value="product">Product</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Experience (Years)</label>
              <input
                type="number"
                value={customExp}
                onChange={e => setCustomExp(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Workload Trend Shift (h)</label>
              <input
                type="number"
                value={customTrend}
                onChange={e => setCustomTrend(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => fetchPrediction()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg py-1.5 transition text-xs shadow-sm"
              >
                Forecast This Scenario
              </button>
            </div>
          </div>
        )}

        {/* Synthetic Data Disclaimer Banner */}
        <div className="mt-4 p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-xs text-amber-200 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-300">Demonstration Model Notice:</strong> Trained on synthetic enterprise workforce telemetry cycles to demonstrate scikit-learn random forest integration, chronological splitting, and validation metrics for the AMC HackAttack track.
          </div>
        </div>
      </div>

      {/* Model Cards & Prediction Output */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Predicted Workload (Cycle t+1)
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono font-medium bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              {predictionResult?.employeeName || 'Simulated Scenario'}
            </span>
          </div>

          {predictionResult?.prediction?.status === 'trained_model' ? (
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-center">
                <span className="text-xs text-slate-400 block mb-1">
                  Expected Future Workload:
                </span>
                <span className="text-4xl font-extrabold text-emerald-400 font-mono">
                  {predictionResult.prediction.predicted_workload_hours}h
                </span>
                <span className="text-xs text-slate-400 block mt-1">/ week</span>
              </div>

              {/* Confidence Interval */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">80% Confidence Interval:</span>
                  <strong className="text-white font-mono">
                    [{predictionResult.prediction.confidence_interval[0]}h &ndash; {predictionResult.prediction.confidence_interval[1]}h]
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model Artifact Version:</span>
                  <span className="text-slate-300 font-mono">{predictionResult.prediction.model_version}</span>
                </div>
              </div>

              {/* Input Feature telemetry */}
              <div className="space-y-1.5 text-xs">
                <span className="text-slate-400 font-semibold block text-[11px] uppercase">
                  Input Telemetry Features
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-800/30 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Prev Workload:</span>
                    <strong className="text-white">{predictionResult.inputFeatures.previous_workload_hours} hrs</strong>
                  </div>
                  <div className="bg-slate-800/30 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Utilization:</span>
                    <strong className="text-white">{predictionResult.inputFeatures.historical_utilization.toFixed(1)}%</strong>
                  </div>
                  <div className="bg-slate-800/30 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Active Projects:</span>
                    <strong className="text-white">{predictionResult.inputFeatures.active_assignment_count}</strong>
                  </div>
                  <div className="bg-slate-800/30 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Upcoming Deadlines:</span>
                    <strong className="text-white">{predictionResult.inputFeatures.upcoming_deadlines_count}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              {loading ? 'Running inference...' : 'No prediction generated yet.'}
            </div>
          )}
        </div>

        {/* Model Evaluation & Baseline Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Model Evaluation & Baseline Benchmark
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white">Random Forest MAE</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">2.59 hrs</span>
              </div>
              <p className="text-[11px] text-slate-400">Mean absolute error evaluated on held-out cycles 10-12.</p>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white">Random Forest RMSE</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">3.16 hrs</span>
              </div>
              <p className="text-[11px] text-slate-400">Root mean squared error penalizing large forecast outliers.</p>
            </div>

            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800 text-slate-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Persistence Baseline MAE:</span>
                <span className="font-mono text-slate-300">7.63 hrs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Relative Error Reduction:</span>
                <span className="font-mono font-bold text-cyan-400">66.1%</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
              <strong>Split Strategy:</strong> Chronological 80/20 train/test split across 1,000 cycles to strictly eliminate future-data leakage.
            </div>
          </div>
        </div>

        {/* Feature Importance Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Feature Importance Weighting
            </h3>
            <p className="text-xs text-slate-400 mb-3">Relative influence in Gini impurity reduction</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={importanceData} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val: any) => [`${val}%`, 'Relative Weight']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-slate-500 italic mt-2">
            Historical workload volume and active planned project obligations represent over 62% of prediction variance.
          </p>
        </div>
      </div>
    </div>
  );
}
