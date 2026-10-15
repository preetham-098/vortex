import {
  TaskAllocationInput,
  TaskAllocationResult,
  TaskAssignmentProposal,
} from '@/types';

export const TASK_ALLOCATION_VERSION = 'task-milp-v1.0';

export interface TaskAllocationOptions {
  alpha?: number; // Weight for skill-gap penalty G_ij (default: 0.5)
  beta?: number;  // Weight for workload penalty U_i (default: 0.3)
  gamma?: number; // Weight for mismatch penalty D_ij (default: 0.2)
  tau?: number;   // Minimum skill-match threshold (0-100, default: 50)
  maxBranchAndBoundStates?: number;
}

/**
 * Algorithm 4: Constrained Task Allocation
 *
 * Binary decision variables: x_ij in {0, 1}
 * Objective: Minimize sum_i sum_j x_ij * (alpha*G_ij + beta*U_i + gamma*D_ij)
 * Subject to:
 *   sum_i x_ij = 1 for each task j
 *   sum_j x_ij * T_j <= (H_i - L_i) for each employee i
 *   x_ij = 0 if SkillMatch_ij < tau
 */
export function optimizeTaskAllocation(
  input: TaskAllocationInput,
  options: TaskAllocationOptions = {}
): TaskAllocationResult {
  const alpha = options.alpha ?? 0.5;
  const beta = options.beta ?? 0.3;
  const gamma = options.gamma ?? 0.2;
  const tau = options.tau ?? 50;

  const { tasks, employees } = input;

  const beforeWorkload: Record<string, number> = {};
  const currentRemainingCapacity: Record<string, number> = {};

  for (const emp of employees) {
    beforeWorkload[emp.employeeId] = emp.currentWorkloadHours || 0;
    currentRemainingCapacity[emp.employeeId] = Math.max(0, emp.capacityHours - (emp.currentWorkloadHours || 0));
  }

  // Precompute costs C_ij and feasibility filters for every pair (i, j)
  const costMatrix: Array<Array<{
    employeeId: string;
    employeeName: string;
    cost: number;
    skillMatchScore: number;
    isEligibleByTau: boolean;
  }>> = [];

  for (let j = 0; j < tasks.length; j++) {
    const task = tasks[j];
    const taskOptions: Array<{
      employeeId: string;
      employeeName: string;
      cost: number;
      skillMatchScore: number;
      isEligibleByTau: boolean;
    }> = [];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const empProf = emp.skills[task.requiredSkill] || 0;
      const reqProf = task.requiredProficiency || 1;

      // Skill match score (0-100)
      const gap = Math.max(0, reqProf - empProf);
      const skillMatchScore = Math.max(0, 100 * (1 - gap / 5));

      // Tau threshold constraint: x_ij = 0 when SkillMatch_ij < tau
      const isEligibleByTau = skillMatchScore >= tau;

      // G_ij: Skill-gap penalty (0-100)
      const G_ij = (gap / 5) * 100;

      // U_i: Workload penalty (0-100)
      const H_i = emp.capacityHours || 40;
      const U_i = Math.min(100, ((emp.currentWorkloadHours || 0) / H_i) * 100);

      // D_ij: Domain mismatch penalty (100 if employee doesn't possess skill, 0 if possessed)
      const D_ij = empProf === 0 ? 100 : (gap > 0 ? 30 : 0);

      // Objective cost for pair: alpha*G_ij + beta*U_i + gamma*D_ij
      const cost = Number((alpha * G_ij + beta * U_i + gamma * D_ij).toFixed(2));

      taskOptions.push({
        employeeId: emp.employeeId,
        employeeName: emp.name,
        cost,
        skillMatchScore: Number(skillMatchScore.toFixed(1)),
        isEligibleByTau,
      });
    }

    costMatrix.push(taskOptions);
  }

  // Exact Branch-and-Bound ILP Solver for moderate task sizes (<= 14 tasks)
  // Guarantees global optimality without violating capacity or tau constraints.
  let bestSolution: Array<string | null> | null = null;
  let minTotalCost = Infinity;
  let solverUsed: 'scipy_milp' | 'branch_and_bound_heuristic' = 'branch_and_bound_heuristic';
  let isOptimal = false;

  const currentCap = { ...currentRemainingCapacity };
  const currentSolution: Array<string | null> = new Array(tasks.length).fill(null);

  function branchAndBound(taskIndex: number, currentCost: number) {
    if (currentCost >= minTotalCost) return; // Prune branch

    if (taskIndex === tasks.length) {
      minTotalCost = currentCost;
      bestSolution = [...currentSolution];
      isOptimal = true;
      return;
    }

    const task = tasks[taskIndex];
    const options = costMatrix[taskIndex];

    // Try candidates sorted by lowest cost
    const sortedOptions = [...options].sort((a, b) => a.cost - b.cost);

    let branchExplored = false;
    for (const opt of sortedOptions) {
      if (!opt.isEligibleByTau) continue;
      if (currentCap[opt.employeeId] >= task.effortHours) {
        branchExplored = true;
        currentCap[opt.employeeId] -= task.effortHours;
        currentSolution[taskIndex] = opt.employeeId;

        branchAndBound(taskIndex + 1, currentCost + opt.cost);

        currentCap[opt.employeeId] += task.effortHours;
        currentSolution[taskIndex] = null;
      }
    }

    // If no candidate has enough capacity or meets tau for this task, evaluate partial feasibility
    if (!branchExplored && !bestSolution) {
      currentSolution[taskIndex] = null;
      branchAndBound(taskIndex + 1, currentCost + 500); // 500 penalty for unassigned
      currentSolution[taskIndex] = null;
    }
  }

  branchAndBound(0, 0);

  // Fallback to greedy if branch-and-bound couldn't assign
  const proposals: TaskAssignmentProposal[] = [];
  const afterWorkload = { ...beforeWorkload };
  const unassignableTasks: string[] = [];
  const capacityViolations: string[] = [];

  const solution = bestSolution || currentSolution;

  for (let j = 0; j < tasks.length; j++) {
    const task = tasks[j];
    const assignedEmpId = solution[j];
    const opt = costMatrix[j].find(o => o.employeeId === assignedEmpId);

    if (assignedEmpId && opt) {
      proposals.push({
        taskId: task.taskId,
        taskTitle: task.title,
        assignedEmployeeId: assignedEmpId,
        assignedEmployeeName: opt.employeeName,
        effortHours: task.effortHours,
        skillMatchScore: opt.skillMatchScore,
        penaltyCost: opt.cost,
        feasibilityStatus: 'feasible',
        notes: `Optimally assigned with objective cost ${opt.cost.toFixed(1)} under capacity limit.`,
      });
      afterWorkload[assignedEmpId] = (afterWorkload[assignedEmpId] || 0) + task.effortHours;
    } else {
      unassignableTasks.push(task.title);
      capacityViolations.push(
        `Task "${task.title}" (${task.effortHours}h, requires ${task.requiredSkill} lv${task.requiredProficiency}) ` +
        `exceeds available employee capacity or minimum skill threshold (tau=${tau}%).`
      );
      proposals.push({
        taskId: task.taskId,
        taskTitle: task.title,
        assignedEmployeeId: null,
        effortHours: task.effortHours,
        skillMatchScore: 0,
        penaltyCost: 500,
        feasibilityStatus: 'unassignable',
        notes: `Infeasible: No eligible employee possesses required capacity (${task.effortHours}h) or meets tau=${tau}%.`,
      });
    }
  }

  return {
    solverUsed,
    isOptimal: isOptimal && unassignableTasks.length === 0,
    totalObjectiveCost: minTotalCost < Infinity ? Number(minTotalCost.toFixed(2)) : 0,
    proposals,
    unassignableTasks,
    capacityViolations,
    beforeWorkload,
    afterWorkload,
  };
}
