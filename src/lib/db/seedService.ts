import { dbService } from './store';
import { DEFAULT_ORG_ID } from './seedData';
import { SYNTHETIC_DATASETS } from './syntheticDatasets';

export async function seedDatabase(
  orgId: string = DEFAULT_ORG_ID,
  force: boolean = false,
  datasetId: string = 'enterprise_tech'
) {
  const dataset = SYNTHETIC_DATASETS[datasetId] || SYNTHETIC_DATASETS['enterprise_tech'];

  const existingEmployees = await dbService.getEmployees(orgId);
  if (existingEmployees.length > 0 && !force) {
    return {
      message: 'Database already contains data. Use force=true or switch dataset to reload.',
      activeDataset: dataset.id,
      datasetName: dataset.name,
      employeesCount: existingEmployees.length,
      projectsCount: (await dbService.getProjects(orgId)).length,
      assignmentsCount: (await dbService.getAssignments(orgId)).length,
      coursesCount: (await dbService.getCourses(orgId)).length,
    };
  }

  // When force reloading or switching dataset, clear out current org data
  if (force) {
    const oldEmployees = await dbService.getEmployees(orgId);
    for (const emp of oldEmployees) {
      await dbService.deleteEmployee(orgId, emp.employeeId);
    }
    const oldProjects = await dbService.getProjects(orgId);
    for (const proj of oldProjects) {
      await dbService.deleteProject(orgId, proj.projectId);
    }
    const oldAssignments = await dbService.getAssignments(orgId);
    for (const asg of oldAssignments) {
      await dbService.deleteAssignment(orgId, asg.assignmentId);
    }
  }

  // Seed employees
  for (const emp of dataset.employees) {
    await dbService.saveEmployee(orgId, { ...emp, organizationId: orgId });
  }

  // Seed projects
  for (const proj of dataset.projects) {
    await dbService.saveProject(orgId, { ...proj, organizationId: orgId });
  }

  // Seed assignments
  for (const asg of dataset.assignments) {
    await dbService.saveAssignment(orgId, { ...asg, organizationId: orgId });
  }

  // Seed courses
  for (const crs of dataset.courses) {
    await dbService.saveCourse(orgId, { ...crs, organizationId: orgId });
  }

  return {
    message: `Database successfully loaded with ${dataset.name} (${dataset.industry}).`,
    activeDataset: dataset.id,
    datasetName: dataset.name,
    industry: dataset.industry,
    badge: dataset.badge,
    employeesCount: dataset.employees.length,
    projectsCount: dataset.projects.length,
    assignmentsCount: dataset.assignments.length,
    coursesCount: dataset.courses.length,
  };
}
