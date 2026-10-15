import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin', 'employee']);
    if (errorResponse) return errorResponse;

    const orgId = auth!.organizationId;
    const body = await request.json();
    const { employeeId, customFeatures } = body;

    // Check if model metadata exists
    const metadataPath = path.join(process.cwd(), 'ml_service', 'models', 'model_metadata.json');
    let metadata: any = null;
    if (fs.existsSync(metadataPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } catch (e) {
        console.warn('Could not parse model metadata:', e);
      }
    }

    if (!metadata) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Random Forest model artifact not found. Please run python ml_service/train.py first.',
        predicted_workload_hours: null,
        confidence_interval: null,
        model_version: null,
      });
    }

    // Build features for employee
    let features = customFeatures;
    let employeeName = 'Custom Candidate';

    if (employeeId) {
      const emp = await dbService.getEmployee(orgId, employeeId);
      if (!emp) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      employeeName = emp.name;

      const assignments = await dbService.getAssignments(orgId, { employeeId, status: 'active' });
      const currentWorkload = assignments.reduce((sum, a) => sum + (Number(a.allocationHours) || 0), 0);
      const capacity = emp.totalCapacityHours || 40;
      const utilization = (currentWorkload / capacity) * 100;

      features = {
        previous_workload_hours: currentWorkload,
        historical_utilization: utilization,
        active_assignment_count: assignments.length,
        planned_project_hours: Math.max(0, capacity - currentWorkload) * 0.5,
        upcoming_deadlines_count: 1,
        department: emp.department,
        experience_years: emp.experienceYears,
        workload_trend: 1.5,
      };
    }

    if (!features) {
      return NextResponse.json({ error: 'Either employeeId or customFeatures must be provided' }, { status: 400 });
    }

    // Invoke Python predict script via child_process
    const predictScript = path.join(process.cwd(), 'ml_service', 'predict.py');

    const result = await new Promise((resolve) => {
      const py = spawn('python', [predictScript, JSON.stringify(features)]);
      let stdout = '';
      let stderr = '';

      py.stdout.on('data', (d) => { stdout += d.toString(); });
      py.stderr.on('data', (d) => { stderr += d.toString(); });

      py.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            resolve({ error: 'Failed to parse ML response', details: stdout });
          }
        } else {
          resolve({ error: 'Python ML service execution failed', details: stderr });
        }
      });
    });

    return NextResponse.json({
      employeeId,
      employeeName,
      inputFeatures: features,
      prediction: result,
    });
  } catch (error) {
    console.error('POST /api/algorithms/workload-prediction error:', error);
    return NextResponse.json({ error: 'Failed to process workload prediction', details: String(error) }, { status: 500 });
  }
}
