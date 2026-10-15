'use client';

import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  X,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (message: string) => void;
}

const SAMPLE_EMPLOYEE_CSV = `name,department,designation,experienceYears,skills,capacityHours,performance
"Sophia Turner","AI & Data Science","Lead Vision Specialist",8,"PyTorch: 5, OpenCV: 5, Python: 5, Docker: 4",40,95
"Ethan Cross","Engineering","Principal Backend SRE",7,"Go: 5, Kubernetes: 4, Kafka: 4, PostgreSQL: 4",40,92
"Isabella Gomez","Engineering","Frontend Lead",5,"React: 5, TypeScript: 5, TailwindCSS: 4, Next.js: 4",40,89
"Lucas Vance","DevOps","Security Infrastructure Engineer",6,"AWS: 4, Terraform: 5, Linux: 4, Zero-Trust: 4",40,88`;

const SAMPLE_PROJECT_CSV = `name,description,requiredSkills,mandatorySkills,teamSize,requiredCapacityHours,minExperienceYears,priority
"Quantum Vision Telemetry","Next-gen edge camera streaming and deep learning inference","PyTorch: 4, Python: 4, Docker: 3, OpenCV: 4","PyTorch, Python",2,40,4,"high"
"Real-Time Audit Ledger","Tamper-evident audit trail with Kafka and PostgreSQL","Go: 4, Kafka: 4, PostgreSQL: 4","Go, Kafka",2,45,3,"medium"`;

export default function CsvUploadModal({ isOpen, onClose, onImportSuccess }: CsvUploadModalProps) {
  const [importType, setImportType] = useState<'employees' | 'projects'>('employees');
  const [csvText, setCsvText] = useState(SAMPLE_EMPLOYEE_CSV);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTypeChange = (type: 'employees' | 'projects') => {
    setImportType(type);
    setCsvText(type === 'employees' ? SAMPLE_EMPLOYEE_CSV : SAMPLE_PROJECT_CSV);
    setPreviewResult(null);
    setErrorMsg(null);
  };

  const handleDownloadSample = () => {
    const text = importType === 'employees' ? SAMPLE_EMPLOYEE_CSV : SAMPLE_PROJECT_CSV;
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_${importType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        setPreviewResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handleValidatePreview = async () => {
    setValidating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          csvText,
          commit: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setPreviewResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation request failed');
    } finally {
      setValidating(false);
    }
  };

  const handleCommitImport = async () => {
    setImporting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          csvText,
          commit: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import commit failed');

      onImportSuccess(
        `Successfully imported ${data.committedCount} ${importType} record(s) into active workforce.`
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-elevated bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Upload className="h-5 w-5 text-[var(--accent)]" />
              CSV Data Import & Validation
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Upload, validate schema constraints, preview rows, and commit directly to the active workforce store.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-secondary)] transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Import Type Selector & Sample Template Download */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Target Entity:</span>
            <button
              onClick={() => handleTypeChange('employees')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                importType === 'employees'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Employees Roster
            </button>
            <button
              onClick={() => handleTypeChange('projects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                importType === 'projects'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Projects & Pipelines
            </button>
          </div>

          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-800 transition border border-cyan-800/60"
          >
            <Download className="h-3.5 w-3.5" />
            Download Sample {importType === 'employees' ? 'Employees' : 'Projects'} CSV
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CSV Text Area or File Input */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-medium">
              CSV Content or File Upload
            </label>
            <label className="cursor-pointer text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span>Choose local .csv file</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setPreviewResult(null);
            }}
            placeholder="Paste CSV rows with headers here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          />
        </div>

        {/* Action Button: Validate Preview */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleValidatePreview}
            disabled={validating || !csvText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${validating ? 'animate-spin text-cyan-400' : ''}`} />
            {validating ? 'Validating Schema...' : 'Validate & Preview Rows'}
          </button>

          {previewResult && (
            <span className="text-xs text-slate-400">
              Found <strong className="text-emerald-400">{previewResult.validCount} valid</strong> and{' '}
              <strong className={previewResult.errorCount > 0 ? 'text-rose-400' : 'text-slate-400'}>
                {previewResult.errorCount} invalid
              </strong>{' '}
              out of {previewResult.totalRows} rows.
            </span>
          )}
        </div>

        {/* Preview Table */}
        {previewResult && (
          <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-800/60 px-4 py-2 font-semibold text-slate-300 uppercase text-[10px] tracking-wider flex justify-between">
              <span>Preview & Schema Validation Status</span>
              <span>{importType.toUpperCase()}</span>
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800">
              {previewResult.rows.map((row: any) => (
                <div
                  key={row.rowNumber}
                  className={`p-3 transition ${
                    row.isValid ? 'bg-slate-900/60 hover:bg-slate-800/40' : 'bg-rose-950/20 hover:bg-rose-950/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">Row #{row.rowNumber}</span>
                      {row.preview.name}
                    </span>

                    {row.isValid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                        <CheckCircle className="h-3 w-3" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-800">
                        <AlertTriangle className="h-3 w-3" /> Errors
                      </span>
                    )}
                  </div>

                  {importType === 'employees' ? (
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3">
                      <span><strong>Role:</strong> {row.preview.designation}</span>
                      <span><strong>Dept:</strong> {row.preview.department}</span>
                      <span><strong>Exp:</strong> {row.preview.experience}</span>
                      <span><strong>Cap:</strong> {row.preview.capacity}</span>
                      <span className="text-cyan-300"><strong>Skills:</strong> {row.preview.skills}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3">
                      <span><strong>Team:</strong> {row.preview.teamSize}</span>
                      <span><strong>Capacity:</strong> {row.preview.requiredCapacity}</span>
                      <span className="text-cyan-300"><strong>Skills:</strong> {row.preview.skills}</span>
                      <span className="text-amber-300"><strong>Mandatory:</strong> {row.preview.mandatory}</span>
                    </div>
                  )}

                  {!row.isValid && (
                    <div className="mt-1.5 text-[11px] text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900/60">
                      {row.errors.join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommitImport}
            disabled={importing || !previewResult || previewResult.validCount === 0}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-40"
          >
            <Database className="h-3.5 w-3.5" />
            {importing
              ? 'Importing...'
              : `Import ${previewResult?.validCount || 0} Valid Record(s) to Store`}
          </button>
        </div>
      </div>
    </div>
  );
}
