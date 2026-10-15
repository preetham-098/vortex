import { Employee, Project, Recommendation } from '@/types';
import { matchEmployeeToProject } from './matching';
import { calculateTeamSkillCoverage } from './wsga';

export const TEAM_OPTIMIZATION_VERSION = 'team-opt-v1.0';

export interface TeamOptimizationResult {
  projectId: string;
  projectName: string;
  teamSizeTarget: number;
  selectedEmployees: Array<{
    employeeId: string;
    name: string;
    department: string;
    designation: string;
    individualScore: number;
    complementaryContribution: string;
  }>;
  teamSkillCoverage: {
    coveredSkills: string[];
    missingSkills: string[];
    coveragePercentage: number;
    teamProficiencyBySkill: Record<string, number>;
    gaps: Array<{ skill: string; required: number; teamMax: number; gap: number }>;
  };
  totalAllocatedHours: number;
  requiredCapacityHours: number;
  capacityMet: boolean;
  explanation: string;
}

/**
 * Optimizes team selection for complementary skills:
 * Rather than selecting the highest individual scorers who may duplicate the same skills,
 * this algorithm iteratively selects candidates that maximize marginal uncovered skill gain
 * while considering individual suitability and available capacity.
 */
export function optimizeComplementaryTeam(
  employees: Employee[],
  project: Project,
  workloadMap: Record<string, number> = {}
): TeamOptimizationResult {
  const targetSize = project.teamSize || 2;
  const requiredSkills = project.skillProficiency || {};
  const skillNames = Object.keys(requiredSkills);

  // Filter candidates who have remaining capacity > 0
  const eligibleCandidates = employees.filter(emp => {
    const remaining = (emp.totalCapacityHours || 40) - (workloadMap[emp.employeeId] || 0);
    return remaining > 0;
  });

  const selected: Employee[] = [];
  const contributions: Record<string, string> = {};
  const remainingCandidates = [...eligibleCandidates];

  // Track currently satisfied skills and levels
  const currentCoverage: Record<string, number> = {};
  for (const s of skillNames) {
    currentCoverage[s] = 0;
  }

  while (selected.length < targetSize && remainingCandidates.length > 0) {
    let bestCandidateIndex = -1;
    let highestMarginalValue = -Infinity;
    let bestContributionReason = '';

    for (let i = 0; i < remainingCandidates.length; i++) {
      const candidate = remainingCandidates[i];
      const match = matchEmployeeToProject(candidate, project, workloadMap[candidate.employeeId] || 0);

      // Marginal skill improvement
      let marginalSkillGain = 0;
      const skillsImproved: string[] = [];

      for (const skill of skillNames) {
        const req = requiredSkills[skill] || 1;
        const currentBest = currentCoverage[skill] || 0;
        const candProf = candidate.skillProficiency[skill] || 0;

        if (candProf > currentBest) {
          const delta = Math.min(req, candProf) - currentBest;
          if (delta > 0) {
            marginalSkillGain += delta * (project.skillWeights?.[skill] || 1.0);
            skillsImproved.push(skill);
          }
        }
      }

      // Complementary value = Marginal Skill Coverage * 20 + Base Suitability Score * 0.5
      const complementaryValue = marginalSkillGain * 25 + match.totalScore * 0.5;

      if (complementaryValue > highestMarginalValue) {
        highestMarginalValue = complementaryValue;
        bestCandidateIndex = i;
        bestContributionReason = skillsImproved.length > 0
          ? `Covers complementary key skill(s): ${skillsImproved.join(', ')}`
          : `Contributes high overall project suitability (${match.totalScore.toFixed(1)}/100)`;
      }
    }

    if (bestCandidateIndex >= 0) {
      const chosen = remainingCandidates.splice(bestCandidateIndex, 1)[0];
      selected.push(chosen);
      contributions[chosen.employeeId] = bestContributionReason;

      // Update currentCoverage
      for (const skill of skillNames) {
        const prof = chosen.skillProficiency[skill] || 0;
        if (prof > currentCoverage[skill]) {
          currentCoverage[skill] = prof;
        }
      }
    } else {
      break;
    }
  }

  // Calculate final collective coverage
  const coverageReport = calculateTeamSkillCoverage(requiredSkills, selected);

  const selectedDetails = selected.map(emp => {
    const match = matchEmployeeToProject(emp, project, workloadMap[emp.employeeId] || 0);
    return {
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      individualScore: match.totalScore,
      complementaryContribution: contributions[emp.employeeId] || 'Balanced support',
    };
  });

  const totalAllocated = selected.reduce((sum, emp) => {
    const rem = (emp.totalCapacityHours || 40) - (workloadMap[emp.employeeId] || 0);
    return sum + rem;
  }, 0);

  const capacityMet = totalAllocated >= project.requiredCapacityHours;

  const explanation =
    `Selected a complementary team of ${selected.length} members out of target ${targetSize}. ` +
    `Collective skill coverage reached ${coverageReport.coveragePercentage}%. ` +
    (coverageReport.missingSkills.length > 0
      ? `Noticeable gaps remain for: ${coverageReport.missingSkills.join(', ')}. Training recommended.`
      : 'All required project competencies are satisfied collectively.') +
    ` Total team capacity available is ${totalAllocated}h (Project requires ${project.requiredCapacityHours}h).`;

  return {
    projectId: project.projectId,
    projectName: project.name,
    teamSizeTarget: targetSize,
    selectedEmployees: selectedDetails,
    teamSkillCoverage: coverageReport,
    totalAllocatedHours: totalAllocated,
    requiredCapacityHours: project.requiredCapacityHours,
    capacityMet,
    explanation,
  };
}
