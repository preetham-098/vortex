import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { EmployeeSchema } from '@/lib/validation/schemas';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { seedDatabase } from '@/lib/db/seedService';

export async function GET(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const orgId = auth!.organizationId;

    // Auto-seed if first time running locally
    let employees = await dbService.getEmployees(orgId);
    if (employees.length === 0) {
      await seedDatabase(orgId);
      employees = await dbService.getEmployees(orgId);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const department = searchParams.get('department');
    const skill = searchParams.get('skill')?.toLowerCase();
    const status = searchParams.get('status');

    let filtered = [...employees];

    if (search) {
      filtered = filtered.filter(
        e => e.name.toLowerCase().includes(search) ||
             e.designation.toLowerCase().includes(search) ||
             e.department.toLowerCase().includes(search)
      );
    }

    if (department) {
      filtered = filtered.filter(e => e.department.toLowerCase() === department.toLowerCase());
    }

    if (skill) {
      filtered = filtered.filter(e =>
        e.skills.some(s => s.toLowerCase() === skill) ||
        Object.keys(e.skillProficiency).some(k => k.toLowerCase() === skill)
      );
    }

    if (status) {
      filtered = filtered.filter(e => e.availabilityStatus === status);
    }

    // Attach active workload hours from assignments dynamically to ensure consistency
    const activeAssignments = await dbService.getAssignments(orgId, { status: 'active' });
    const enriched = filtered.map(emp => {
      const empAssignments = activeAssignments.filter(a => a.employeeId === emp.employeeId);
      const activeWorkloadHours = empAssignments.reduce((sum, a) => sum + (Number(a.allocationHours) || 0), 0);
      const remainingCapacity = emp.totalCapacityHours - activeWorkloadHours;
      return {
        ...emp,
        activeWorkloadHours,
        remainingCapacityHours: remainingCapacity,
        activeAssignmentCount: empAssignments.length,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('GET /api/employees error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const validated = EmployeeSchema.parse({
      ...body,
      organizationId: auth!.organizationId,
      employeeId: body.employeeId || `emp_${Date.now()}`,
    });

    const saved = await dbService.saveEmployee(auth!.organizationId, validated);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', issues: error.issues }, { status: 400 });
    }
    console.error('POST /api/employees error:', error);
    return NextResponse.json({ error: 'Failed to create employee', details: String(error) }, { status: 500 });
  }
}
