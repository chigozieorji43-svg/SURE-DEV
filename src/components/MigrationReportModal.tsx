import React, { useState } from 'react';
import { Database, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { runAuthDataMigration, MigrationReport } from '../utils/authMigration';

export const MigrationReportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunMigration = async () => {
    setIsRunning(true);
    try {
      const res = await runAuthDataMigration();
      setReport(res);
    } catch (e) {
      console.error("Migration error:", e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-brand-border shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-midnight text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database size={18} className="text-brand-gold" />
            <h3 className="font-display font-bold text-sm text-white">
              Database Auth Integrity Audit & Migration
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          <p className="text-slate-600 leading-relaxed">
            Run an automated database scan to verify that all Firestore accounts have valid, immutable roles and zero duplicate profiles across collections.
          </p>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleRunMigration}
            className="w-full py-3 bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
            <span>{isRunning ? 'Scanning Firestore Database...' : 'Run Auth Integrity Scan & Repair'}</span>
          </button>

          {report && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Audit Scan Result: {report.status}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{new Date(report.timestamp).toLocaleTimeString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Total User Docs:</span>
                  <span className="font-bold font-mono text-slate-900">{report.totalUserDocs}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Dev / Emp Breakdown:</span>
                  <span className="font-bold font-mono text-slate-900">{report.developerRolesCount} Devs / {report.employerRolesCount} Emps</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Missing Roles Fixed:</span>
                  <span className="font-bold font-mono text-emerald-600">{report.missingRolesFixed}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Duplicates Removed:</span>
                  <span className="font-bold font-mono text-emerald-600">{report.duplicateProfilesRemoved}</span>
                </div>
              </div>

              {report.details.length > 0 && (
                <div className="mt-2 text-[10px] space-y-1 max-h-32 overflow-y-auto bg-white p-2 rounded-lg border border-slate-200 font-mono text-slate-600">
                  {report.details.map((d, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-emerald-500">✓</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
