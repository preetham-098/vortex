import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { optimizeTaskAllocation } from '@/lib/algorithms/taskAllocation';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const url = new URL(request.url);
    const commit = url.searchParams.get('commit') === 'true';

    const body = await request.json();
    const { projectId, tasks, alpha, beta, gamma, tau, approvedProposals } = body;

    const orgId = auth!.organizationId;

    // If manager is committing approved proposals
    if (commit && approvedProposals && Array.isArray(approvedProposals)) {
      const createdAssignments = [];
      for (const prop of approvedProposals) {
        if (prop.assignedEmployeeId && prop.feasibilityStatus === 'feasible') {
          const asg = await dbService.saveAssignment(orgId, {
            assignmentId: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            organizationId: orgId,
            employeeId: prop.assignedEmployeeId,
            projectId: projectId || 'proj_01',
            allocationHours: prop.effortHours,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            status: 'active',
            roleInProject: `Task: ${prop.taskTitle}`,
            notes: `Committed from manager-approved task allocation proposal (${prop.notes})`,
          });
          createdAssignments.push(asg);
        }
      }

      return NextResponse.json({
        message: `Successfully committed ${createdAssignments.length} approved assignment(s) to database.`,
        committedAssignments: createdAssignments,
      });
    }

    // Otherwise, generate optimization proposals
    let projectTasks = tasks;
    if (!projectTasks && projectId) {
      const project = await dbService.getProject(orgId, projectId);
      if (project?.tasks && project.tasks.length > 0) {
        projectTasks = project.tasks;
      }
    }

    if (!projectTasks || projectTasks.length === 0) {
      return NextResponse.json({ error: 'No tasks provided or found for optimization' }, { status: 400 });
    }

    const employees = await dbService.getEmployees(orgId);
    const assignments = await dbService.getAssignments(orgId, { status: 'active' });

    const workloadMap: Record<string, number> = {};
    for (const a of assignments) {
      workloadMap[a.employeeId] = (workloadMap[a.employeeId] || 0) + (Number(a.allocationHours) || 0);
    }

    const solverInput = {
      tasks: projectTasks.map((t: any) => ({
        taskId: t.taskId || `task_${Math.random()}`,
        title: t.title,
        effortHours: Number(t.effortHours) || 10,
        requiredSkill: t.requiredSkill,
        requiredProficiency: Number(t.requiredProficiency) || 3,
      })),
      employees: employees.map(e => ({
        employeeId: e.employeeId,
        name: e.name,
        capacityHours: e.totalCapacityHours,
        skills: e.skillProficiency,
        currentWorkloadHours: workloadMap[e.employeeId] || 0,
      })),
    };

    const result = optimizeTaskAllocation(solverInput, { alpha, beta, gamma, tau });
    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/algorithms/task-allocation error:', error);
    return NextResponse.json({ error: 'Failed to optimize task allocations', details: String(error) }, { status: 500 });
  }
}
