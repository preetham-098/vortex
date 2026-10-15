import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { ProjectSchema } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { seedDatabase } from '@/lib/db/seedService';

export async function GET(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const orgId = auth!.organizationId;

    let projects = await dbService.getProjects(orgId);
    if (projects.length === 0) {
      await seedDatabase(orgId);
      projects = await dbService.getProjects(orgId);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let filtered = [...projects];
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    if (priority) {
      filtered = filtered.filter(p => p.priority === priority);
    }

    // Attach active assigned hours and team size
    const allAssignments = await dbService.getAssignments(orgId, { status: 'active' });
    const enriched = filtered.map(proj => {
      const projAssignments = allAssignments.filter(a => a.projectId === proj.projectId);
      const allocatedHours = projAssignments.reduce((sum, a) => sum + (Number(a.allocationHours) || 0), 0);
      return {
        ...proj,
        allocatedHours,
        assignedMemberCount: projAssignments.length,
        capacityFulfillmentPercentage: proj.requiredCapacityHours > 0
          ? Math.round((allocatedHours / proj.requiredCapacityHours) * 100)
          : 0,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const validated = ProjectSchema.parse({
      ...body,
      organizationId: auth!.organizationId,
      projectId: body.projectId || `proj_${Date.now()}`,
    });

    const saved = await dbService.saveProject(auth!.organizationId, validated);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', issues: error.issues }, { status: 400 });
    }
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to create project', details: String(error) }, { status: 500 });
  }
}
