'use client';

import React, { useState } from 'react';
import { Employee, AvailabilityStatus } from '@/types';
import { Users, Search, Plus, Trash2, Edit, Check, X, AlertCircle, Filter, Sparkles } from 'lucide-react';

interface EmployeeManagementViewProps {
  employees: Employee[];
  onEmployeeCreatedOrUpdated: () => void;
}

export default function EmployeeManagementView({
  employees,
  onEmployeeCreatedOrUpdated,
}: EmployeeManagementViewProps) {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('Engineering');
  const [formDesignation, setFormDesignation] = useState('');
  const [formExp, setFormExp] = useState('4');
  const [formSkills, setFormSkills] = useState('React: 4, TypeScript: 4, Node.js: 3');
  const [formCapacity, setFormCapacity] = useState('40');
  const [formStatus, setFormStatus] = useState<AvailabilityStatus>('available');
  const [formPerformance, setFormPerformance] = useState('88');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const departments = Array.from(new Set(employees.map(e => e.department)));

  const filtered = employees.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase()) ||
      e.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = selectedDept === 'all' || e.department === selectedDept;
    const matchesStatus = selectedStatus === 'all' || e.availabilityStatus === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const openAddModal = () => {
    setEditingEmp(null);
    setFormName('');
    setFormDept('Engineering');
    setFormDesignation('');
    setFormExp('4');
    setFormSkills('React: 4, TypeScript: 4, Node.js: 3');
    setFormCapacity('40');
    setFormStatus('available');
    setFormPerformance('88');
    setFormError(null);
    setShowAddModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setFormName(emp.name);
    setFormDept(emp.department);
    setFormDesignation(emp.designation);
    setFormExp(emp.experienceYears.toString());
    const skillsString = Object.entries(emp.skillProficiency)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    setFormSkills(skillsString);
    setFormCapacity(emp.totalCapacityHours.toString());
    setFormStatus(emp.availabilityStatus);
    setFormPerformance(emp.historicalPerformance ? emp.historicalPerformance.toString() : '85');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const skillProficiency: Record<string, number> = {};
      const skillList: string[] = [];

      formSkills.split(',').forEach(item => {
        const parts = item.split(':');
        if (parts.length >= 2) {
          const sName = parts[0].trim();
          const sLevel = parseInt(parts[1].trim(), 10);
          if (sName && !isNaN(sLevel)) {
            const clamped = Math.max(1, Math.min(5, sLevel));
            skillProficiency[sName] = clamped;
            skillList.push(sName);
          }
        } else if (parts[0].trim()) {
          const sName = parts[0].trim();
          skillProficiency[sName] = 3;
          skillList.push(sName);
        }
      });

      if (skillList.length === 0) {
        throw new Error('Please specify at least one skill and proficiency (e.g. React: 4).');
      }

      const payload = {
        name: formName,
        department: formDept,
        designation: formDesignation,
        experienceYears: parseFloat(formExp) || 0,
        skills: skillList,
        skillProficiency,
        totalCapacityHours: parseFloat(formCapacity) || 40,
        availabilityStatus: formStatus,
        historicalPerformance: formPerformance ? parseFloat(formPerformance) : undefined,
      };

      const url = editingEmp ? `/api/employees/${editingEmp.employeeId}` : '/api/employees';
      const method = editingEmp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save employee profile');
      }

      setShowAddModal(false);
      onEmployeeCreatedOrUpdated();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee record?')) return;
    try {
      await fetch(`/api/employees/${employeeId}`, { method: 'DELETE' });
      onEmployeeCreatedOrUpdated();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const statusBadge = (status: AvailabilityStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'partially_allocated':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800';
      case 'fully_allocated':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'unavailable':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            Workforce Employee Roster
          </h2>
          <p className="text-xs text-slate-400">
            Maintain verified employee skills, experience, and weekly working capacities ({employees.length} active).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search name, role, skill..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none w-48"
            />
          </div>

          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="partially_allocated">Partially Allocated</option>
            <option value="fully_allocated">Fully Allocated</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No employees match your search or filter</p>
            <p className="text-xs text-slate-500">Try adjusting your query, or click Add Employee / Import CSV to add staff.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Experience</th>
                  <th className="py-3 px-3">Competencies & Levels (1-5)</th>
                  <th className="py-3 px-3">Capacity & Status</th>
                  <th className="py-3 px-3">Rating</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{emp.name}</div>
                      <div className="text-[11px] text-slate-400">{emp.designation}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{emp.department}</td>
                    <td className="py-3.5 px-3 font-mono">{emp.experienceYears} yrs</td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {Object.entries(emp.skillProficiency).map(([s, lvl]) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1"
                          >
                            <span>{s}</span>
                            <span className="font-bold text-cyan-400">{lvl}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-mono text-white font-semibold">{emp.totalCapacityHours}h/wk</div>
                      <span className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-medium border ${statusBadge(emp.availabilityStatus)}`}>
                        {emp.availabilityStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono">
                      {emp.historicalPerformance ? (
                        <span className="text-emerald-400 font-semibold">{emp.historicalPerformance}/100</span>
                      ) : (
                        <span className="text-slate-500 italic">Fallback (75)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                          title="Edit profile"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.employeeId)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          title="Delete employee"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingEmp ? 'Edit Employee Profile' : 'Add New Employee'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-2.5 rounded text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formDept}
                    onChange={e => setFormDept(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={formDesignation}
                    onChange={e => setFormDesignation(e.target.value)}
                    placeholder="e.g. Senior Frontend Dev"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formExp}
                    onChange={e => setFormExp(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Weekly Capacity (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    required
                    value={formCapacity}
                    onChange={e => setFormCapacity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Availability Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as AvailabilityStatus)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="partially_allocated">Partially Allocated</option>
                    <option value="fully_allocated">Fully Allocated</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Historical Performance (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formPerformance}
                    onChange={e => setFormPerformance(e.target.value)}
                    placeholder="e.g. 90"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  Skills & Proficiency Levels (1 to 5, comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={formSkills}
                  onChange={e => setFormSkills(e.target.value)}
                  placeholder="e.g. React: 4, TypeScript: 5, Next.js: 4"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Example: <code>Python: 4, PyTorch: 3, Docker: 4</code>
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-sm transition"
                >
                  {saving ? 'Saving...' : editingEmp ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
