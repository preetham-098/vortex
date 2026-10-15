import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { rankEmployeesForProject, matchEmployeeToProject } from '@/lib/algorithms/matching';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { projectId, employeeId, weights, performanceFallback, strictCapacityCheck } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const orgId = auth!.organizationId;
    const project = await dbService.getProject(orgId, projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const assignments = await dbService.getAssignments(orgId, { status: 'active' });
    const workloadMap: Record<string, number> = {};
    for (const a of assignments) {
      workloadMap[a.employeeId] = (workloadMap[a.employeeId] || 0) + (Number(a.allocationHours) || 0);
    }

    // Single employee evaluation
    if (employeeId) {
      const emp = await dbService.getEmployee(orgId, employeeId);
      if (!emp) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      const match = matchEmployeeToProject(emp, project, workloadMap[employeeId] || 0, {
        weights,
        performanceFallback,
        strictCapacityCheck,
      });
      return NextResponse.json(match);
    }

    // Rank all employees in organization
    const employees = await dbService.getEmployees(orgId);
    const rankings = rankEmployeesForProject(employees, project, workloadMap, {
      weights,
      performanceFallback,
      strictCapacityCheck,
    });

    return NextResponse.json({
      projectId,
      projectName: project.name,
      totalCandidates: rankings.length,
      eligibleCandidates: rankings.filter(r => r.isEligible).length,
      rankings,
    });
  } catch (error) {
    console.error('POST /api/algorithms/match error:', error);
    return NextResponse.json({ error: 'Failed to compute matching scores', details: String(error) }, { status: 500 });
  }
}
