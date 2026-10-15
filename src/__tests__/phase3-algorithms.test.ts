import { describe, it, expect } from 'vitest';
import { calculateWSGA, calculateTeamSkillCoverage } from '@/lib/algorithms/wsga';
import { matchEmployeeToProject, validateMatchingWeights, rankEmployeesForProject } from '@/lib/algorithms/matching';
import { identifyAvailableTalent } from '@/lib/algorithms/talent';
import { Employee, Project, TrainingCourse } from '@/types';

describe('Phase 3: Algorithms 1, 2, and 5', () => {
  const sampleCourses: TrainingCourse[] = [
    {
      courseId: 'c1',
      organizationId: 'org1',
      title: 'Python Mastery',
      skill: 'Python',
      proficiencyLevel: 4,
      description: 'Advanced Python',
      estimatedDuration: '10h',
      resourceURL: 'https://example.com/python',
    },
    {
      courseId: 'c2',
      organizationId: 'org1',
      title: 'React Fundamentals',
      skill: 'React',
      proficiencyLevel: 3,
      description: 'Intro to React',
      estimatedDuration: '8h',
      resourceURL: 'https://example.com/react',
    },
  ];

  describe('Algorithm 1: WSGA', () => {
    it('accurately calculates WSGA formulas with exact values', () => {
      // R_j: Python=4, React=3
      // E_ij: Python=2, React=3
      // w_j: Python=1.0, React=2.0
      // P_j: Python=1.5, React=1.0
      // R_max: 5
      //
      // M_python = max(0, 4 - 2) = 2
      // M_react = max(0, 3 - 3) = 0
      // TP_python = 2 * 1.0 * 1.5 = 3.0
      // TP_react = 0 * 2.0 * 1.0 = 0
      //
      // SG_i = (1.0*2 + 2.0*0) / (1.0 + 2.0) = 2 / 3 = 0.6667
      // SkillMatch_i = 100 * (1 - (2/3) / 5) = 100 * (1 - 2/15) = 100 * (13/15) = 86.67%
      const result = calculateWSGA({
        requiredProficiency: { Python: 4, React: 3 },
        employeeProficiency: { Python: 2, React: 3 },
        skillWeights: { Python: 1.0, React: 2.0 },
        trainingPriorityMultipliers: { Python: 1.5, React: 1.0 },
        maxProficiency: 5,
      }, sampleCourses);

      expect(result.skillGaps.find(g => g.skill === 'Python')?.gap).toBe(2);
      expect(result.skillGaps.find(g => g.skill === 'React')?.gap).toBe(0);
      expect(result.skillGaps.find(g => g.skill === 'Python')?.trainingPriority).toBeCloseTo(3.0, 2);
      expect(result.aggregateSkillGap).toBeCloseTo(0.6667, 3);
      expect(result.skillMatchPercentage).toBeCloseTo(86.67, 1);
      expect(result.rankedTrainingPriorities.length).toBe(1);
      expect(result.rankedTrainingPriorities[0].skill).toBe('Python');
      expect(result.recommendedCourses.length).toBe(1);
      expect(result.recommendedCourses[0].skill).toBe('Python');
    });

    it('handles perfect match (all E_ij >= R_j) resulting in 100% SkillMatch and 0 gaps', () => {
      const result = calculateWSGA({
        requiredProficiency: { Python: 3, Docker: 3 },
        employeeProficiency: { Python: 5, Docker: 4 },
      });

      expect(result.aggregateSkillGap).toBe(0);
      expect(result.skillMatchPercentage).toBe(100);
      expect(result.rankedTrainingPriorities.length).toBe(0);
    });

    it('handles completely missing skills gracefully without dividing by zero', () => {
      const result = calculateWSGA({
        requiredProficiency: { Python: 5 },
        employeeProficiency: {}, // Missing Python completely
      });

      expect(result.aggregateSkillGap).toBe(5);
      // SkillMatch = 100 * (1 - 5/5) = 0%
      expect(result.skillMatchPercentage).toBe(0);
      expect(result.skillGaps[0].gap).toBe(5);
    });

    it('calculates collective team skill coverage without falsely assuming one person represents the team', () => {
      // Required: Python: 4, Go: 4, Docker: 3
      // Emp 1: Python: 5, Go: 0, Docker: 2
      // Emp 2: Python: 2, Go: 4, Docker: 3
      const team: Array<{ skillProficiency: Record<string, number> }> = [
        { skillProficiency: { Python: 5, Docker: 2 } },
        { skillProficiency: { Python: 2, Go: 4, Docker: 3 } },
      ];

      const coverage = calculateTeamSkillCoverage(
        { Python: 4, Go: 4, Docker: 3 },
        team
      );

      expect(coverage.coveredSkills).toContain('Python');
      expect(coverage.coveredSkills).toContain('Go');
      expect(coverage.coveredSkills).toContain('Docker');
      expect(coverage.missingSkills.length).toBe(0);
      expect(coverage.coveragePercentage).toBe(100);
      expect(coverage.teamProficiencyBySkill.Python).toBe(5);
      expect(coverage.teamProficiencyBySkill.Go).toBe(4);
    });
  });

  describe('Algorithm 2: Weighted Employee-Project Matching', () => {
    const mockEmployee: Employee = {
      employeeId: 'emp_test_1',
      organizationId: 'org1',
      name: 'Alice',
      department: 'Engineering',
      designation: 'Architect',
      experienceYears: 6,
      skills: ['TypeScript', 'React'],
      skillProficiency: { TypeScript: 5, React: 4 },
      totalCapacityHours: 40,
      availabilityStatus: 'available',
      historicalPerformance: 90,
    };

    const mockProject: Project = {
      projectId: 'proj_test_1',
      organizationId: 'org1',
      name: 'Test Project',
      requiredSkills: ['TypeScript', 'React'],
      skillProficiency: { TypeScript: 5, React: 4 },
      mandatorySkills: ['TypeScript'],
      minimumExperienceYears: 4,
      teamSize: 2,
      requiredCapacityHours: 40,
      priority: 'high',
      startDate: '2026-11-01',
      endDate: '2027-01-01',
      status: 'planning',
    };

    it('validates matching weights summing to 1.0', () => {
      expect(validateMatchingWeights({ skills: 0.5, experience: 0.2, availability: 0.2, performance: 0.1 }).valid).toBe(true);
      expect(validateMatchingWeights({ skills: 0.5, experience: 0.2, availability: 0.2, performance: 0.3 }).valid).toBe(false);
      expect(validateMatchingWeights({ skills: -0.1, experience: 0.5, availability: 0.3, performance: 0.3 }).valid).toBe(false);
    });

    it('computes weighted score components and verifies eligibility', () => {
      // Active workload = 10h out of 40h -> Remaining = 30h -> A_i = 75%
      // Experience = 6y / 4y -> 100%
      // Skill match = 100%
      // Performance = 90%
      // Total = 0.50*100 + 0.20*100 + 0.20*75 + 0.10*90 = 50 + 20 + 15 + 9 = 94.0
      const match = matchEmployeeToProject(mockEmployee, mockProject, 10);

      expect(match.componentScores.skillMatch).toBe(100);
      expect(match.componentScores.experienceMatch).toBe(100);
      expect(match.componentScores.availability).toBe(75);
      expect(match.componentScores.performance).toBe(90);
      expect(match.totalScore).toBeCloseTo(94.0, 1);
      expect(match.isEligible).toBe(true);
      expect(match.hardConstraintViolations.length).toBe(0);
    });

    it('detects mandatory skill violation and flags candidate as ineligible', () => {
      const underqualifiedEmp: Employee = {
        ...mockEmployee,
        skillProficiency: { React: 4 }, // Missing mandatory TypeScript
      };

      const match = matchEmployeeToProject(underqualifiedEmp, mockProject, 0);
      expect(match.isEligible).toBe(false);
      expect(match.missingMandatorySkills).toContain('TypeScript');
      expect(match.hardConstraintViolations.some(v => v.includes('Missing mandatory skill'))).toBe(true);
    });

    it('discloses transparent fallback when performance is missing', () => {
      const unratedEmp: Employee = {
        ...mockEmployee,
        historicalPerformance: undefined,
      };

      const match = matchEmployeeToProject(unratedEmp, mockProject, 0, { performanceFallback: 75 });
      expect(match.componentScores.performance).toBe(75);
      expect(match.performanceDisclosure).toContain('configured neutral fallback score of 75.0/100');
    });
  });

  describe('Algorithm 5: Available Talent Identification', () => {
    it('calculates TalentScore = Score_ij * (A_i / H_i) and excludes capacity violators', () => {
      const employees: Employee[] = [
        {
          employeeId: 'emp_free',
          organizationId: 'org1',
          name: 'Free Employee',
          department: 'Eng',
          designation: 'Dev',
          experienceYears: 5,
          skills: ['TypeScript'],
          skillProficiency: { TypeScript: 5 },
          totalCapacityHours: 40,
          availabilityStatus: 'available',
          historicalPerformance: 90,
        },
        {
          employeeId: 'emp_busy',
          organizationId: 'org1',
          name: 'Overloaded Employee',
          department: 'Eng',
          designation: 'Dev',
          experienceYears: 5,
          skills: ['TypeScript'],
          skillProficiency: { TypeScript: 5 },
          totalCapacityHours: 40,
          availabilityStatus: 'fully_allocated',
          historicalPerformance: 90,
        },
      ];

      const project: Project = {
        projectId: 'p1',
        organizationId: 'org1',
        name: 'Project 1',
        requiredSkills: ['TypeScript'],
        skillProficiency: { TypeScript: 5 },
        minimumExperienceYears: 2,
        teamSize: 1,
        requiredCapacityHours: 20,
        priority: 'medium',
        startDate: '2026-11-01',
        endDate: '2027-01-01',
        status: 'planning',
      };

      // emp_free workload: 0h -> A_i = 40h -> A_i / H_i = 1.0 -> TalentScore = Score_ij
      // emp_busy workload: 40h -> A_i = 0h -> A_i / H_i = 0.0 -> TalentScore = 0
      const workloadMap = {
        emp_free: 0,
        emp_busy: 40,
      };

      const rankings = identifyAvailableTalent(employees, project, workloadMap, { requirePositiveCapacity: true });

      expect(rankings[0].employeeId).toBe('emp_free');
      expect(rankings[0].availableHours).toBe(40);
      expect(rankings[0].talentScore).toBeGreaterThan(0);
      expect(rankings[0].isEligible).toBe(true);

      const busyCandidate = rankings.find(r => r.employeeId === 'emp_busy');
      expect(busyCandidate?.availableHours).toBe(0);
      expect(busyCandidate?.talentScore).toBe(0);
      expect(busyCandidate?.isEligible).toBe(false);
      expect(busyCandidate?.disqualificationReason).toContain('Zero remaining capacity');
    });

    it('safely handles H_i = 0 without error', () => {
      const zeroCapEmp: Employee = {
        employeeId: 'emp_zero',
        organizationId: 'org1',
        name: 'Zero Cap',
        department: 'Eng',
        designation: 'Intern',
        experienceYears: 1,
        skills: ['TypeScript'],
        skillProficiency: { TypeScript: 3 },
        totalCapacityHours: 0,
        availabilityStatus: 'unavailable',
      };

      const project: Project = {
        projectId: 'p1',
        organizationId: 'org1',
        name: 'Project 1',
        requiredSkills: ['TypeScript'],
        skillProficiency: { TypeScript: 3 },
        minimumExperienceYears: 0,
        teamSize: 1,
        requiredCapacityHours: 20,
        priority: 'medium',
        startDate: '2026-11-01',
        endDate: '2027-01-01',
        status: 'planning',
      };

      const rankings = identifyAvailableTalent([zeroCapEmp], project, {});
      expect(rankings[0].talentScore).toBe(0);
      expect(rankings[0].availableHours).toBe(0);
    });
  });
});
