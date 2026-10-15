import { describe, it, expect } from 'vitest';
import {
  calculateWorkforceOptimizationScore,
  validateWorkforceScoreWeights,
  rankWorkforceScores,
} from '@/lib/algorithms/workforceScore';
import { Employee, Project } from '@/types';

describe('Phase 6: Algorithm 7 Final Workforce Optimization Score', () => {
  const mockEmployee: Employee = {
    employeeId: 'emp_wf_1',
    organizationId: 'org1',
    name: 'Alice Developer',
    department: 'Engineering',
    designation: 'Senior Engineer',
    experienceYears: 6,
    skills: ['Python', 'Docker'],
    skillProficiency: { Python: 5, Docker: 4 },
    totalCapacityHours: 40,
    availabilityStatus: 'partially_allocated',
    historicalPerformance: 90,
  };

  const mockProject: Project = {
    projectId: 'proj_wf_1',
    organizationId: 'org1',
    name: 'AI Analytics Project',
    requiredSkills: ['Python', 'Docker'],
    skillProficiency: { Python: 4, Docker: 4 },
    minimumExperienceYears: 3,
    teamSize: 2,
    requiredCapacityHours: 30,
    priority: 'high',
    startDate: '2026-11-01',
    endDate: '2027-02-01',
    status: 'planning',
  };

  it('validates lambda weights summing to 1.0', () => {
    expect(validateWorkforceScoreWeights({ lambda1: 0.4, lambda2: 0.3, lambda3: 0.2, lambda4: 0.1 }).valid).toBe(true);
    expect(validateWorkforceScoreWeights({ lambda1: 0.5, lambda2: 0.3, lambda3: 0.2, lambda4: 0.2 }).valid).toBe(false);
    expect(validateWorkforceScoreWeights({ lambda1: -0.1, lambda2: 0.5, lambda3: 0.3, lambda4: 0.3 }).valid).toBe(false);
  });

  it('accurately calculates F_i with positive score under normal workload', () => {
    // Current workload = 10h of 40h -> Availability = 75%
    // SkillMatch = 100% (5>=4, 4>=4)
    // Performance = 90%
    // Utilization = 25%, Overload = 0 -> Penalty = 25
    // Weights: l1=0.40, l2=0.30, l3=0.20, l4=0.10
    // F_i = 0.40*100 + 0.30*75 + 0.20*90 - 0.10*25 = 40 + 22.5 + 18 - 2.5 = 78.0
    const result = calculateWorkforceOptimizationScore(mockEmployee, mockProject, 10);

    expect(result.components.skillMatch).toBe(100);
    expect(result.components.availability).toBe(75);
    expect(result.components.performance).toBe(90);
    expect(result.components.workloadPenalty).toBe(25);
    expect(result.finalScore).toBeCloseTo(78.0, 1);
    expect(result.scoreRangeNote).toContain('Score Range Notice');
  });

  it('preserves exact mathematical formula when heavy overload drives F_i down', () => {
    // Heavily overloaded: 60h workload on 40h capacity (150% utilization, 20h overload)
    // Availability = 0%
    // Overload penalty = 150 + (20/40)*150 = 150 + 75 = 225
    // With weights: l1=0.1, l2=0.1, l3=0.1, l4=0.7 (heavy penalty focus)
    // F_i = 0.1*100 + 0.1*0 + 0.1*90 - 0.7*225 = 10 + 9 - 157.5 = -138.5
    const result = calculateWorkforceOptimizationScore(
      mockEmployee,
      mockProject,
      60,
      { weights: { lambda1: 0.1, lambda2: 0.1, lambda3: 0.1, lambda4: 0.7 } }
    );

    expect(result.finalScore).toBeLessThan(0);
    expect(result.workloadPenaltyDetails.overloadHours).toBe(20);
  });

  it('ranks multiple employees properly by F_i', () => {
    const empOverloaded: Employee = {
      ...mockEmployee,
      employeeId: 'emp_busy',
      name: 'Busy Person',
    };

    const rankings = rankWorkforceScores([mockEmployee, empOverloaded], mockProject, {
      [mockEmployee.employeeId]: 10,
      [empOverloaded.employeeId]: 50,
    });

    expect(rankings[0].employeeId).toBe(mockEmployee.employeeId);
    expect(rankings[0].finalScore).toBeGreaterThan(rankings[1].finalScore);
  });
});
