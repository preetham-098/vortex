'use client';

import React from 'react';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { UtilizationBar } from '../ui/UtilizationBar';
import { Employee, Assignment } from '@/types';
import {
  Mail,
  Clock,
  Briefcase,
  Award,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export interface EmployeeDetailDrawerProps {
  employee: Employee | null;
  onClose: () => void;
  assignments?: Assignment[];
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  employee,
  onClose,
  assignments = [],
}) => {
  if (!employee) return null;

  const activeWorkload = (employee as any).activeWorkloadHours ?? 0;
  const capacity = employee.totalCapacityHours || 40;
  const utilization = capacity > 0 ? activeWorkload / capacity : 0;
  const availableHours = Math.max(0, capacity - activeWorkload);

  let statusVariant: 'healthy' | 'overloaded' | 'underutilized' = 'healthy';
  if (utilization > 1.0) {
    statusVariant = 'overloaded';
  } else if (utilization < 0.5) {
    statusVariant = 'underutilized';
  }

  const empAssignments = assignments.filter((a) => a.employeeId === employee.employeeId);

  return (
    <Drawer
      isOpen={!!employee}
      onClose={onClose}
      title={employee.name}
      description={`${employee.designation} • ${employee.department}`}
    >
      <div className="space-y-6">
        {/* Profile Summary Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-secondary)] text-white flex items-center justify-center text-lg font-bold shadow-md uppercase">
            {employee.name.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-[var(--text-primary)] truncate">
                {employee.name}
              </h4>
              <Badge size="sm" variant={statusVariant}>
                {statusVariant}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{employee.designation}</p>
            <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-1.5 font-mono">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[var(--accent)]" /> {employee.experienceYears}y exp
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />{' '}
                {employee.historicalPerformance ? `${employee.historicalPerformance}/100` : '75 rating'}
              </span>
            </div>
          </div>
        </div>

        {/* Capacity & Workload Section */}
        <div className="p-4 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Operating Workload & Utilization
            </span>
            <span className="text-xs font-semibold">
              {availableHours > 0 ? (
                <span className="text-[var(--status-success)]">+{availableHours}h Available</span>
              ) : (
                <span className="text-[var(--status-danger)]">0h Remaining</span>
              )}
            </span>
          </div>

          <UtilizationBar
            rate={utilization}
            assignedHours={activeWorkload}
            capacity={capacity}
            showLabels={true}
          />
        </div>

        {/* Competencies & Skill Proficiencies Matrix */}
        <div className="p-4 rounded-2xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Verified Competencies ({Object.keys(employee.skillProficiency).length})
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)]">Scale 1-5</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(employee.skillProficiency).map(([skill, lvl]) => (
              <div
                key={skill}
                className="p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-[var(--text-primary)] truncate">{skill}</span>
                <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/30">
                  Lvl {lvl}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Project Allocations */}
        <div className="p-4 rounded-2xl glass-card space-y-3">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
            Active Project Allocations ({empAssignments.length})
          </span>

          {empAssignments.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] italic">
              No direct assignments currently recorded in this cycle.
            </p>
          ) : (
            <div className="space-y-2">
              {empAssignments.map((a) => (
                <div
                  key={a.assignmentId}
                  className="p-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">
                      Project: {a.projectId}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" /> {a.startDate.slice(0, 10)} to {a.endDate.slice(0, 10)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[var(--accent)] px-2 py-1 rounded bg-[var(--accent-muted)]">
                    {a.allocationHours} hrs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};
