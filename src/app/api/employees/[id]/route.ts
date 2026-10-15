import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { EmployeeSchema } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const emp = await dbService.getEmployee(auth!.organizationId, id);
    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const assignments = await dbService.getAssignments(auth!.organizationId, { employeeId: id, status: 'active' });
    const activeWorkloadHours = assignments.reduce((sum, a) => sum + (Number(a.allocationHours) || 0), 0);

    return NextResponse.json({
      ...emp,
      activeWorkloadHours,
      remainingCapacityHours: emp.totalCapacityHours - activeWorkloadHours,
      assignments,
    });
  } catch (error) {
    console.error('GET /api/employees/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch employee', details: String(error) }, { status: 500 });
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

    const existing = await dbService.getEmployee(auth!.organizationId, id);
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = EmployeeSchema.parse({
      ...existing,
      ...body,
      employeeId: id,
      organizationId: auth!.organizationId,
    });

    const updated = await dbService.saveEmployee(auth!.organizationId, validated);
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', issues: error.issues }, { status: 400 });
    }
    console.error('PUT /api/employees/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update employee', details: String(error) }, { status: 500 });
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

    const success = await dbService.deleteEmployee(auth!.organizationId, id);
    if (!success) {
      return NextResponse.json({ error: 'Employee not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Employee ${id} deleted` });
  } catch (error) {
    console.error('DELETE /api/employees/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete employee', details: String(error) }, { status: 500 });
  }
}
