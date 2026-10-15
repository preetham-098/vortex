export type UserRole = 'manager' | 'admin' | 'employee';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  createdAt: string;
}

export type AvailabilityStatus = 'available' | 'partially_allocated' | 'fully_allocated' | 'unavailable';

export interface Employee {
  employeeId: string;
  organizationId: string;
  name: string;
  department: string;
  designation: string;
  experienceYears: number;
  skills: string[];
  skillProficiency: Record<string, number>; // 1 to 5
  totalCapacityHours: number; // e.g., 40 hrs/week
  availabilityStatus: AvailabilityStatus;
  historicalPerformance?: number; // 0-100 score if available
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold';

export interface ProjectTask {
  taskId: string;
  title: string;
  requiredSkill: string;
  requiredProficiency: number;
  effortHours: number;
  assignedEmployeeId?: string | null;
  status: 'unassigned' | 'assigned' | 'completed';
}

export interface Project {
  projectId: string;
  organizationId: string;
  name: string;
  description?: string;
  requiredSkills: string[];
  skillProficiency: Record<string, number>; // R_j: 1 to 5
  mandatorySkills?: string[]; // skills that must be satisfied
  skillWeights?: Record<string, number>; // w_j: default 1.0
  minimumExperienceYears: number;
  teamSize: number;
  requiredCapacityHours: number; // e.g. total hours needed
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  tasks?: ProjectTask[];
  createdAt?: string;
  updatedAt?: string;
}

export type AssignmentStatus = 'active' | 'completed' | 'cancelled' | 'pending_approval';

export interface Assignment {
  assignmentId: string;
  organizationId: string;
  employeeId: string;
  projectId: string;
  allocationHours: number;
  startDate: string;
  endDate: string;
  status: AssignmentStatus;
  roleInProject?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingCourse {
  courseId: string;
  organizationId: string;
  title: string;
  skill: string;
  proficiencyLevel: number; // Target level (1 to 5)
  description: string;
  estimatedDuration: string; // e.g. '12 hours' or '3 weeks'
  resourceURL: string;
  provider?: string;
}

export interface Recommendation {
  recommendationId: string;
  organizationId: string;
  projectId: string;
  employeeIds: string[];
  matchScores: Record<string, number>;
  teamCoverage: {
    coveredSkills: string[];
    missingSkills: string[];
    coveragePercentage: number;
  };
  skillGaps: Array<{
    skill: string;
    requiredLevel: number;
    highestTeamLevel: number;
    gap: number;
  }>;
  algorithmVersion: string;
  createdAt: string;
}

// Algorithm 1: WSGA Interfaces
export interface WSGAInput {
  requiredProficiency: Record<string, number>; // R_j
  employeeProficiency: Record<string, number>; // E_ij
  skillWeights?: Record<string, number>; // w_j
  trainingPriorityMultipliers?: Record<string, number>; // P_j
  maxProficiency?: number; // R_max, default 5
}

export interface SkillGapDetail {
  skill: string;
  requiredProficiency: number;
  employeeProficiency: number;
  gap: number; // M_ij
  weight: number; // w_j
  priorityMultiplier: number; // P_j
  trainingPriority: number; // TP_ij = M_ij * w_j * P_j
}

export interface WSGAResult {
  skillGaps: SkillGapDetail[];
  aggregateSkillGap: number; // SG_i
  skillMatchPercentage: number; // SkillMatch_i
  rankedTrainingPriorities: SkillGapDetail[];
  recommendedCourses: TrainingCourse[];
  explanation: string;
}

// Algorithm 2: Weighted Employee-Project Matching
export interface MatchingWeights {
  skills: number; // w_s, default 0.50
  experience: number; // w_e, default 0.20
  availability: number; // w_a, default 0.20
  performance: number; // w_p, default 0.10
}

export interface MatchCandidateResult {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  totalScore: number; // Score_ip
  componentScores: {
    skillMatch: number; // S_ip (0-100)
    experienceMatch: number; // E_ip (0-100)
    availability: number; // A_i (0-100)
    performance: number; // P_i (0-100)
  };
  isEligible: boolean;
  hardConstraintViolations: string[];
  matchedSkills: string[];
  missingMandatorySkills: string[];
  skillGaps: SkillGapDetail[];
  performanceDisclosure: string;
  explanation: string;
}

// Algorithm 3: Workload Balancing
export interface EmployeeWorkloadMetrics {
  employeeId: string;
  employeeName: string;
  department: string;
  availableWorkingHours: number; // H_i
  assignedWorkloadHours: number; // L_i
  remainingCapacity: number; // C_i = H_i - L_i
  utilizationPercentage: number; // U_i = (L_i / H_i) * 100
  workloadShare: number; // W_i = L_i / sum(L_k)
  status: 'underutilized' | 'optimal' | 'approaching_capacity' | 'overloaded';
}

export interface WorkloadBalancingReport {
  period: string;
  employeeMetrics: EmployeeWorkloadMetrics[];
  totalWorkloadHours: number;
  totalAvailableHours: number;
  averageWorkloadHours: number; // mu(L)
  workloadStandardDeviation: number; // sigma(L)
  workloadImbalanceRatio: number; // sigma(L) / mu(L)
  departmentAggregates: Record<string, {
    totalWorkload: number;
    totalCapacity: number;
    utilization: number;
    employeeCount: number;
  }>;
  overloadedCount: number;
  underutilizedCount: number;
}

// Algorithm 4: Constrained Task Allocation
export interface TaskAllocationInput {
  tasks: Array<{
    taskId: string;
    title: string;
    effortHours: number; // T_j
    requiredSkill: string;
    requiredProficiency: number;
  }>;
  employees: Array<{
    employeeId: string;
    name: string;
    capacityHours: number; // H_i
    skills: Record<string, number>;
    currentWorkloadHours: number;
  }>;
  objectiveWeights?: {
    alpha: number; // skill-gap penalty
    beta: number; // workload penalty
    gamma: number; // mismatch penalty
  };
  minSkillMatchThreshold?: number; // tau (e.g. 50%)
}

export interface TaskAssignmentProposal {
  taskId: string;
  taskTitle: string;
  assignedEmployeeId: string | null;
  assignedEmployeeName?: string;
  effortHours: number;
  skillMatchScore: number;
  penaltyCost: number;
  feasibilityStatus: 'feasible' | 'unassignable' | 'capacity_exceeded';
  notes: string;
}

export interface TaskAllocationResult {
  solverUsed: 'scipy_milp' | 'branch_and_bound_heuristic';
  isOptimal: boolean;
  totalObjectiveCost: number;
  proposals: TaskAssignmentProposal[];
  unassignableTasks: string[];
  capacityViolations: string[];
  beforeWorkload: Record<string, number>;
  afterWorkload: Record<string, number>;
}

// Algorithm 5: Available Talent Identification
export interface TalentRankResult {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  availableHours: number; // A_i = max(0, H_i - L_i)
  totalCapacityHours: number; // H_i
  suitabilityScore: number; // Score_ij
  talentScore: number; // TalentScore_ij = Score_ij * (A_i / H_i)
  isEligible: boolean;
  disqualificationReason?: string;
  skills: Record<string, number>;
  explanation: string;
}

// Algorithm 6: Random Forest Workload Prediction
export interface WorkloadPredictionRequest {
  employeeId: string;
  features: {
    previousWorkloadHours: number;
    historicalUtilization: number;
    activeAssignmentCount: number;
    plannedProjectHours: number;
    upcomingDeadlinesCount: number;
    departmentCode: number;
    experienceYears: number;
    workloadTrend: number;
  };
}

export interface WorkloadPredictionResult {
  employeeId: string;
  predictedWorkloadHours: number; // L_hat_(i, t+1)
  confidenceInterval?: [number, number];
  modelVersion: string;
  evaluationMetrics: {
    mae: number;
    rmse: number;
    sampleSize: number;
    isSyntheticDemonstration: boolean;
  };
  period: string;
  status: 'trained_model' | 'fallback_heuristic' | 'demo';
}

// Algorithm 7: Final Workforce Optimization Score
export interface WorkforceScoreWeights {
  lambda1: number; // SkillMatch_i (e.g. 0.40)
  lambda2: number; // Availability_i (e.g. 0.30)
  lambda3: number; // Performance_i (e.g. 0.20)
  lambda4: number; // WorkloadPenalty_i (e.g. 0.10)
}

export interface WorkforceOptimizationScoreResult {
  employeeId: string;
  employeeName: string;
  finalScore: number; // F_i = lambda1*Skill + lambda2*Avail + lambda3*Perf - lambda4*Penalty
  components: {
    skillMatch: number; // 0-100
    availability: number; // 0-100
    performance: number; // 0-100
    workloadPenalty: number; // 0-100+
  };
  weights: WorkforceScoreWeights;
  workloadPenaltyDetails: {
    currentUtilization: number;
    projectedUtilization: number;
    overloadHours: number;
    penaltyCalculationExplanation: string;
  };
  scoreRangeNote: string;
  explanation: string;
}
