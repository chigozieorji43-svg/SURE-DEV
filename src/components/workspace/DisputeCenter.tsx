import React, { useState } from 'react';
import { ContractDispute, ManagedProject } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { AlertTriangle, ShieldAlert, FileText, Send, Clock, CheckCircle2, MessageSquare } from 'lucide-react';

interface DisputeCenterProps {
  project: ManagedProject;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer';
  disputes: ContractDispute[];
  isReadOnly?: boolean;
}

export const DisputeCenter: React.FC<DisputeCenterProps> = ({
  project,
  userId,
  userName,
  userRole,
  disputes,
  isReadOnly = false,
}) => {
  const [showFileModal, setShowFileModal] = useState(false);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<'Scope Breach' | 'Non-Responsiveness' | 'Quality Issue' | 'Deadline Violation'>('Scope Breach');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);

    try {
      await dbService.createContractDispute({
        projectId: project.id,
        complainantId: userId,
        complainantName: userName,
        complainantRole: userRole,
        respondentId: userRole === 'employer' ? project.developerId : project.employerId,
        respondentName: userRole === 'employer' ? project.developerName : project.employerName,
        category,
        description: reason,
        adminNotes: evidenceNotes.trim() || undefined,
        status: 'Open',
      });
      setShowFileModal(false);
      setReason('');
      setEvidenceNotes('');
    } catch (err) {
      console.error('Error filing dispute:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> Contract Dispute Resolution Center
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Formal mediation center for resolving non-responsiveness, scope breach, or quality concerns.
            </p>
          </div>

          {!isReadOnly && disputes.filter(d => d.status !== 'resolved').length === 0 && (
            <button
              onClick={() => setShowFileModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" /> Open Formal Dispute
            </button>
          )}
        </div>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-brand-border/80 dark:border-slate-800 p-8 space-y-3">
          <ShieldAlert className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-brand-midnight dark:text-slate-200">No Active Disputes Filed</h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            This project workspace is operating smoothly with no formal mediation cases or contract violations logged.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d, dIdx) => (
            <div
              key={d.id ? `${d.id}-${dIdx}` : dIdx}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-500/30 dark:border-rose-500/20 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  {d.category} • Status: {d.status}
                </span>
                <span className="text-xs text-gray-400">
                  Opened: {new Date(d.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-700 dark:text-slate-300">
                <p><strong>Filed By:</strong> {d.openedByName} ({d.openedByRole})</p>
                <p><strong>Reason:</strong> {d.reason}</p>
                {d.evidenceNotes && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <strong>Evidence Notes:</strong> {d.evidenceNotes}
                  </div>
                )}
                {d.resolutionNotes && (
                  <div className="p-3 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-xl">
                    <strong>Resolution Decision:</strong> {d.resolutionNotes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Dispute Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Open Formal Dispute Case
              </h3>
              <button onClick={() => setShowFileModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleFileDispute} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Dispute Category *</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                >
                  <option value="Scope Breach">Scope Breach / Unrequested Demands</option>
                  <option value="Non-Responsiveness">Non-Responsiveness / Communication Lockout</option>
                  <option value="Quality Issue">Quality Defect / Code Errors</option>
                  <option value="Deadline Violation">Severe Deadline Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Detailed Explanation *</label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detail contract breach or mediation grounds..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Evidence & File References</label>
                <textarea
                  rows={2}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Reference workspace chat timestamps or file names..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowFileModal(false)} className="px-4 py-2.5 rounded-xl border font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer">Submit Dispute</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
