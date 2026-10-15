import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { AssignmentSchema } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function GET(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const employeeId = searchParams.get('employeeId') || undefined;
    const status = searchParams.get('status') || undefined;

    const list = await dbService.getAssignments(auth!.organizationId, { projectId, employeeId, status });
    return NextResponse.json(list);
  } catch (error) {
    console.error('GET /api/assignments error:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const body = await request.json();

    // Check if batch assignment or single
    if (Array.isArray(body)) {
      const savedList = [];
      for (const item of body) {
        const validated = AssignmentSchema.parse({
          ...item,
          organizationId: auth!.organizationId,
          assignmentId: item.assignmentId || `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        });
        const saved = await dbService.saveAssignment(auth!.organizationId, validated);
        savedList.push(saved);
      }
      return NextResponse.json(savedList, { status: 201 });
    }

    const validated = AssignmentSchema.parse({
      ...body,
      organizationId: auth!.organizationId,
      assignmentId: body.assignmentId || `asg_${Date.now()}`,
    });

    const saved = await dbService.saveAssignment(auth!.organizationId, validated);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', issues: error.issues }, { status: 400 });
    }
    console.error('POST /api/assignments error:', error);
    return NextResponse.json({ error: 'Failed to create assignment', details: String(error) }, { status: 500 });
  }
}
