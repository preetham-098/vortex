import { NextResponse } from 'next/server';
import { calculateWSGA } from '@/lib/algorithms/wsga';
import { dbService } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { WSGAInputSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const validated = WSGAInputSchema.parse(body);

    const availableCourses = await dbService.getCourses(auth!.organizationId);
    const result = calculateWSGA(validated, availableCourses);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input for WSGA', issues: error.issues }, { status: 400 });
    }
    console.error('POST /api/algorithms/skill-gap error:', error);
    return NextResponse.json({ error: 'Failed to compute skill gap analysis', details: String(error) }, { status: 500 });
  }
}
