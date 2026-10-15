import { z } from 'zod';

export const ProficiencySchema = z.number().int().min(1).max(5);

export const EmployeeSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  experienceYears: z.number().min(0, 'Experience years cannot be negative'),
  skills: z.array(z.string().min(1)),
  skillProficiency: z.record(z.string(), ProficiencySchema),
  totalCapacityHours: z.number().positive('Total capacity must be greater than 0'),
  availabilityStatus: z.enum(['available', 'partially_allocated', 'fully_allocated', 'unavailable']),
  historicalPerformance: z.number().min(0).max(100).optional(),
});

export const ProjectTaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  requiredSkill: z.string().min(1),
  requiredProficiency: ProficiencySchema,
  effortHours: z.number().positive(),
  assignedEmployeeId: z.string().nullable().optional(),
  status: z.enum(['unassigned', 'assigned', 'completed']).default('unassigned'),
});

export const ProjectSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  requiredSkills: z.array(z.string().min(1)).min(1, 'At least one required skill must be defined'),
  skillProficiency: z.record(z.string(), ProficiencySchema),
  mandatorySkills: z.array(z.string()).optional().default([]),
  skillWeights: z.record(z.string(), z.number().positive()).optional(),
  minimumExperienceYears: z.number().min(0).default(0),
  teamSize: z.number().int().positive('Team size must be at least 1'),
  requiredCapacityHours: z.number().positive('Required capacity must be greater than 0'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']),
  tasks: z.array(ProjectTaskSchema).optional().default([]),
});

export const AssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  organizationId: z.string().min(1),
  employeeId: z.string().min(1),
  projectId: z.string().min(1),
  allocationHours: z.number().positive('Allocation hours must be greater than 0'),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.enum(['active', 'completed', 'cancelled', 'pending_approval']),
  roleInProject: z.string().optional(),
  notes: z.string().optional(),
});

export const TrainingCourseSchema = z.object({
  courseId: z.string().min(1),
  organizationId: z.string().min(1),
  title: z.string().min(1),
  skill: z.string().min(1),
  proficiencyLevel: ProficiencySchema,
  description: z.string().min(1),
  estimatedDuration: z.string().min(1),
  resourceURL: z.string().url('Must be a valid URL'),
  provider: z.string().optional(),
});

// Matching Weights Schema (must sum to 1.0 within tolerance)
export const MatchingWeightsSchema = z.object({
  skills: z.number().min(0).max(1),
  experience: z.number().min(0).max(1),
  availability: z.number().min(0).max(1),
  performance: z.number().min(0).max(1),
}).refine(
  (w) => Math.abs(w.skills + w.experience + w.availability + w.performance - 1.0) < 0.001,
  { message: 'Matching weights (w_s + w_e + w_a + w_p) must sum to 1.0' }
);

// Workforce Score Weights Schema (sum to 1.0)
export const WorkforceScoreWeightsSchema = z.object({
  lambda1: z.number().min(0).max(1),
  lambda2: z.number().min(0).max(1),
  lambda3: z.number().min(0).max(1),
  lambda4: z.number().min(0).max(1),
}).refine(
  (w) => Math.abs(w.lambda1 + w.lambda2 + w.lambda3 + w.lambda4 - 1.0) < 0.001,
  { message: 'Workforce score weights (sum of lambda_k) must equal 1.0' }
);

// Algorithm 1 input validation
export const WSGAInputSchema = z.object({
  requiredProficiency: z.record(z.string(), ProficiencySchema),
  employeeProficiency: z.record(z.string(), z.number().min(0).max(5)),
  skillWeights: z.record(z.string(), z.number().positive()).optional(),
  trainingPriorityMultipliers: z.record(z.string(), z.number().positive()).optional(),
  maxProficiency: z.number().positive().default(5),
});
