'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { WorkloadBalancingReport } from '@/types';

interface WorkloadChartsProps {
  report: WorkloadBalancingReport | null;
}

const DEPT_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

export default function WorkloadCharts({ report }: WorkloadChartsProps) {
  if (!report || !report.employeeMetrics.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No active workload data available.
      </div>
    );
  }

  // Bar chart data: Employee Workload vs Total Capacity
  const employeeData = report.employeeMetrics.map(emp => ({
    name: emp.employeeName.split(' ')[0], // First name for clean axis
    fullName: emp.employeeName,
    department: emp.department,
    workload: emp.assignedWorkloadHours,
    capacity: emp.availableWorkingHours,
    utilization: emp.utilizationPercentage,
    status: emp.status,
  }));

  // Pie chart data: Department distribution
  const deptData = Object.entries(report.departmentAggregates).map(([dept, data]) => ({
    name: dept,
    workload: data.totalWorkload,
    capacity: data.totalCapacity,
    utilization: data.utilization,
    employees: data.employeeCount,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* 1. Employee Workload Bar Chart */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Workload vs. Capacity Distribution</h3>
            <p className="text-xs text-slate-400">Hours allocated from active assignments (Algorithm 3)</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
            {report.period}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={employeeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-25} textAnchor="end" />
              <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                formatter={(value: any, name: any, item: any) => {
                  if (name === 'workload') return [`${value} hrs (${item.payload.utilization}%)`, 'Assigned Workload'];
                  if (name === 'capacity') return [`${value} hrs`, 'Total Capacity'];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar dataKey="workload" name="Assigned Workload" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" name="Max Capacity" fill="#475569" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Department Workload Share Pie Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Department Workload Split</h3>
          <p className="text-xs text-slate-400">Total hours consumed by operational team</p>
        </div>

        <div className="h-56 w-full my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deptData}
                dataKey="workload"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
              >
                {deptData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                formatter={(value: any, name: any, item: any) => [
                  `${value} hrs (${item.payload.utilization}% util, ${item.payload.employees} staff)`,
                  item.payload.name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend list */}
        <div className="space-y-1.5 text-xs">
          {deptData.map((dept, idx) => (
            <div key={dept.name} className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2 truncate">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: DEPT_COLORS[idx % DEPT_COLORS.length] }} />
                <span className="truncate">{dept.name}</span>
              </span>
              <span className="text-slate-400 font-mono shrink-0">{dept.workload}h ({dept.utilization}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
