import { WSGAInput, WSGAResult, SkillGapDetail, TrainingCourse } from '@/types';

export const WSGA_VERSION = 'wsga-v1.0';
export const DEFAULT_MAX_PROFICIENCY = 5;

/**
 * Algorithm 1: Weighted Skill Gap Analysis (WSGA)
 *
 * M_ij = max(0, R_j - E_ij)
 * SG_i = sum(w_j * M_ij) / sum(w_j)
 * SkillMatch_i = 100 * (1 - SG_i / R_max)
 * TP_ij = M_ij * w_j * P_j
 */
export function calculateWSGA(
  input: WSGAInput,
  availableCourses: TrainingCourse[] = []
): WSGAResult {
  const {
    requiredProficiency,
    employeeProficiency,
    skillWeights = {},
    trainingPriorityMultipliers = {},
    maxProficiency = DEFAULT_MAX_PROFICIENCY,
  } = input;

  const requiredSkillKeys = Object.keys(requiredProficiency);

  // Safe fallback if project requires no skills
  if (requiredSkillKeys.length === 0) {
    return {
      skillGaps: [],
      aggregateSkillGap: 0,
      skillMatchPercentage: 100,
      rankedTrainingPriorities: [],
      recommendedCourses: [],
      explanation: 'No specific skills required for this evaluation; skill match is 100%.',
    };
  }

  let totalWeightedGap = 0;
  let totalWeights = 0;
  const gapDetails: SkillGapDetail[] = [];

  for (const skill of requiredSkillKeys) {
    const R_j = Math.max(1, Math.min(maxProficiency, Number(requiredProficiency[skill]) || 0));
    const E_ij = Math.max(0, Math.min(maxProficiency, Number(employeeProficiency[skill]) || 0));
    const w_j = skillWeights[skill] !== undefined ? Math.max(0.001, Number(skillWeights[skill])) : 1.0;
    const P_j = trainingPriorityMultipliers[skill] !== undefined ? Math.max(0.001, Number(trainingPriorityMultipliers[skill])) : 1.0;

    // M_ij = max(0, R_j - E_ij)
    const M_ij = Math.max(0, R_j - E_ij);

    // TP_ij = M_ij * w_j * P_j
    const TP_ij = Number((M_ij * w_j * P_j).toFixed(4));

    totalWeightedGap += w_j * M_ij;
    totalWeights += w_j;

    gapDetails.push({
      skill,
      requiredProficiency: R_j,
      employeeProficiency: E_ij,
      gap: M_ij,
      weight: w_j,
      priorityMultiplier: P_j,
      trainingPriority: TP_ij,
    });
  }

  // Handle zero denominator safely
  const SG_i = totalWeights > 0 ? totalWeightedGap / totalWeights : 0;

  // SkillMatch_i = 100 * (1 - SG_i / R_max)
  const rawSkillMatch = 100 * (1 - SG_i / maxProficiency);
  const skillMatchPercentage = Math.max(0, Math.min(100, Number(rawSkillMatch.toFixed(2))));

  // Rank gaps by descending Training Priority (TP_ij)
  const rankedTrainingPriorities = [...gapDetails]
    .filter(g => g.gap > 0)
    .sort((a, b) => b.trainingPriority - a.trainingPriority);

  // Match gaps to relevant training courses
  const recommendedCourses: TrainingCourse[] = [];
  const seenCourseIds = new Set<string>();

  for (const gap of rankedTrainingPriorities) {
    const matchingCourses = availableCourses.filter(
      c => c.skill.toLowerCase() === gap.skill.toLowerCase() &&
           c.proficiencyLevel >= gap.requiredProficiency
    );

    // If no course matches exact required proficiency, find any course for the skill
    const candidates = matchingCourses.length > 0
      ? matchingCourses
      : availableCourses.filter(c => c.skill.toLowerCase() === gap.skill.toLowerCase());

    for (const course of candidates) {
      if (!seenCourseIds.has(course.courseId)) {
        seenCourseIds.add(course.courseId);
        recommendedCourses.push(course);
      }
    }
  }

  const missingCount = gapDetails.filter(g => g.employeeProficiency === 0).length;
  const partialCount = gapDetails.filter(g => g.gap > 0 && g.employeeProficiency > 0).length;

  const explanation =
    `Evaluated ${requiredSkillKeys.length} skills with R_max=${maxProficiency}. ` +
    `Found ${missingCount} unacquired skill(s) and ${partialCount} sub-threshold proficiency gap(s). ` +
    `Weighted Skill Gap SG_i=${SG_i.toFixed(2)}, yielding a skill match score of ${skillMatchPercentage.toFixed(1)}%.`;

  return {
    skillGaps: gapDetails,
    aggregateSkillGap: Number(SG_i.toFixed(4)),
    skillMatchPercentage,
    rankedTrainingPriorities,
    recommendedCourses,
    explanation,
  };
}

/**
 * Calculates collective team skill coverage:
 * For team coverage, multiple employees collectively satisfy required skills:
 * E_team,j = max_{i in Team}(E_ij)
 */
export function calculateTeamSkillCoverage(
  requiredSkills: Record<string, number>,
  teamEmployees: Array<{ skillProficiency: Record<string, number> }>
) {
  const skillNames = Object.keys(requiredSkills);
  if (skillNames.length === 0) {
    return {
      coveredSkills: [],
      missingSkills: [],
      coveragePercentage: 100,
      teamProficiencyBySkill: {},
      gaps: [],
    };
  }

  const coveredSkills: string[] = [];
  const missingSkills: string[] = [];
  const teamProficiencyBySkill: Record<string, number> = {};
  const gaps: Array<{ skill: string; required: number; teamMax: number; gap: number }> = [];

  for (const skill of skillNames) {
    const required = requiredSkills[skill] || 1;
    let maxTeamProficiency = 0;

    for (const emp of teamEmployees) {
      const prof = emp.skillProficiency?.[skill] || 0;
      if (prof > maxTeamProficiency) {
        maxTeamProficiency = prof;
      }
    }

    teamProficiencyBySkill[skill] = maxTeamProficiency;
    const gap = Math.max(0, required - maxTeamProficiency);

    if (gap === 0) {
      coveredSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }

    gaps.push({ skill, required, teamMax: maxTeamProficiency, gap });
  }

  const coveragePercentage = Math.round((coveredSkills.length / skillNames.length) * 100);

  return {
    coveredSkills,
    missingSkills,
    coveragePercentage,
    teamProficiencyBySkill,
    gaps,
  };
}
