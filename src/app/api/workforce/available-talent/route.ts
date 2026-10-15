import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { identifyAvailableTalent } from '@/lib/algorithms/talent';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function GET(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const requirePositiveCapacity = searchParams.get('requirePositiveCapacity') === 'true';

    const orgId = auth!.organizationId;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId parameter is required' }, { status: 400 });
    }

    const project = await dbService.getProject(orgId, projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const employees = await dbService.getEmployees(orgId);
    const assignments = await dbService.getAssignments(orgId, { status: 'active' });

    const workloadMap: Record<string, number> = {};
    for (const a of assignments) {
      workloadMap[a.employeeId] = (workloadMap[a.employeeId] || 0) + (Number(a.allocationHours) || 0);
    }

    const talentRankings = identifyAvailableTalent(employees, project, workloadMap, {
      requirePositiveCapacity,
    });

    return NextResponse.json({
      projectId,
      projectName: project.name,
      totalEvaluated: talentRankings.length,
      availableCount: talentRankings.filter(t => t.availableHours > 0).length,
      talentRankings,
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED' || error?.message?.includes('bail out of prerendering')) {
      throw error;
    }
    console.error('GET /api/workforce/available-talent error:', error);
    return NextResponse.json({ error: 'Failed to identify available talent', details: String(error) }, { status: 500 });
  }
}
