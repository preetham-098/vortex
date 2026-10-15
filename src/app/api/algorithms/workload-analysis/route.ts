import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { calculateWorkloadMetrics } from '@/lib/algorithms/workload';
import { authenticateRequest } from '@/lib/auth/serverAuth';

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const orgId = auth!.organizationId;
    const body = await request.json().catch(() => ({}));
    const reportingPeriod = body.period || 'Current Cycle';

    const employees = await dbService.getEmployees(orgId);
    const assignments = await dbService.getAssignments(orgId);

    const report = calculateWorkloadMetrics(employees, assignments, reportingPeriod);
    return NextResponse.json(report);
  } catch (error) {
    console.error('POST /api/algorithms/workload-analysis error:', error);
    return NextResponse.json({ error: 'Failed to compute workload analysis', details: String(error) }, { status: 500 });
  }
}
