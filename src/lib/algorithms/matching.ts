import {
  Employee,
  Project,
  MatchingWeights,
  MatchCandidateResult,
  SkillGapDetail,
} from '@/types';
import { calculateWSGA } from './wsga';

export const MATCHING_ALGORITHM_VERSION = 'emp-match-v1.0';

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  skills: 0.50,
  experience: 0.20,
  availability: 0.20,
  performance: 0.10,
};

export const DEFAULT_PERFORMANCE_FALLBACK = 75.0; // Disclosed baseline for unrated staff

export interface MatchingOptions {
  weights?: Partial<MatchingWeights>;
  performanceFallback?: number;
  strictCapacityCheck?: boolean;
}

/**
 * Validates matching weights: nonnegative and sum to 1.0 within floating tolerance
 */
export function validateMatchingWeights(weights: MatchingWeights): { valid: boolean; error?: string } {
  const { skills, experience, availability, performance } = weights;

  if (skills < 0 || experience < 0 || availability < 0 || performance < 0) {
    return { valid: false, error: 'All matching weights must be non-negative.' };
  }

  const sum = skills + experience + availability + performance;
  if (Math.abs(sum - 1.0) > 0.001) {
    return { valid: false, error: `Matching weights must sum to 1.0; received sum=${sum.toFixed(4)}.` };
  }

  return { valid: true };
}

/**
 * Algorithm 2: Weighted Employee-Project Matching
 *
 * Score_ip = w_s*S_ip + w_e*E_ip + w_a*A_i + w_p*P_i
 * Constraint: w_s + w_e + w_a + w_p = 1
 */
export function matchEmployeeToProject(
  employee: Employee,
  project: Project,
  activeWorkloadHours: number = 0,
  options: MatchingOptions = {}
): MatchCandidateResult {
  const mergedWeights: MatchingWeights = {
    ...DEFAULT_MATCHING_WEIGHTS,
    ...options.weights,
  };

  const validation = validateMatchingWeights(mergedWeights);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const hardConstraintViolations: string[] = [];
  const missingMandatorySkills: string[] = [];

  // 1. Skill Match S_ip (0-100) via WSGA
  const wsgaResult = calculateWSGA({
    requiredProficiency: project.skillProficiency,
    employeeProficiency: employee.skillProficiency,
    skillWeights: project.skillWeights,
  });
  const S_ip = wsgaResult.skillMatchPercentage;

  // Check mandatory skills
  const mandatory = project.mandatorySkills || [];
  for (const mandSkill of mandatory) {
    const requiredLevel = project.skillProficiency[mandSkill] || 1;
    const empLevel = employee.skillProficiency[mandSkill] || 0;
    if (empLevel < requiredLevel) {
      missingMandatorySkills.push(mandSkill);
      hardConstraintViolations.push(
        `Missing mandatory skill '${mandSkill}' (required: ${requiredLevel}, current: ${empLevel})`
      );
    }
  }

  // 2. Experience Match E_ip (0-100)
  const minExp = project.minimumExperienceYears;
  let E_ip = 100;
  if (minExp > 0) {
    E_ip = Math.min(100, Math.max(0, (employee.experienceYears / minExp) * 100));
    if (employee.experienceYears < minExp) {
      hardConstraintViolations.push(
        `Experience ${employee.experienceYears} yrs is below minimum requirement of ${minExp} yrs`
      );
    }
  }

  // 3. Availability Match A_i (0-100)
  const H_i = employee.totalCapacityHours;
  let A_i = 0;
  const remainingHours = H_i - activeWorkloadHours;

  if (H_i > 0) {
    A_i = Math.max(0, Math.min(100, (remainingHours / H_i) * 100));
  }

  if (options.strictCapacityCheck && remainingHours <= 0) {
    hardConstraintViolations.push(
      `Zero available capacity: workload (${activeWorkloadHours}h) meets or exceeds total capacity (${H_i}h)`
    );
  }

  // 4. Past Performance P_i (0-100)
  let P_i: number;
  let performanceDisclosure: string;

  if (employee.historicalPerformance !== undefined && employee.historicalPerformance !== null) {
    P_i = Math.max(0, Math.min(100, employee.historicalPerformance));
    performanceDisclosure = `Verified historical performance rating: ${P_i.toFixed(1)}/100.`;
  } else {
    P_i = options.performanceFallback ?? DEFAULT_PERFORMANCE_FALLBACK;
    performanceDisclosure = `Historical performance rating unavailable; applied configured neutral fallback score of ${P_i.toFixed(1)}/100.`;
  }

  // Weighted Score Calculation
  const totalScore = Number(
    (
      mergedWeights.skills * S_ip +
      mergedWeights.experience * E_ip +
      mergedWeights.availability * A_i +
      mergedWeights.performance * P_i
    ).toFixed(2)
  );

  const isEligible = hardConstraintViolations.length === 0;

  const matchedSkills = Object.keys(project.skillProficiency).filter(
    skill => (employee.skillProficiency[skill] || 0) >= (project.skillProficiency[skill] || 1)
  );

  const explanation =
    `Candidate ${employee.name} (${employee.designation}) achieved a weighted suitability score of ${totalScore}/100 ` +
    `[Skills: ${S_ip.toFixed(1)} (w=${mergedWeights.skills}), Exp: ${E_ip.toFixed(1)} (w=${mergedWeights.experience}), ` +
    `Avail: ${A_i.toFixed(1)} (w=${mergedWeights.availability}), Perf: ${P_i.toFixed(1)} (w=${mergedWeights.performance})]. ` +
    (isEligible
      ? 'All mandatory skill and experience constraints are satisfied.'
      : `Hard constraint violations detected: ${hardConstraintViolations.join('; ')}.`) +
    ' Note: This score is a multi-criteria suitability metric, not a probability of success.';

  return {
    employeeId: employee.employeeId,
    employeeName: employee.name,
    department: employee.department,
    designation: employee.designation,
    totalScore,
    componentScores: {
      skillMatch: Number(S_ip.toFixed(2)),
      experienceMatch: Number(E_ip.toFixed(2)),
      availability: Number(A_i.toFixed(2)),
      performance: Number(P_i.toFixed(2)),
    },
    isEligible,
    hardConstraintViolations,
    matchedSkills,
    missingMandatorySkills,
    skillGaps: wsgaResult.skillGaps,
    performanceDisclosure,
    explanation,
  };
}

/**
 * Ranks all employees for a given project, sorting eligible candidates first by totalScore
 */
export function rankEmployeesForProject(
  employees: Employee[],
  project: Project,
  workloadMap: Record<string, number> = {},
  options: MatchingOptions = {}
): MatchCandidateResult[] {
  const results = employees.map(emp =>
    matchEmployeeToProject(emp, project, workloadMap[emp.employeeId] || 0, options)
  );

  return results.sort((a, b) => {
    // Eligible candidates first
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    // Then descending total score
    return b.totalScore - a.totalScore;
  });
}
