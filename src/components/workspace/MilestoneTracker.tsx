import React, { useState } from 'react';
import { ContractMilestone } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { 
  Target, Plus, CheckCircle2, AlertCircle, Clock, FileText, 
  Send, CornerDownRight, ShieldCheck, Edit2, RotateCcw, ArrowRight
} from 'lucide-react';

interface MilestoneTrackerProps {
  projectId: string;
  projectTitle: string;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer';
  milestones: ContractMilestone[];
  isReadOnly?: boolean;
}

export const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({
  projectId,
  projectTitle,
  userId,
  userName,
  userRole,
  milestones,
  isReadOnly = false,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState<ContractMilestone | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState<ContractMilestone | null>(null);

  // New Milestone Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deliverablesInput, setDeliverablesInput] = useState('');

  // Submit Form
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Revision Form
  const [revisionReason, setRevisionReason] = useState('');

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    const deliverablesList = deliverablesInput
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    await dbService.createContractMilestone(
      {
        projectId,
        title,
        description,
        dueDate,
        deliverables: deliverablesList.length > 0 ? deliverablesList : ['Core Deliverable Functional Submission'],
        status: 'In Progress',
      },
      userId,
      userName,
      userRole
    );

    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setDueDate('');
    setDeliverablesInput('');
  };

  const handleSubmitMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSubmitModal) return;

    await dbService.updateContractMilestone(
      showSubmitModal.id,
      projectId,
      {
        status: 'Submitted',
        submissionNotes,
      },
      userId,
      userName,
      userRole
    );

    setShowSubmitModal(null);
    setSubmissionNotes('');
  };

  const handleApproveMilestone = async (m: ContractMilestone) => {
    await dbService.updateContractMilestone(
      m.id,
      projectId,
      {
        status: 'Approved',
        completionDate: new Date().toISOString(),
      },
      userId,
      userName,
      userRole
    );
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRevisionModal || !revisionReason.trim()) return;

    const updatedHistory = [
      ...(showRevisionModal.revisionHistory || []),
      {
        requestedAt: new Date().toISOString(),
        reason: revisionReason,
        requestedBy: userName,
      },
    ];

    await dbService.updateContractMilestone(
      showRevisionModal.id,
      projectId,
      {
        status: 'Revision Requested',
        revisionHistory: updatedHistory,
      },
      userId,
      userName,
      userRole
    );

    setShowRevisionModal(null);
    setRevisionReason('');
  };

  const getStatusBadge = (status: ContractMilestone['status']) => {
    const badges: Record<string, { bg: string; text: string }> = {
      Approved: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
      Submitted: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
      'Revision Requested': { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
      'In Progress': { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
      Pending: { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600' },
    };
    const b = badges[status] || badges.Pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${b.bg} ${b.text}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {status}
      </span>
    );
  };

  const totalMilestones = milestones.length;
  const approvedMilestones = milestones.filter((m) => m.status === 'Approved').length;
  const progressPercentage = totalMilestones > 0 ? Math.round((approvedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Progress */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-teal" /> Contract Milestone Progress Tracker
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Structure development phases, track deliverables, and manage formal submission approvals.
            </p>
          </div>

          {!isReadOnly && userRole === 'employer' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create New Milestone
            </button>
          )}
        </div>

        {/* Global Milestone Progress Bar */}
        <div className="bg-gray-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-brand-border/60 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-brand-midnight dark:text-slate-200">
            <span>Overall Contract Milestone Completion</span>
            <span className="text-brand-teal font-extrabold">{progressPercentage}% Approved ({approvedMilestones}/{totalMilestones})</span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-teal to-emerald-500 transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-brand-border/80 dark:border-slate-800 p-8 space-y-3">
          <Target className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-brand-midnight dark:text-slate-200">No Contract Milestones Configured</h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            Create milestone checkpoints (e.g. "Architecture & Wireframes", "Beta MVP Release", "Final QA & Handover") to guide project delivery.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((m, index) => (
            <div
              key={m.id ? `${m.id}-${index}` : index}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border/40 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-brand-teal/10 text-brand-teal font-bold text-xs flex items-center justify-center shrink-0">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-brand-midnight dark:text-white">{m.title}</h4>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Target Due Date: {m.dueDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(m.status)}
                </div>
              </div>

              {/* Description & Deliverables */}
              <div className="space-y-3 text-xs text-gray-700 dark:text-slate-300">
                {m.description && <p>{m.description}</p>}

                <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-brand-border/60 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-brand-midnight dark:text-white uppercase text-[10px] tracking-wider block">
                    Expected Deliverables checklist:
                  </span>
                  <ul className="space-y-1.5 pl-1">
                    {m.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${m.status === 'Approved' ? 'text-emerald-500' : 'text-gray-400'}`} />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Submission Notes */}
                {m.submissionNotes && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                    <strong>Developer Submission Note:</strong> {m.submissionNotes}
                  </div>
                )}

                {/* Revision History Log */}
                {m.revisionHistory && m.revisionHistory.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 space-y-1 text-[11px]">
                    <strong className="block text-xs">Revision History:</strong>
                    {m.revisionHistory.map((rev, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <RotateCcw className="w-3 h-3 mt-0.5 shrink-0" />
                        <span><strong>{rev.requestedBy}:</strong> "{rev.reason}" ({new Date(rev.requestedAt).toLocaleDateString()})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Milestone Action Bar */}
              {!isReadOnly && (
                <div className="pt-3 border-t border-brand-border/40 dark:border-slate-800 flex items-center justify-end gap-3">
                  {/* Developer Submit Action */}
                  {userRole === 'developer' && (m.status === 'In Progress' || m.status === 'Revision Requested') && (
                    <button
                      onClick={() => setShowSubmitModal(m)}
                      className="px-4 py-2 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Milestone Deliverables
                    </button>
                  )}

                  {/* Employer Review Actions */}
                  {userRole === 'employer' && m.status === 'Submitted' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveMilestone(m)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Milestone
                      </button>
                      <button
                        onClick={() => setShowRevisionModal(m)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Request Revision
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Milestone Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-teal" /> Create Contract Milestone
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Milestone Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Phase 1: Authentication & UI Wireframes"
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of expected progress during this phase..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Target Completion Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">
                  Deliverable Checklist Items (One per line)
                </label>
                <textarea
                  rows={3}
                  value={deliverablesInput}
                  onChange={(e) => setDeliverablesInput(e.target.value)}
                  placeholder="e.g. Figma UI Designs&#10;User Registration API&#10;Database Schema"
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 rounded-xl border font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight font-bold cursor-pointer">
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Developer Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-brand-midnight dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-brand-teal" /> Submit Milestone: {showSubmitModal.title}
            </h3>
            <form onSubmit={handleSubmitMilestone} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-600 dark:text-slate-300 mb-1.5">Submission Notes for Employer *</label>
                <textarea
                  required
                  rows={4}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Detail completed deliverables, test instructions, or staging link..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSubmitModal(null)} className="px-4 py-2 rounded-xl border font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer">Submit Phase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-brand-midnight dark:text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-500" /> Request Revision: {showRevisionModal.title}
            </h3>
            <form onSubmit={handleRequestRevision} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-600 dark:text-slate-300 mb-1.5">Revision Reason & Specific Adjustments Required *</label>
                <textarea
                  required
                  rows={4}
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="Explain what needs adjustment before milestone approval..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowRevisionModal(null)} className="px-4 py-2 rounded-xl border font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold cursor-pointer">Request Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
