import { describe, it, expect } from 'vitest';
import { calculateWorkloadMetrics } from '@/lib/algorithms/workload';
import { optimizeTaskAllocation } from '@/lib/algorithms/taskAllocation';
import { optimizeComplementaryTeam } from '@/lib/algorithms/teamOptimization';
import { Employee, Assignment, Project } from '@/types';

describe('Phase 4: Workload Metrics, Task Allocation, and Team Optimization', () => {
  const mockEmployees: Employee[] = [
    {
      employeeId: 'e1',
      organizationId: 'org1',
      name: 'Emp One',
      department: 'Engineering',
      designation: 'Engineer',
      experienceYears: 5,
      skills: ['React', 'TypeScript'],
      skillProficiency: { React: 5, TypeScript: 4 },
      totalCapacityHours: 40,
      availabilityStatus: 'partially_allocated',
    },
    {
      employeeId: 'e2',
      organizationId: 'org1',
      name: 'Emp Two',
      department: 'Engineering',
      designation: 'Senior Engineer',
      experienceYears: 7,
      skills: ['Python', 'Docker'],
      skillProficiency: { Python: 5, Docker: 4 },
      totalCapacityHours: 40,
      availabilityStatus: 'available',
    },
    {
      employeeId: 'e3',
      organizationId: 'org1',
      name: 'Emp Three (Overloaded)',
      department: 'DevOps',
      designation: 'Architect',
      experienceYears: 8,
      skills: ['Kubernetes', 'Docker'],
      skillProficiency: { Kubernetes: 5, Docker: 5 },
      totalCapacityHours: 40,
      availabilityStatus: 'fully_allocated',
    },
  ];

  describe('Algorithm 3: Capacity-Aware Workload Balancing', () => {
    it('calculates C_i, U_i, W_i, and imbalance ratio correctly', () => {
      // Assignments:
      // e1: 20h -> C_1 = 20h, U_1 = 50%
      // e2: 10h -> C_2 = 30h, U_2 = 25%
      // e3: 50h -> C_3 = -10h (OVERLOADED!), U_3 = 125%
      // Total workload = 80h
      // W_1 = 20/80 = 0.25, W_2 = 10/80 = 0.125, W_3 = 50/80 = 0.625
      // mu(L) = 80 / 3 = 26.67
      const assignments: Assignment[] = [
        {
          assignmentId: 'a1',
          organizationId: 'org1',
          employeeId: 'e1',
          projectId: 'p1',
          allocationHours: 20,
          startDate: '2026-11-01',
          endDate: '2027-01-01',
          status: 'active',
        },
        {
          assignmentId: 'a2',
          organizationId: 'org1',
          employeeId: 'e2',
          projectId: 'p1',
          allocationHours: 10,
          startDate: '2026-11-01',
          endDate: '2027-01-01',
          status: 'active',
        },
        {
          assignmentId: 'a3',
          organizationId: 'org1',
          employeeId: 'e3',
          projectId: 'p2',
          allocationHours: 50,
          startDate: '2026-11-01',
          endDate: '2027-01-01',
          status: 'active',
        },
        {
          assignmentId: 'a4_cancelled',
          organizationId: 'org1',
          employeeId: 'e1',
          projectId: 'p1',
          allocationHours: 25,
          startDate: '2026-11-01',
          endDate: '2027-01-01',
          status: 'cancelled', // Must be excluded!
        },
      ];

      const report = calculateWorkloadMetrics(mockEmployees, assignments);

      expect(report.totalWorkloadHours).toBe(80);
      expect(report.totalAvailableHours).toBe(120);

      const m1 = report.employeeMetrics.find(m => m.employeeId === 'e1')!;
      expect(m1.assignedWorkloadHours).toBe(20);
      expect(m1.remainingCapacity).toBe(20);
      expect(m1.utilizationPercentage).toBe(50);
      expect(m1.workloadShare).toBe(0.25);

      const m3 = report.employeeMetrics.find(m => m.employeeId === 'e3')!;
      expect(m3.remainingCapacity).toBe(-10); // Preserves negative capacity!
      expect(m3.utilizationPercentage).toBe(125);
      expect(m3.status).toBe('overloaded');

      expect(report.overloadedCount).toBe(1);
      expect(report.averageWorkloadHours).toBeCloseTo(26.67, 1);
      expect(report.workloadImbalanceRatio).toBeGreaterThan(0);
    });

    it('handles zero workload safely without divide-by-zero errors', () => {
      const report = calculateWorkloadMetrics(mockEmployees, []);
      expect(report.totalWorkloadHours).toBe(0);
      expect(report.averageWorkloadHours).toBe(0);
      expect(report.workloadImbalanceRatio).toBe(0);
    });
  });

  describe('Algorithm 4: Constrained Task Allocation', () => {
    it('optimally assigns tasks to qualified employees within capacity constraints', () => {
      const input = {
        tasks: [
          {
            taskId: 't1',
            title: 'Frontend UI',
            effortHours: 15,
            requiredSkill: 'React',
            requiredProficiency: 4,
          },
          {
            taskId: 't2',
            title: 'Backend Logic',
            effortHours: 20,
            requiredSkill: 'Python',
            requiredProficiency: 4,
          },
        ],
        employees: [
          {
            employeeId: 'e1',
            name: 'React Expert',
            capacityHours: 40,
            skills: { React: 5, Python: 1 },
            currentWorkloadHours: 0,
          },
          {
            employeeId: 'e2',
            name: 'Python Expert',
            capacityHours: 40,
            skills: { React: 1, Python: 5 },
            currentWorkloadHours: 0,
          },
        ],
      };

      const result = optimizeTaskAllocation(input, { tau: 50 });

      expect(result.isOptimal).toBe(true);
      expect(result.unassignableTasks.length).toBe(0);

      const prop1 = result.proposals.find(p => p.taskId === 't1')!;
      const prop2 = result.proposals.find(p => p.taskId === 't2')!;

      expect(prop1.assignedEmployeeId).toBe('e1');
      expect(prop2.assignedEmployeeId).toBe('e2');
      expect(result.afterWorkload['e1']).toBe(15);
      expect(result.afterWorkload['e2']).toBe(20);
    });

    it('detects infeasible tasks when effort exceeds employee capacity and never silently violates constraints', () => {
      const input = {
        tasks: [
          {
            taskId: 't_giant',
            title: 'Massive Monolith Migration',
            effortHours: 60, // Exceeds 40h capacity!
            requiredSkill: 'React',
            requiredProficiency: 4,
          },
        ],
        employees: [
          {
            employeeId: 'e1',
            name: 'React Dev',
            capacityHours: 40,
            skills: { React: 5 },
            currentWorkloadHours: 0,
          },
        ],
      };

      const result = optimizeTaskAllocation(input);

      expect(result.isOptimal).toBe(false);
      expect(result.unassignableTasks).toContain('Massive Monolith Migration');
      expect(result.capacityViolations.length).toBeGreaterThan(0);
      expect(result.proposals[0].assignedEmployeeId).toBeNull();
      expect(result.proposals[0].feasibilityStatus).toBe('unassignable');
    });

    it('strictly enforces tau minimum skill threshold', () => {
      const input = {
        tasks: [
          {
            taskId: 't_special',
            title: 'Specialized Task',
            effortHours: 10,
            requiredSkill: 'Rust',
            requiredProficiency: 5,
          },
        ],
        employees: [
          {
            employeeId: 'e_novice',
            name: 'Novice',
            capacityHours: 40,
            skills: { Rust: 1 }, // SkillMatch = 100*(1 - 4/5) = 20% < tau (50%)
            currentWorkloadHours: 0,
          },
        ],
      };

      const result = optimizeTaskAllocation(input, { tau: 50 });
      expect(result.proposals[0].assignedEmployeeId).toBeNull();
      expect(result.unassignableTasks.length).toBe(1);
    });
  });

  describe('Team Optimization: Complementary Team Selection', () => {
    it('selects complementary employees to cover all required competencies', () => {
      const project: Project = {
        projectId: 'p_comp',
        organizationId: 'org1',
        name: 'Fullstack Platform',
        requiredSkills: ['React', 'Python'],
        skillProficiency: { React: 4, Python: 4 },
        minimumExperienceYears: 3,
        teamSize: 2,
        requiredCapacityHours: 40,
        priority: 'high',
        startDate: '2026-11-01',
        endDate: '2027-02-01',
        status: 'planning',
      };

      const team = optimizeComplementaryTeam(mockEmployees, project, {});

      expect(team.selectedEmployees.length).toBe(2);
      expect(team.teamSkillCoverage.coveragePercentage).toBe(100);
      expect(team.teamSkillCoverage.coveredSkills).toContain('React');
      expect(team.teamSkillCoverage.coveredSkills).toContain('Python');
    });
  });
});
