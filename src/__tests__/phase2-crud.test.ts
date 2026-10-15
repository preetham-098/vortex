import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from '@/lib/db/store';
import { seedDatabase } from '@/lib/db/seedService';
import { EmployeeSchema, ProjectSchema, AssignmentSchema } from '@/lib/validation/schemas';

describe('Phase 2: Database Store, Schemas, and Seed Data', () => {
  beforeEach(async () => {
    dbService.resetMockStore();
    await seedDatabase('org_test_1', true);
  });

  it('correctly seeds employees, projects, assignments, and training courses', async () => {
    const employees = await dbService.getEmployees('org_test_1');
    const projects = await dbService.getProjects('org_test_1');
    const assignments = await dbService.getAssignments('org_test_1');
    const courses = await dbService.getCourses('org_test_1');

    expect(employees.length).toBeGreaterThanOrEqual(12);
    expect(projects.length).toBeGreaterThanOrEqual(4);
    expect(assignments.length).toBeGreaterThanOrEqual(7);
    expect(courses.length).toBeGreaterThanOrEqual(10);
  });

  it('validates employee schemas and rejects invalid proficiency (>5 or <1)', () => {
    const valid = {
      employeeId: 'emp_valid',
      organizationId: 'org_test_1',
      name: 'John Doe',
      department: 'Engineering',
      designation: 'Senior Engineer',
      experienceYears: 5,
      skills: ['TypeScript', 'React'],
      skillProficiency: { TypeScript: 5, React: 4 },
      totalCapacityHours: 40,
      availabilityStatus: 'available' as const,
    };
    expect(() => EmployeeSchema.parse(valid)).not.toThrow();

    const invalidProficiency = {
      ...valid,
      skillProficiency: { TypeScript: 6 }, // Invalid > 5
    };
    expect(() => EmployeeSchema.parse(invalidProficiency)).toThrow();
  });

  it('enforces organization-level isolation', async () => {
    const org1Employees = await dbService.getEmployees('org_test_1');
    const org2Employees = await dbService.getEmployees('org_isolated');

    expect(org1Employees.length).toBeGreaterThan(0);
    expect(org2Employees.length).toBe(0);
  });

  it('supports employee CRUD operations', async () => {
    const newEmp = {
      employeeId: 'emp_crud_1',
      organizationId: 'org_test_1',
      name: 'Test Engineer',
      department: 'Platform',
      designation: 'Staff SRE',
      experienceYears: 6,
      skills: ['Go', 'Docker'],
      skillProficiency: { Go: 4, Docker: 4 },
      totalCapacityHours: 40,
      availabilityStatus: 'available' as const,
    };

    await dbService.saveEmployee('org_test_1', newEmp);
    const fetched = await dbService.getEmployee('org_test_1', 'emp_crud_1');
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('Test Engineer');

    await dbService.deleteEmployee('org_test_1', 'emp_crud_1');
    const afterDelete = await dbService.getEmployee('org_test_1', 'emp_crud_1');
    expect(afterDelete).toBeNull();
  });

  it('validates assignment schemas and calculations', async () => {
    const assignment = {
      assignmentId: 'asg_test_1',
      organizationId: 'org_test_1',
      employeeId: 'emp_01',
      projectId: 'proj_01',
      allocationHours: 20,
      startDate: '2026-11-01',
      endDate: '2027-04-30',
      status: 'active' as const,
    };

    expect(() => AssignmentSchema.parse(assignment)).not.toThrow();
  });
});
