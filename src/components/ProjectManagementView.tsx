'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import {
  Briefcase,
  Plus,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  X,
  ShieldAlert,
  Trash2,
  Edit,
} from 'lucide-react';

interface ProjectManagementViewProps {
  projects: Project[];
  onProjectCreatedOrUpdated: () => void;
}

export default function ProjectManagementView({
  projects,
  onProjectCreatedOrUpdated,
}: ProjectManagementViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('Python: 4, PyTorch: 4, Docker: 3');
  const [mandatoryInput, setMandatoryInput] = useState('Python, Docker');
  const [minExp, setMinExp] = useState('3');
  const [teamSize, setTeamSize] = useState('3');
  const [requiredCapacity, setRequiredCapacity] = useState('60');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2027-04-30');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setSkillsInput('Python: 4, PyTorch: 4, Docker: 3');
    setMandatoryInput('Python, Docker');
    setMinExp('3');
    setTeamSize('3');
    setRequiredCapacity('60');
    setPriority('high');
    setStartDate('2026-11-01');
    setEndDate('2027-04-30');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setName(proj.name);
    setDescription(proj.description || '');
    const skillsStr = Object.entries(proj.skillProficiency)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    setSkillsInput(skillsStr);
    setMandatoryInput(proj.mandatorySkills ? proj.mandatorySkills.join(', ') : '');
    setMinExp(proj.minimumExperienceYears.toString());
    setTeamSize(proj.teamSize.toString());
    setRequiredCapacity(proj.requiredCapacityHours.toString());
    setPriority(proj.priority);
    setStartDate(proj.startDate);
    setEndDate(proj.endDate);
    setError(null);
    setShowModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const skillProficiency: Record<string, number> = {};
      const requiredSkills: string[] = [];

      skillsInput.split(',').forEach(item => {
        const parts = item.split(':');
        if (parts.length >= 2) {
          const s = parts[0].trim();
          const lvl = parseInt(parts[1].trim(), 10);
          if (s && !isNaN(lvl)) {
            skillProficiency[s] = Math.max(1, Math.min(5, lvl));
            requiredSkills.push(s);
          }
        } else if (parts[0].trim()) {
          const s = parts[0].trim();
          skillProficiency[s] = 3;
          requiredSkills.push(s);
        }
      });

      if (requiredSkills.length === 0) {
        throw new Error('Please specify at least one required skill (e.g. Python: 4).');
      }

      const mandatorySkills = mandatoryInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        name,
        description,
        requiredSkills,
        skillProficiency,
        mandatorySkills,
        minimumExperienceYears: parseFloat(minExp) || 0,
        teamSize: parseInt(teamSize, 10) || 2,
        requiredCapacityHours: parseFloat(requiredCapacity) || 40,
        priority,
        startDate,
        endDate,
        status: editingProject ? editingProject.status : 'planning',
        tasks: editingProject?.tasks || [],
      };

      const url = editingProject ? `/api/projects/${editingProject.projectId}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save project');
      }

      setShowModal(false);
      onProjectCreatedOrUpdated();
    } catch (err: any) {
      setError(err.message || 'Error saving project');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      onProjectCreatedOrUpdated();
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  const priorityColors = {
    critical: 'bg-rose-950 text-rose-300 border-rose-800',
    high: 'bg-amber-950 text-amber-300 border-amber-800',
    medium: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    low: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-cyan-400" />
            Project Pipeline & Requirements
          </h2>
          <p className="text-xs text-slate-400">
            Define mandatory competencies, capacity thresholds, and team composition constraints ({projects.length} projects).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Create New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center space-y-3">
          <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No active projects found</p>
          <p className="text-xs text-slate-500">Create a project or import projects via CSV to start optimizing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(proj => (
            <div
              key={proj.projectId}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-white leading-snug">{proj.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${priorityColors[proj.priority]}`}>
                      {proj.priority}
                    </span>
                    <button
                      onClick={() => openEditModal(proj)}
                      className="p-1 text-slate-400 hover:text-cyan-400 transition"
                      title="Edit project"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(proj.projectId)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">{proj.description}</p>
                )}

                {/* Requirements summary */}
                <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Team Target:</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <Users className="h-3 w-3 text-cyan-400" /> {proj.teamSize} seats
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Required Capacity:</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-400" /> {proj.requiredCapacityHours} hrs
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Min Experience:</span>
                    <span className="font-semibold text-white">
                      {proj.minimumExperienceYears} yrs
                    </span>
                  </div>
                </div>

                {/* Competencies */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Required Competencies & Target Levels:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(proj.skillProficiency).map(([skill, lvl]) => {
                      const isMandatory = proj.mandatorySkills?.includes(skill);
                      return (
                        <span
                          key={skill}
                          className={`px-2 py-0.5 rounded text-[11px] border flex items-center gap-1.5 ${
                            isMandatory
                              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {isMandatory && <ShieldAlert className="h-3 w-3 text-rose-400" />}
                          <span>{skill}</span>
                          <strong className="text-cyan-400 font-mono">lv{lvl}</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {proj.startDate} &rarr; {proj.endDate}
                </span>
                <span className="capitalize font-medium text-slate-400">{proj.status.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProject ? 'Edit Project Requirements' : 'Create New Project Requirements'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-2.5 rounded text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Distributed Telemetry Pipeline"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Key architectural goals and deliverables..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  Required Competencies & Levels (1 to 5, comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={skillsInput}
                  onChange={e => setSkillsInput(e.target.value)}
                  placeholder="e.g. Go: 4, Kafka: 4, PostgreSQL: 3"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  Mandatory Skills (Hard constraints, comma separated)
                </label>
                <input
                  type="text"
                  value={mandatoryInput}
                  onChange={e => setMandatoryInput(e.target.value)}
                  placeholder="e.g. Go, Kafka"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Team Size</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={teamSize}
                    onChange={e => setTeamSize(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Effort (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={requiredCapacity}
                    onChange={e => setRequiredCapacity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Min Exp (Yrs)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minExp}
                    onChange={e => setMinExp(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-white shadow-sm transition"
                >
                  {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
