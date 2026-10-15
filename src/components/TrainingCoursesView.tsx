'use client';

import React, { useState, useEffect } from 'react';
import { TrainingCourse } from '@/types';
import { BookOpen, ExternalLink, Plus, Search, Clock, Award, X } from 'lucide-react';

export default function TrainingCoursesView() {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [skill, setSkill] = useState('');
  const [level, setLevel] = useState('4');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('16 hours');
  const [resourceURL, setResourceURL] = useState('https://');
  const [provider, setProvider] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCourses(data);
      }
    } catch (e) {
      console.error('Failed to fetch courses:', e);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const allSkills = Array.from(new Set(courses.map(c => c.skill)));

  const filtered = courses.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.skill.toLowerCase().includes(search.toLowerCase());
    const matchesSkill = selectedSkill === 'all' || c.skill.toLowerCase() === selectedSkill.toLowerCase();
    return matchesSearch && matchesSkill;
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          skill,
          proficiencyLevel: parseInt(level, 10) || 3,
          description,
          estimatedDuration: duration,
          resourceURL,
          provider: provider || 'Internal Training',
        }),
      });
      if (res.ok) {
        setShowModal(false);
        fetchCourses();
      }
    } catch (err) {
      console.error('Course creation error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            Training & Upskilling Catalog
          </h2>
          <p className="text-xs text-slate-400">
            Recommended courses matched to WSGA skill gaps and training priorities (TP_ij).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search courses, skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none w-56"
            />
          </div>

          <select
            value={selectedSkill}
            onChange={e => setSelectedSkill(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Skills</option>
            {allSkills.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Course
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Training Courses Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No courses match your search or filter. Click &ldquo;Add Course&rdquo; above to register new upskilling resources.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(course => (
            <div
              key={course.courseId}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {course.skill}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                    <Award className="h-3 w-3" /> Target Level {course.proficiencyLevel}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 leading-snug">{course.title}</h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{course.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {course.estimatedDuration}
                </span>
                <a
                  href={course.resourceURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium text-xs transition"
                >
                  Access Course
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Training Course</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Distributed PyTorch Architecture"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Skill Target</label>
                  <input
                    type="text"
                    required
                    value={skill}
                    onChange={e => setSkill(e.target.value)}
                    placeholder="e.g. PyTorch"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Target Proficiency</label>
                  <select
                    value={level}
                    onChange={e => setLevel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="1">Level 1 - Fundamental</option>
                    <option value="2">Level 2 - Working Knowledge</option>
                    <option value="3">Level 3 - Proficient</option>
                    <option value="4">Level 4 - Advanced</option>
                    <option value="5">Level 5 - Expert / Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Estimated Duration</label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="e.g. 20 hours"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Provider / Platform</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    placeholder="e.g. Coursera / Internal"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Resource URL</label>
                <input
                  type="url"
                  required
                  value={resourceURL}
                  onChange={e => setResourceURL(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-sm transition"
                >
                  {saving ? 'Adding...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
