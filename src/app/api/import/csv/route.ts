import { NextResponse } from 'next/server';
import { dbService } from '@/lib/db/store';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { Employee, Project } from '@/types';

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await authenticateRequest(request, ['manager', 'admin']);
    if (errorResponse) return errorResponse;

    const orgId = auth!.organizationId;
    const body = await request.json();
    const { type = 'employees', csvText, commit = false } = body;

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: 'Valid CSV text is required' }, { status: 400 });
    }

    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must contain at least a header row and one data row' }, { status: 400 });
    }

    const rawHeaders = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = [];
    const validEntities: any[] = [];

    if (type === 'employees') {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = parseCSVLine(line);
        const rowErrors: string[] = [];

        const getCol = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            const idx = rawHeaders.indexOf(name);
            if (idx !== -1 && values[idx] !== undefined) return values[idx];
          }
          return '';
        };

        const name = getCol(['name', 'fullname', 'employeename']);
        const department = getCol(['department', 'dept']) || 'Engineering';
        const designation = getCol(['designation', 'role', 'title']) || 'Staff Engineer';
        const expStr = getCol(['experienceyears', 'experience', 'expyears']) || '3';
        const skillsStr = getCol(['skills', 'skillproficiency', 'competencies']);
        const capStr = getCol(['capacityhours', 'capacity', 'totalcapacityhours']) || '40';
        const perfStr = getCol(['performance', 'historicalperformance']);

        if (!name) rowErrors.push('Employee name is missing');

        const experienceYears = parseFloat(expStr);
        if (isNaN(experienceYears) || experienceYears < 0) {
          rowErrors.push(`Invalid experience years: "${expStr}"`);
        }

        const totalCapacityHours = parseFloat(capStr);
        if (isNaN(totalCapacityHours) || totalCapacityHours <= 0) {
          rowErrors.push(`Invalid capacity hours: "${capStr}" (must be > 0)`);
        }

        const skillProficiency: Record<string, number> = {};
        const skillsList: string[] = [];

        if (!skillsStr) {
          rowErrors.push('Skills column is missing or empty');
        } else {
          // Parse skills format: e.g. "React: 4, TypeScript: 5" or "Python; Docker; SQL"
          const delimiter = skillsStr.includes(';') ? ';' : ',';
          skillsStr.split(delimiter).forEach(part => {
            const trimmed = part.trim();
            if (!trimmed) return;
            if (trimmed.includes(':')) {
              const [sName, sLvl] = trimmed.split(':');
              const lvl = parseInt(sLvl.trim(), 10);
              if (isNaN(lvl) || lvl < 1 || lvl > 5) {
                rowErrors.push(`Skill "${sName.trim()}" has invalid level "${sLvl.trim()}" (must be 1 to 5)`);
              } else {
                skillProficiency[sName.trim()] = lvl;
                skillsList.push(sName.trim());
              }
            } else {
              skillProficiency[trimmed] = 3;
              skillsList.push(trimmed);
            }
          });
        }

        let historicalPerformance: number | undefined = undefined;
        if (perfStr) {
          const perf = parseFloat(perfStr);
          if (!isNaN(perf) && perf >= 0 && perf <= 100) {
            historicalPerformance = perf;
          }
        }

        const isValid = rowErrors.length === 0;

        const employeeObj: Employee = {
          employeeId: `emp_csv_${Date.now()}_${i}`,
          organizationId: orgId,
          name,
          department,
          designation,
          experienceYears: isNaN(experienceYears) ? 0 : experienceYears,
          skills: skillsList,
          skillProficiency,
          totalCapacityHours: isNaN(totalCapacityHours) ? 40 : totalCapacityHours,
          availabilityStatus: 'available',
          historicalPerformance,
        };

        if (isValid) {
          validEntities.push(employeeObj);
        }

        rows.push({
          rowNumber: i,
          isValid,
          errors: rowErrors,
          preview: {
            name,
            department,
            designation,
            experience: `${experienceYears || 0} yrs`,
            skills: Object.entries(skillProficiency).map(([k, v]) => `${k} (lv${v})`).join(', '),
            capacity: `${totalCapacityHours || 40}h`,
          },
          entity: employeeObj,
        });
      }
    } else if (type === 'projects') {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = parseCSVLine(line);
        const rowErrors: string[] = [];

        const getCol = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            const idx = rawHeaders.indexOf(name);
            if (idx !== -1 && values[idx] !== undefined) return values[idx];
          }
          return '';
        };

        const name = getCol(['name', 'projectname', 'title']);
        const description = getCol(['description', 'desc']) || '';
        const skillsStr = getCol(['requiredskills', 'skills']);
        const mandatoryStr = getCol(['mandatoryskills', 'mandatory']);
        const teamSizeStr = getCol(['teamsize', 'team']) || '2';
        const capacityStr = getCol(['requiredcapacityhours', 'capacityhours', 'capacity']) || '40';
        const minExpStr = getCol(['minexperienceyears', 'minexp', 'experience']) || '2';
        const priority = (getCol(['priority']) || 'medium').toLowerCase();

        if (!name) rowErrors.push('Project name is missing');

        const teamSize = parseInt(teamSizeStr, 10);
        if (isNaN(teamSize) || teamSize < 1) rowErrors.push(`Invalid team size: "${teamSizeStr}"`);

        const requiredCapacityHours = parseFloat(capacityStr);
        if (isNaN(requiredCapacityHours) || requiredCapacityHours <= 0) {
          rowErrors.push(`Invalid required capacity: "${capacityStr}"`);
        }

        const skillProficiency: Record<string, number> = {};
        const requiredSkills: string[] = [];

        if (!skillsStr) {
          rowErrors.push('Required skills column is missing');
        } else {
          skillsStr.split(',').forEach(part => {
            const trimmed = part.trim();
            if (!trimmed) return;
            if (trimmed.includes(':')) {
              const [sName, sLvl] = trimmed.split(':');
              const lvl = parseInt(sLvl.trim(), 10);
              if (isNaN(lvl) || lvl < 1 || lvl > 5) {
                rowErrors.push(`Skill "${sName.trim()}" has invalid level "${sLvl.trim()}"`);
              } else {
                skillProficiency[sName.trim()] = lvl;
                requiredSkills.push(sName.trim());
              }
            } else {
              skillProficiency[trimmed] = 3;
              requiredSkills.push(trimmed);
            }
          });
        }

        const mandatorySkills = mandatoryStr
          ? mandatoryStr.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        const isValid = rowErrors.length === 0;

        const projectObj: Project = {
          projectId: `proj_csv_${Date.now()}_${i}`,
          organizationId: orgId,
          name,
          description,
          requiredSkills,
          skillProficiency,
          mandatorySkills,
          teamSize: isNaN(teamSize) ? 2 : teamSize,
          requiredCapacityHours: isNaN(requiredCapacityHours) ? 40 : requiredCapacityHours,
          minimumExperienceYears: parseFloat(minExpStr) || 0,
          priority: ['low', 'medium', 'high', 'critical'].includes(priority) ? (priority as any) : 'medium',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          status: 'planning',
          tasks: [],
        };

        if (isValid) {
          validEntities.push(projectObj);
        }

        rows.push({
          rowNumber: i,
          isValid,
          errors: rowErrors,
          preview: {
            name,
            teamSize: `${teamSize || 2} seats`,
            requiredCapacity: `${requiredCapacityHours || 40}h`,
            skills: Object.entries(skillProficiency).map(([k, v]) => `${k} (lv${v})`).join(', '),
            mandatory: mandatorySkills.join(', ') || 'None',
          },
          entity: projectObj,
        });
      }
    }

    // If commit is requested, save all valid records into the active database
    let committedCount = 0;
    if (commit && validEntities.length > 0) {
      if (type === 'employees') {
        for (const emp of validEntities) {
          await dbService.saveEmployee(orgId, emp);
          committedCount++;
        }
      } else if (type === 'projects') {
        for (const proj of validEntities) {
          await dbService.saveProject(orgId, proj);
          committedCount++;
        }
      }
    }

    return NextResponse.json({
      type,
      totalRows: rows.length,
      validCount: validEntities.length,
      errorCount: rows.length - validEntities.length,
      committed: commit,
      committedCount,
      rows,
    });
  } catch (error) {
    console.error('CSV Import Error:', error);
    return NextResponse.json({ error: 'Failed to process CSV file', details: String(error) }, { status: 500 });
  }
}
