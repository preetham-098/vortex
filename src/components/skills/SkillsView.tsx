'use client';

import React, { useState } from 'react';
import { Employee } from '@/types';
import { Badge } from '../ui/Badge';
import { Search, Filter, Layers, UserCheck } from 'lucide-react';

export interface SkillsViewProps {
  employees: Employee[];
  onSelectEmployee?: (emp: Employee) => void;
}

export const SkillsView: React.FC<SkillsViewProps> = ({ employees, onSelectEmployee }) => {
  const [selectedDept, setSelectedDept] = useState('all');
  const [search, setSearch] = useState('');

  // Extract all distinct skills across employees
  const allSkills = Array.from(
    new Set(employees.flatMap((e) => Object.keys(e.skillProficiency)))
  ).sort();

  const departments = ['all', ...Array.from(new Set(employees.map((e) => e.department)))];

  const filteredEmployees = employees.filter((e) => {
    const matchesDept = selectedDept === 'all' || e.department === selectedDept;
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const getProficiencyStyle = (level: number) => {
    switch (level) {
      case 5:
        return 'bg-[#ff5500] text-white font-bold shadow-xs';
      case 4:
        return 'bg-[#ff5500]/80 text-white font-semibold';
      case 3:
        return 'bg-[#ff5500]/50 text-[var(--text-primary)] font-medium';
      case 2:
        return 'bg-[#ff5500]/25 text-[var(--text-secondary)]';
      case 1:
        return 'bg-[#ff5500]/10 text-[var(--text-tertiary)]';
      default:
        return 'bg-transparent text-[var(--border-subtle)]';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-micro text-[var(--accent)]">
              Talent Inventory
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Competency matrix & verification</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Skills & Proficiency Heatmap
          </h1>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-xs">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] mr-1">
            Proficiency Scale:
          </span>
          {[1, 2, 3, 4, 5].map((lvl) => (
            <div key={lvl} className="flex items-center gap-1">
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono ${getProficiencyStyle(
                  lvl
                )}`}
              >
                {lvl}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)] hidden sm:inline">
                {lvl === 1 ? 'Novice' : lvl === 5 ? 'Master' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-dark p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[var(--text-secondary)] font-medium">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d} value={d} className="bg-[var(--bg-surface)]">
                  {d === 'all' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees or roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] w-64"
          />
        </div>
      </div>

      {/* Interactive Matrix Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] uppercase text-[10px] tracking-wider border-b border-[var(--border-subtle)]">
              <tr>
                <th className="py-3 px-4 sticky left-0 bg-[var(--bg-surface-secondary)] z-10 w-52 min-w-[200px]">
                  Employee
                </th>
                <th className="py-3 px-3">Department</th>
                {allSkills.map((s) => (
                  <th key={s} className="py-3 px-2 text-center min-w-[70px]">
                    <span className="truncate max-w-[80px] block mx-auto" title={s}>
                      {s}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.employeeId}
                  onClick={() => onSelectEmployee && onSelectEmployee(emp)}
                  className="hover:bg-[var(--bg-surface-secondary)]/60 transition cursor-pointer group"
                >
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)] sticky left-0 bg-[var(--bg-surface)] group-hover:bg-[var(--bg-surface-secondary)]/60 z-10 transition">
                    <div className="truncate">{emp.name}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)] font-normal truncate">
                      {emp.designation}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
                    {emp.department}
                  </td>
                  {allSkills.map((s) => {
                    const level = emp.skillProficiency[s] || 0;
                    return (
                      <td key={s} className="py-3 px-2 text-center">
                        {level > 0 ? (
                          <span
                            className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-mono text-[11px] font-bold ${getProficiencyStyle(
                              level
                            )}`}
                          >
                            {level}
                          </span>
                        ) : (
                          <span className="text-[var(--border-strong)] opacity-40 font-mono text-xs">
                            ·
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
