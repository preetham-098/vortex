import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { AssignmentSchema } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const validated = AssignmentSchema.parse({
      ...body,
      assignmentId: id,
      organizationId: auth!.organizationId,
    });

    const updated = await dbService.saveAssignment(auth!.organizationId, validated);
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', issues: error.issues }, { status: 400 });
    }
    console.error('PUT /api/assignments/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update assignment', details: String(error) }, { status: 500 });
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

    const success = await dbService.deleteAssignment(auth!.organizationId, id);
    if (!success) {
      return NextResponse.json({ error: 'Assignment not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Assignment ${id} deleted` });
  } catch (error) {
    console.error('DELETE /api/assignments/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete assignment', details: String(error) }, { status: 500 });
  }
}
