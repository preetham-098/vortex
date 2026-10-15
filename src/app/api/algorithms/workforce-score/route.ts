import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import {
  calculateWorkforceOptimizationScore,
  rankWorkforceScores,
} from '@/lib/algorithms/workforceScore';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const orgId = auth!.organizationId;
    const body = await request.json();
    const { projectId, employeeId, weights, projectedWorkloadHours, performanceFallback } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = await dbService.getProject(orgId, projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const assignments = await dbService.getAssignments(orgId, { status: 'active' });
    const workloadMap: Record<string, number> = {};
    for (const a of assignments) {
      workloadMap[a.employeeId] = (workloadMap[a.employeeId] || 0) + (Number(a.allocationHours) || 0);
    }

    if (employeeId) {
      const emp = await dbService.getEmployee(orgId, employeeId);
      if (!emp) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      const score = calculateWorkforceOptimizationScore(
        emp,
        project,
        workloadMap[employeeId] || 0,
        { weights, projectedWorkloadHours, performanceFallback }
      );
      return NextResponse.json(score);
    }

    const employees = await dbService.getEmployees(orgId);
    const rankings = rankWorkforceScores(employees, project, workloadMap, {
      weights,
      projectedWorkloadHours,
      performanceFallback,
    });

    return NextResponse.json({
      projectId,
      projectName: project.name,
      totalEvaluated: rankings.length,
      rankings,
    });
  } catch (error) {
    console.error('POST /api/algorithms/workforce-score error:', error);
    return NextResponse.json({ error: 'Failed to calculate workforce score', details: String(error) }, { status: 500 });
  }
}
