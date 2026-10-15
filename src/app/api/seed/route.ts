import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db/seedService';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { SYNTHETIC_DATASETS } from '@/lib/db/syntheticDatasets';

export async function GET(request: Request) {
  try {
    const list = Object.values(SYNTHETIC_DATASETS).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      industry: d.industry,
      badge: d.badge,
      employeeCount: d.employees.length,
      projectCount: d.projects.length,
    }));
    return NextResponse.json({ datasets: list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve datasets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';
    const datasetParam = url.searchParams.get('dataset') || 'enterprise_tech';

    const result = await seedDatabase(
      auth?.organizationId || 'org_amc_default',
      force,
      datasetParam
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Seed API error:', error);
    return NextResponse.json({ error: 'Failed to seed database', details: String(error) }, { status: 500 });
  }
}
