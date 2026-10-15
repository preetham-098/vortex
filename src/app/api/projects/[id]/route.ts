import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { ProjectSchema } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const proj = await dbService.getProject(auth!.organizationId, id);
    if (!proj) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const assignments = await dbService.getAssignments(auth!.organizationId, { projectId: id });
    const employees = await dbService.getEmployees(auth!.organizationId);

    const teamMembers = assignments.map(a => {
      const emp = employees.find(e => e.employeeId === a.employeeId);
      return {
        ...a,
        employeeName: emp?.name || 'Unknown',
        designation: emp?.designation || '',
        department: emp?.department || '',
        skillProficiency: emp?.skillProficiency || {},
      };
    });

    const allocatedHours = assignments
      .filter(a => a.status === 'active')
      .reduce((sum, a) => sum + (Number(a.allocationHours) || 0), 0);

    return NextResponse.json({
      ...proj,
      allocatedHours,
      teamMembers,
      capacityFulfillmentPercentage: proj.requiredCapacityHours > 0
        ? Math.round((allocatedHours / proj.requiredCapacityHours) * 100)
        : 0,
    });
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch project', details: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const existing = await dbService.getProject(auth!.organizationId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = ProjectSchema.parse({
      ...existing,
      ...body,
      projectId: id,
      organizationId: auth!.organizationId,
    });

    const updated = await dbService.saveProject(auth!.organizationId, validated);
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', issues: error.issues }, { status: 400 });
    }
    console.error('PUT /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update project', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const success = await dbService.deleteProject(auth!.organizationId, id);
    if (!success) {
      return NextResponse.json({ error: 'Project not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Project ${id} deleted` });
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete project', details: String(error) }, { status: 500 });
  }
}
