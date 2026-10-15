import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { optimizeComplementaryTeam } from '@/lib/algorithms/teamOptimization';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const orgId = auth!.organizationId;
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

    const result = optimizeComplementaryTeam(employees, project, workloadMap);

    // Save recommendation to db
    const matchScores: Record<string, number> = {};
    result.selectedEmployees.forEach(e => {
      matchScores[e.employeeId] = e.individualScore;
    });

    await dbService.saveRecommendation(orgId, {
      recommendationId: `rec_${Date.now()}`,
      organizationId: orgId,
      projectId,
      employeeIds: result.selectedEmployees.map(e => e.employeeId),
      matchScores,
      teamCoverage: {
        coveredSkills: result.teamSkillCoverage.coveredSkills,
        missingSkills: result.teamSkillCoverage.missingSkills,
        coveragePercentage: result.teamSkillCoverage.coveragePercentage,
      },
      skillGaps: result.teamSkillCoverage.gaps.map(g => ({
        skill: g.skill,
        requiredLevel: g.required,
        highestTeamLevel: g.teamMax,
        gap: g.gap,
      })),
      algorithmVersion: 'team-opt-v1.0',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/algorithms/team-optimize error:', error);
    return NextResponse.json({ error: 'Failed to optimize team composition', details: String(error) }, { status: 500 });
  }
}
