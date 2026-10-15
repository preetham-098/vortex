'use client';

import React, { useState, useEffect } from 'react';
import { Employee, Project, Assignment, WorkloadBalancingReport } from '@/types';
import { Shell } from '@/components/layout/Shell';
import { NavigationView } from '@/components/layout/Sidebar';
import { OverviewView } from '@/components/overview/OverviewView';
import { ProjectMatchView } from '@/components/project-match/ProjectMatchView';
import { WorkloadView } from '@/components/workload/WorkloadView';
import { SkillsView } from '@/components/skills/SkillsView';
import { TrainingView } from '@/components/training/TrainingView';
import WorkloadPredictionView from '@/components/WorkloadPredictionView';
import EmployeeManagementView from '@/components/EmployeeManagementView';
import ProjectManagementView from '@/components/ProjectManagementView';
import CsvUploadModal from '@/components/CsvUploadModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const [currentView, setCurrentView] = useState<NavigationView>('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workloadReport, setWorkloadReport] = useState<WorkloadBalancingReport | null>(null);
  const [availableTalent, setAvailableTalent] = useState<any[]>([]);
  const [workforceScores, setWorkforceScores] = useState<any[]>([]);
  const [mlMetrics, setMlMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);

  // Global Employee Drawer State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Dataset & CSV Modal State
  const [activeDatasetId, setActiveDatasetId] = useState<string>('enterprise_tech');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadAllData = async (datasetIdOverride?: string) => {
    try {
      const curDataset = datasetIdOverride || activeDatasetId;

      // 1. Fetch Employees
      const empRes = await fetch('/api/employees');
      const empData = await empRes.json();
      if (Array.isArray(empData)) {
        setEmployees(empData);
      }

      // 2. Fetch Projects
      const projRes = await fetch('/api/projects');
      const projData = await projRes.json();
      if (Array.isArray(projData)) {
        setProjects(projData);
      }

      // 3. Fetch Assignments
      try {
        const assignRes = await fetch('/api/assignments');
        const assignData = await assignRes.json();
        if (Array.isArray(assignData)) {
          setAssignments(assignData);
        }
      } catch (e) {
        console.warn('Could not fetch assignments:', e);
      }

      // 4. Fetch Workload Metrics (Algorithm 3)
      const wlRes = await fetch('/api/algorithms/workload-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: 'Current Operating Cycle' }),
      });
      const wlData = await wlRes.json();
      if (wlData.employeeMetrics) {
        setWorkloadReport(wlData);
      }

      // 5. If projects exist, fetch Available Talent (Algorithm 5) & Workforce Score (Algorithm 7)
      if (Array.isArray(projData) && projData.length > 0) {
        const firstProjId = projData[0].projectId;

        // Algorithm 5: Top Available Talent
        const talentRes = await fetch(`/api/workforce/available-talent?projectId=${firstProjId}`);
        const talentData = await talentRes.json();
        if (talentData.talentRankings) {
          setAvailableTalent(talentData.talentRankings);
        }

        // Algorithm 7: Final Workforce Optimization Score
        const wfScoreRes = await fetch('/api/algorithms/workforce-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: firstProjId }),
        });
        const wfScoreData = await wfScoreRes.json();
        if (wfScoreData.rankings) {
          setWorkforceScores(wfScoreData.rankings);
        }
      } else {
        setAvailableTalent([]);
        setWorkforceScores([]);
      }

      // 6. Fetch ML Evaluation Metrics (Algorithm 6)
      const mlRes = await fetch('/api/algorithms/workload-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customFeatures: {
            previous_workload_hours: 32.0,
            historical_utilization: 80.0,
            active_assignment_count: 2,
            planned_project_hours: 15.0,
            upcoming_deadlines_count: 1,
            department: 'engineering',
            experience_years: 5.0,
            workload_trend: 1.5,
          },
        }),
      });
      const mlData = await mlRes.json();
      if (mlData.prediction?.evaluation_metrics) {
        setMlMetrics(mlData.prediction.evaluation_metrics);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectDataset = async (datasetId: string) => {
    setActiveDatasetId(datasetId);
    setLoading(true);
    try {
      const res = await fetch(`/api/seed?force=true&dataset=${datasetId}`, {
        method: 'POST',
      });
      const data = await res.json();
      showToast(data.message || `Switched dataset to ${data.datasetName}`);
      await loadAllData(datasetId);
    } catch (err) {
      console.error('Error switching dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSeed = async () => {
    setResetting(true);
    try {
      const res = await fetch(`/api/seed?force=true&dataset=${activeDatasetId}`, {
        method: 'POST',
      });
      const data = await res.json();
      showToast(data.message || 'Dataset re-seeded to defaults.');
      await loadAllData(activeDatasetId);
    } catch (e) {
      console.error('Reset error:', e);
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const overloadedCount = workloadReport?.overloadedCount || 0;

  return (
    <>
      <Shell
        currentView={currentView}
        onSelectView={setCurrentView}
        activeDatasetId={activeDatasetId}
        onSelectDataset={handleSelectDataset}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onRefreshData={() => {
          setRefreshing(true);
          loadAllData();
        }}
        onResetSeed={handleResetSeed}
        overloadedCount={overloadedCount}
        selectedEmployee={selectedEmployee}
        onCloseEmployeeDrawer={() => setSelectedEmployee(null)}
        assignments={assignments}
        toastMessage={toastMessage}
        onCloseToast={() => setToastMessage(null)}
        refreshing={refreshing}
        resetting={resetting}
      >
        {loading && employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center shadow-lg animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Initializing Workforce Intelligence
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
                Synthesizing multi-objective matching, WSGA skill gaps, capacity balancing, and Random Forest models...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* View 1: Executive Cockpit Overview */}
            {currentView === 'overview' && (
              <OverviewView
                employees={employees}
                projects={projects}
                workloadReport={workloadReport}
                availableTalent={availableTalent}
                workforceScores={workforceScores}
                mlMetrics={mlMetrics}
                onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                onNavigateTab={setCurrentView}
              />
            )}

            {/* View 2: Project Match & WSGA */}
            {currentView === 'project-match' && (
              <ProjectMatchView
                projects={projects}
                employees={employees}
                onSelectEmployee={(emp) => setSelectedEmployee(emp)}
              />
            )}

            {/* View 3: Workload & Rebalance */}
            {currentView === 'workload' && (
              <WorkloadView
                employees={employees}
                projects={projects}
                report={workloadReport}
                onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                onRefreshData={() => loadAllData()}
                onShowToast={showToast}
              />
            )}

            {/* View 4: Skills Heatmap */}
            {currentView === 'skills' && (
              <SkillsView
                employees={employees}
                onSelectEmployee={(emp) => setSelectedEmployee(emp)}
              />
            )}

            {/* View 5: Upskill & Training */}
            {currentView === 'training' && (
              <TrainingView projects={projects} employees={employees} />
            )}

            {/* View 6: Random Forest ML Simulator */}
            {currentView === 'predictions' && (
              <WorkloadPredictionView employees={employees} />
            )}

            {/* View 7: Employee Roster */}
            {currentView === 'employees' && (
              <EmployeeManagementView
                employees={employees}
                onEmployeeCreatedOrUpdated={() => {
                  showToast('Employee roster updated.');
                  loadAllData();
                }}
              />
            )}

            {/* View 8: Project Pipeline */}
            {currentView === 'projects' && (
              <ProjectManagementView
                projects={projects}
                onProjectCreatedOrUpdated={() => {
                  showToast('Project pipeline updated.');
                  loadAllData();
                }}
              />
            )}
          </>
        )}
      </Shell>

      {/* CSV Upload & Preview Modal */}
      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={(msg) => {
          showToast(msg);
          loadAllData();
        }}
      />
    </>
  );
}
