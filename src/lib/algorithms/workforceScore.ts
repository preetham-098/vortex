import {
  Employee,
  Project,
  WorkforceScoreWeights,
  WorkforceOptimizationScoreResult,
} from '@/types';
import { calculateWSGA } from './wsga';
import { DEFAULT_PERFORMANCE_FALLBACK } from './matching';

export const WORKFORCE_SCORE_VERSION = 'workforce-score-v1.0';

export const DEFAULT_WORKFORCE_SCORE_WEIGHTS: WorkforceScoreWeights = {
  lambda1: 0.40, // SkillMatch
  lambda2: 0.30, // Availability
  lambda3: 0.20, // Performance
  lambda4: 0.10, // WorkloadPenalty
};

export function validateWorkforceScoreWeights(weights: WorkforceScoreWeights): { valid: boolean; error?: string } {
  const { lambda1, lambda2, lambda3, lambda4 } = weights;
  if (lambda1 < 0 || lambda2 < 0 || lambda3 < 0 || lambda4 < 0) {
    return { valid: false, error: 'All workforce score weights (lambda_k) must be non-negative.' };
  }
  const sum = lambda1 + lambda2 + lambda3 + lambda4;
  if (Math.abs(sum - 1.0) > 0.001) {
    return { valid: false, error: `Workforce score weights must sum to 1.0; received sum=${sum.toFixed(4)}.` };
  }
  return { valid: true };
}

export interface WorkforceScoreOptions {
  weights?: Partial<WorkforceScoreWeights>;
  projectedWorkloadHours?: number;
  performanceFallback?: number;
}

/**
 * Algorithm 7: Final Workforce Optimization Score
 *
 * F_i = lambda_1*SkillMatch_i + lambda_2*Availability_i + lambda_3*Performance_i - lambda_4*WorkloadPenalty_i
 * Constraint: sum(lambda_k) = 1
 *
 * Note on Score Range:
 * Because the workload penalty is subtracted, the final score F_i can fall below 0 or exceed 100.
 * The mathematical formula is strictly preserved without arbitrary clamping.
 * This score is a suitability index, not an employee quality rating or probability of success.
 */
export function calculateWorkforceOptimizationScore(
  employee: Employee,
  project: Project,
  currentWorkloadHours: number = 0,
  options: WorkforceScoreOptions = {}
): WorkforceOptimizationScoreResult {
  const weights: WorkforceScoreWeights = {
    ...DEFAULT_WORKFORCE_SCORE_WEIGHTS,
    ...options.weights,
  };

  const validation = validateWorkforceScoreWeights(weights);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const H_i = employee.totalCapacityHours || 40;
  const L_i = currentWorkloadHours;
  const L_proj = options.projectedWorkloadHours ?? L_i;

  // 1. SkillMatch_i (0-100)
  const wsga = calculateWSGA({
    requiredProficiency: project.skillProficiency,
    employeeProficiency: employee.skillProficiency,
    skillWeights: project.skillWeights,
  });
  const SkillMatch_i = wsga.skillMatchPercentage;

  // 2. Availability_i (0-100)
  const remainingHours = H_i - L_i;
  const Availability_i = H_i > 0
    ? Math.max(0, Math.min(100, (remainingHours / H_i) * 100))
    : 0;

  // 3. Performance_i (0-100)
  let Performance_i: number;
  let performanceNote: string;
  if (employee.historicalPerformance !== undefined && employee.historicalPerformance !== null) {
    Performance_i = Math.max(0, Math.min(100, employee.historicalPerformance));
    performanceNote = `Historical performance: ${Performance_i}/100`;
  } else {
    Performance_i = options.performanceFallback ?? DEFAULT_PERFORMANCE_FALLBACK;
    performanceNote = `Transparent fallback performance: ${Performance_i}/100`;
  }

  // 4. WorkloadPenalty_i
  // Explicit Definition:
  // Current utilization = (L_i / H_i) * 100
  // Projected utilization = (L_proj / H_i) * 100
  // Overload penalty = max(0, (L_proj - H_i) / H_i) * 150
  const currentUtil = H_i > 0 ? (L_i / H_i) * 100 : 0;
  const projectedUtil = H_i > 0 ? (L_proj / H_i) * 100 : 0;
  const overloadHours = Math.max(0, L_proj - H_i);
  const overloadPenaltyMultiplier = H_i > 0 ? (overloadHours / H_i) * 150 : 0;

  const WorkloadPenalty_i = Number((Math.max(currentUtil, projectedUtil) + overloadPenaltyMultiplier).toFixed(2));

  // Final formula calculation:
  // F_i = lambda1*Skill + lambda2*Avail + lambda3*Perf - lambda4*WorkloadPenalty
  const rawScore =
    weights.lambda1 * SkillMatch_i +
    weights.lambda2 * Availability_i +
    weights.lambda3 * Performance_i -
    weights.lambda4 * WorkloadPenalty_i;

  const finalScore = Number(rawScore.toFixed(2));

  const explanation =
    `Workforce Optimization Score for ${employee.name}: F_i = ${finalScore} ` +
    `[Skill: ${SkillMatch_i.toFixed(1)} * ${weights.lambda1} + ` +
    `Avail: ${Availability_i.toFixed(1)} * ${weights.lambda2} + ` +
    `Perf: ${Performance_i.toFixed(1)} * ${weights.lambda3} - ` +
    `Penalty: ${WorkloadPenalty_i.toFixed(1)} * ${weights.lambda4}]. ` +
    `(${performanceNote}; Utilization: ${currentUtil.toFixed(1)}%, Overload: ${overloadHours}h).`;

  const scoreRangeNote =
    'Score Range Notice: Because the workload penalty is subtracted, values can fall below 0 if an employee is heavily overloaded. ' +
    'The formula is preserved exactly as mathematically specified and should not be used to override mandatory requirements.';

  return {
    employeeId: employee.employeeId,
    employeeName: employee.name,
    finalScore,
    components: {
      skillMatch: Number(SkillMatch_i.toFixed(2)),
      availability: Number(Availability_i.toFixed(2)),
      performance: Number(Performance_i.toFixed(2)),
      workloadPenalty: WorkloadPenalty_i,
    },
    weights,
    workloadPenaltyDetails: {
      currentUtilization: Number(currentUtil.toFixed(1)),
      projectedUtilization: Number(projectedUtil.toFixed(1)),
      overloadHours,
      penaltyCalculationExplanation:
        `Penalty combines peak utilization (${Math.max(currentUtil, projectedUtil).toFixed(1)}%) ` +
        `and overload penalty (${overloadPenaltyMultiplier.toFixed(1)} for ${overloadHours}h excess workload).`,
    },
    scoreRangeNote,
    explanation,
  };
}

/**
 * Calculates workforce optimization scores for all employees for a project
 */
export function rankWorkforceScores(
  employees: Employee[],
  project: Project,
  workloadMap: Record<string, number> = {},
  options: WorkforceScoreOptions = {}
): WorkforceOptimizationScoreResult[] {
  const scores = employees.map(emp =>
    calculateWorkforceOptimizationScore(emp, project, workloadMap[emp.employeeId] || 0, options)
  );

  return scores.sort((a, b) => b.finalScore - a.finalScore);
}
