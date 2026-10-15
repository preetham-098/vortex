import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { TrainingCourseSchema } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function GET(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(request.url);
    const skill = searchParams.get('skill') || undefined;

    const courses = await dbService.getCourses(auth!.organizationId, skill);
    return NextResponse.json(courses);
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED' || error?.message?.includes('bail out of prerendering')) {
      throw error;
    }
    console.error('GET /api/courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const validated = TrainingCourseSchema.parse({
      ...body,
      organizationId: auth!.organizationId,
      courseId: body.courseId || `crs_${Date.now()}`,
    });

    const saved = await dbService.saveCourse(auth!.organizationId, validated);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', issues: error.issues }, { status: 400 });
    }
    console.error('POST /api/courses error:', error);
    return NextResponse.json({ error: 'Failed to save course', details: String(error) }, { status: 500 });
  }
}
