import React, { useState } from 'react';
import { ContractDeliverable } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { 
  PackageCheck, Github, Globe, FileText, Send, CheckCircle2, 
  XCircle, RotateCcw, Link2, ExternalLink, Plus, MessageSquare
} from 'lucide-react';

interface DeliverablesVaultProps {
  projectId: string;
  projectTitle: string;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer';
  deliverables: ContractDeliverable[];
  isReadOnly?: boolean;
}

export const DeliverablesVault: React.FC<DeliverablesVaultProps> = ({
  projectId,
  projectTitle,
  userId,
  userName,
  userRole,
  deliverables,
  isReadOnly = false,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewingDeliv, setReviewingDeliv] = useState<ContractDeliverable | null>(null);

  // Deliverable Submission Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Review Form State
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Revision Requested' | 'Rejected'>('Approved');
  const [feedback, setFeedback] = useState('');

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await dbService.submitContractDeliverable(
      {
        projectId,
        title,
        description,
        githubUrl: githubUrl.trim() || undefined,
        liveUrl: liveUrl.trim() || undefined,
        documentationUrl: documentationUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'Submitted',
      },
      userId,
      userName
    );

    setShowSubmitModal(false);
    setTitle('');
    setDescription('');
    setGithubUrl('');
    setLiveUrl('');
    setDocumentationUrl('');
    setNotes('');
  };

  const handleReviewDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingDeliv) return;

    await dbService.reviewContractDeliverable(
      reviewingDeliv.id,
      projectId,
      reviewStatus,
      feedback,
      userId,
      userName
    );

    setReviewingDeliv(null);
    setFeedback('');
  };

  const getStatusBadge = (status: ContractDeliverable['status']) => {
    const colors: Record<string, string> = {
      Approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      Submitted: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'Revision Requested': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      Rejected: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${colors[status] || 'bg-gray-100'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-brand-teal" /> Official Project Deliverables Vault
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Developer delivery hub for source code repositories, live staging deployments, and final release documentation.
            </p>
          </div>

          {!isReadOnly && userRole === 'developer' && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Submit Deliverable Release
            </button>
          )}
        </div>
      </div>

      {/* Deliverables List */}
      {deliverables.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-brand-border/80 dark:border-slate-800 p-8 space-y-3">
          <PackageCheck className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-brand-midnight dark:text-slate-200">No Final Deliverables Submitted Yet</h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            When developer leads complete key deliverables, they submit repository URLs, live staging links, and docs here for formal employer approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliverables.map((d, dIdx) => (
            <div
              key={d.id ? `${d.id}-${dIdx}` : dIdx}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border/40 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-brand-midnight dark:text-white">{d.title}</h4>
                  <span className="text-[10px] text-gray-400">
                    Submitted: {new Date(d.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div>{getStatusBadge(d.status)}</div>
              </div>

              <div className="space-y-3 text-xs text-gray-700 dark:text-slate-300">
                {d.description && <p>{d.description}</p>}

                {/* External Release Links */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {d.githubUrl && (
                    <a
                      href={d.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 hover:bg-slate-800"
                    >
                      <Github className="w-3.5 h-3.5" /> Repository Code <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {d.liveUrl && (
                    <a
                      href={d.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-700"
                    >
                      <Globe className="w-3.5 h-3.5" /> Live Staging App <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {d.documentationUrl && (
                    <a
                      href={d.documentationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-brand-midnight dark:text-slate-200 text-[11px] font-bold flex items-center gap-1.5 border"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-teal" /> Release Documentation <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {d.notes && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-brand-border/60 text-xs">
                    <strong>Developer Delivery Note:</strong> {d.notes}
                  </div>
                )}

                {d.feedback && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl text-xs">
                    <strong>Employer Review Feedback:</strong> {d.feedback}
                  </div>
                )}
              </div>

              {/* Employer Review Action Trigger */}
              {!isReadOnly && userRole === 'employer' && d.status === 'Submitted' && (
                <div className="pt-3 border-t border-brand-border/40 flex justify-end">
                  <button
                    onClick={() => setReviewingDeliv(d)}
                    className="px-4 py-2 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight text-xs font-bold cursor-pointer"
                  >
                    Review Deliverable Release
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Developer Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-brand-teal" /> Submit Project Deliverable
              </h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Deliverable Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Production Release v1.0 & API Documentation"
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of code modules and features built..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">GitHub Repository Link</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Live Staging / Deployment Link</label>
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://app.suredev.io"
                    className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">Delivery Notes & Test Credentials</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Include admin login test credentials, environment setup instructions, or notes..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="px-4 py-2.5 rounded-xl border font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight font-bold cursor-pointer">Submit Deliverable</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Deliverable Modal */}
      {reviewingDeliv && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-brand-midnight dark:text-white">
              Review Deliverable: {reviewingDeliv.title}
            </h3>
            <form onSubmit={handleReviewDeliverable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-600 dark:text-slate-300 mb-1.5">Review Decision *</label>
                <select
                  value={reviewStatus}
                  onChange={(e: any) => setReviewStatus(e.target.value)}
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                >
                  <option value="Approved">Approve Deliverable Release</option>
                  <option value="Revision Requested">Request Revision / Bug Fixes</option>
                  <option value="Rejected">Reject Deliverable</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 dark:text-slate-300 mb-1.5">Reviewer Feedback Comments</label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide detailed feedback on testing results..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setReviewingDeliv(null)} className="px-4 py-2 rounded-xl border font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight font-bold cursor-pointer">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
