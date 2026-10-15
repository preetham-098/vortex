import {
  Employee,
  Assignment,
  EmployeeWorkloadMetrics,
  WorkloadBalancingReport,
} from '@/types';

export const WORKLOAD_ALGORITHM_VERSION = 'workload-v1.0';

/**
 * Algorithm 3: Capacity-Aware Workload Balancing
 *
 * C_i = H_i - L_i
 * U_i = (L_i / H_i) * 100
 * W_i = L_i / sum(L_k)
 * Imbalance = sigma(L) / mu(L)
 */
export function calculateWorkloadMetrics(
  employees: Employee[],
  assignments: Assignment[],
  reportingPeriod: string = 'Current Active Cycle'
): WorkloadBalancingReport {
  // Exclude cancelled or non-active assignments
  const activeAssignments = assignments.filter(a => a.status === 'active');

  // Compute L_i for each employee
  const workloadByEmployee: Record<string, number> = {};
  for (const emp of employees) {
    workloadByEmployee[emp.employeeId] = 0;
  }

  for (const asg of activeAssignments) {
    if (workloadByEmployee[asg.employeeId] !== undefined) {
      workloadByEmployee[asg.employeeId] += Number(asg.allocationHours) || 0;
    }
  }

  // sum(L_k)
  const totalWorkloadHours = Object.values(workloadByEmployee).reduce((sum, val) => sum + val, 0);
  const totalAvailableHours = employees.reduce((sum, e) => sum + (e.totalCapacityHours || 0), 0);

  const employeeMetrics: EmployeeWorkloadMetrics[] = [];
  const departmentAggregates: Record<string, {
    totalWorkload: number;
    totalCapacity: number;
    utilization: number;
    employeeCount: number;
  }> = {};

  let overloadedCount = 0;
  let underutilizedCount = 0;

  for (const emp of employees) {
    const H_i = emp.totalCapacityHours || 0;
    const L_i = workloadByEmployee[emp.employeeId] || 0;

    // C_i = H_i - L_i (Preserve negative capacity to expose overload)
    const C_i = H_i - L_i;

    // U_i = (L_i / H_i) * 100 (Safely handle H_i = 0)
    let U_i = 0;
    if (H_i > 0) {
      U_i = Number(((L_i / H_i) * 100).toFixed(2));
    }

    // W_i = L_i / sum(L_k) (Workload share)
    let W_i = 0;
    if (totalWorkloadHours > 0) {
      W_i = Number((L_i / totalWorkloadHours).toFixed(4));
    }

    // Status classification
    let status: EmployeeWorkloadMetrics['status'] = 'optimal';
    if (H_i === 0) {
      status = 'underutilized';
    } else if (U_i > 100) {
      status = 'overloaded';
      overloadedCount++;
    } else if (U_i >= 85) {
      status = 'approaching_capacity';
    } else if (U_i < 50 || C_i >= 20) {
      status = 'underutilized';
      underutilizedCount++;
    }

    employeeMetrics.push({
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.department,
      availableWorkingHours: H_i,
      assignedWorkloadHours: L_i,
      remainingCapacity: C_i,
      utilizationPercentage: U_i,
      workloadShare: W_i,
      status,
    });

    // Department aggregates
    if (!departmentAggregates[emp.department]) {
      departmentAggregates[emp.department] = {
        totalWorkload: 0,
        totalCapacity: 0,
        utilization: 0,
        employeeCount: 0,
      };
    }
    departmentAggregates[emp.department].totalWorkload += L_i;
    departmentAggregates[emp.department].totalCapacity += H_i;
    departmentAggregates[emp.department].employeeCount += 1;
  }

  // Finalize department utilization
  for (const dept of Object.keys(departmentAggregates)) {
    const data = departmentAggregates[dept];
    data.utilization = data.totalCapacity > 0
      ? Number(((data.totalWorkload / data.totalCapacity) * 100).toFixed(2))
      : 0;
  }

  // Workload distribution statistics: mu(L), sigma(L), Imbalance
  const N = employees.length;
  const mu_L = N > 0 ? totalWorkloadHours / N : 0;

  let varianceSum = 0;
  for (const emp of employees) {
    const L_i = workloadByEmployee[emp.employeeId] || 0;
    varianceSum += Math.pow(L_i - mu_L, 2);
  }

  // Population standard deviation sigma(L) = sqrt(sum((L_i - mu)^2) / N)
  const sigma_L = N > 0 ? Math.sqrt(varianceSum / N) : 0;

  // Imbalance = sigma(L) / mu(L) (Safely handle mu(L) = 0)
  const imbalanceRatio = mu_L > 0 ? Number((sigma_L / mu_L).toFixed(4)) : 0;

  return {
    period: reportingPeriod,
    employeeMetrics,
    totalWorkloadHours,
    totalAvailableHours,
    averageWorkloadHours: Number(mu_L.toFixed(2)),
    workloadStandardDeviation: Number(sigma_L.toFixed(2)),
    workloadImbalanceRatio: imbalanceRatio,
    departmentAggregates,
    overloadedCount,
    underutilizedCount,
  };
}
