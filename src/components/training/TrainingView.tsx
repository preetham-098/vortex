'use client';

import React, { useState, useEffect } from 'react';
import { TrainingCourse, Project, Employee } from '@/types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  GraduationCap,
  Clock,
  BookOpen,
  ExternalLink,
  Plus,
  Search,
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export interface TrainingViewProps {
  projects?: Project[];
  employees?: Employee[];
}

export const TrainingView: React.FC<TrainingViewProps> = ({ projects = [], employees = [] }) => {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [enrolledCourseMap, setEnrolledCourseMap] = useState<Record<string, boolean>>({});

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

  const allSkills = Array.from(new Set(courses.map((c) => c.skill)));

  const filtered = courses.filter((c) => {
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
          provider: provider || 'Internal Engineering Curriculum',
        }),
      });
      if (res.ok) {
        setShowModal(false);
        fetchCourses();
        setTitle('');
        setSkill('');
        setDescription('');
      }
    } catch (err) {
      console.error('Course creation error:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleEnrollment = (courseId: string) => {
    setEnrolledCourseMap((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-micro text-[var(--status-warning)]">
              Upskilling Intelligence
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Skill gap mitigation & targeted curricula</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Recommended Training & Upskilling Catalog
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Featured Strategic Gap Alert */}
      <div className="p-5 rounded-2xl bg-[var(--status-warning-bg)] border border-[var(--status-warning)]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[var(--status-warning)]/20 text-[var(--status-warning)] shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--status-warning)] uppercase tracking-wider">
                Strategic Remediation Pathway
              </span>
              <Badge variant="warning" size="sm">
                Priority
              </Badge>
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
              Targeted Competency Upskilling Active
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Curricula are prioritized using Training Priority TP_ij = Gap_ij * PriorityWeight_j to eliminate WSGA bottlenecks.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-[var(--status-warning)] px-3 py-1.5 rounded-xl bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30">
          {courses.length} Active Courses
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="card-dark p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[var(--text-secondary)] font-medium">Competency:</span>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] cursor-pointer"
            >
              <option value="all">All Skills</option>
              {allSkills.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses, descriptions, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] w-64"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full card-dark p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-[var(--text-tertiary)] mx-auto opacity-40" />
            <h4 className="text-base font-bold text-[var(--text-primary)]">No Courses Found</h4>
            <p className="text-xs text-[var(--text-secondary)]">
              No curricula match your current search or competency filter. Click &ldquo;Add Course&rdquo; above to register training pathways.
            </p>
          </div>
        ) : (
          filtered.map((course) => {
            const isEnrolled = enrolledCourseMap[course.courseId];
            return (
              <div
                key={course.courseId}
                className="card-dark p-5 flex flex-col justify-between hover:border-[var(--accent)]/50 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/30">
                      {course.skill}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
                      <Award className="w-3.5 h-3.5" /> Target Level {course.proficiencyLevel}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1 text-[11px] font-medium">
                      <Clock className="w-3 h-3 text-[var(--accent)]" /> {course.estimatedDuration}
                    </span>
                    <span className="text-[11px] font-medium">{course.provider || 'Internal'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => toggleEnrollment(course.courseId)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isEnrolled
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {isEnrolled ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Enrolled</span>
                        </>
                      ) : (
                        <span>Enroll Staff</span>
                      )}
                    </button>

                    <a
                      href={course.resourceURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-elevated)] text-[var(--accent)] border border-[var(--border-subtle)] transition"
                      title="Open Course Resource"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Course Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register Training Course"
        description="Add a new upskilling resource linked to WSGA skill competencies"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
          <div>
            <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Course Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed PyTorch Architecture"
              className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Competency</label>
              <input
                type="text"
                required
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g. PyTorch"
                className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Target Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none"
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
            <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Estimated Duration</label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 20 hours"
                className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Provider / Platform</label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Coursera / Internal"
                className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[var(--text-secondary)] block mb-1 font-semibold">Resource URL</label>
            <input
              type="url"
              required
              value={resourceURL}
              onChange={(e) => setResourceURL(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--focus-ring)] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Registering...' : 'Add Course'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
