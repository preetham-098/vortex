import { Employee, Project, TalentRankResult } from '@/types';
import { matchEmployeeToProject, MatchingOptions } from './matching';

export const TALENT_ALGORITHM_VERSION = 'talent-v1.0';

/**
 * Algorithm 5: Available Talent Identification
 *
 * A_i = max(0, H_i - L_i)
 * TalentScore_ij = Score_ij * (A_i / H_i)
 */
export function identifyAvailableTalent(
  employees: Employee[],
  project: Project,
  workloadMap: Record<string, number> = {},
  options: MatchingOptions & { requirePositiveCapacity?: boolean } = {}
): TalentRankResult[] {
  const results: TalentRankResult[] = [];

  for (const emp of employees) {
    const H_i = emp.totalCapacityHours || 0;
    const L_i = workloadMap[emp.employeeId] || 0;

    // A_i = max(0, H_i - L_i)
    const A_i = Math.max(0, H_i - L_i);

    // Calculate base match score Score_ij
    const match = matchEmployeeToProject(emp, project, L_i, options);
    const Score_ij = match.totalScore;

    // TalentScore_ij = Score_ij * (A_i / H_i)
    let TalentScore_ij = 0;
    if (H_i > 0) {
      TalentScore_ij = Number((Score_ij * (A_i / H_i)).toFixed(2));
    }

    const hasCapacity = A_i > 0;
    const isEligible = match.isEligible && (!options.requirePositiveCapacity || hasCapacity);

    let disqualificationReason: string | undefined;
    if (!match.isEligible) {
      disqualificationReason = match.hardConstraintViolations.join('; ');
    } else if (options.requirePositiveCapacity && !hasCapacity) {
      disqualificationReason = `Zero remaining capacity: assigned ${L_i}h of ${H_i}h total capacity.`;
    }

    const explanation =
      `${emp.name} has ${A_i}h available of ${H_i}h capacity (${H_i > 0 ? Math.round((A_i / H_i) * 100) : 0}% capacity ratio). ` +
      `Base project suitability score: ${Score_ij.toFixed(1)}/100, yielding capacity-discounted TalentScore: ${TalentScore_ij.toFixed(1)}/100.` +
      (disqualificationReason ? ` Disqualified: ${disqualificationReason}` : '');

    results.push({
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.department,
      designation: emp.designation,
      availableHours: A_i,
      totalCapacityHours: H_i,
      suitabilityScore: Score_ij,
      talentScore: TalentScore_ij,
      isEligible,
      disqualificationReason,
      skills: emp.skillProficiency,
      explanation,
    });
  }

  // Rank by descending TalentScore_ij (eligible candidates prioritised)
  return results.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.talentScore - a.talentScore;
  });
}
