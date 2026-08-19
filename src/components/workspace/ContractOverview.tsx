import React, { useState } from 'react';
import { ManagedProject, ContractChangeRequest } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { 
  FileText, Calendar, Clock, User, Building2, CheckCircle2, 
  AlertCircle, Edit3, Send, ShieldCheck, Tag, Code2, RefreshCw, FileCode
} from 'lucide-react';

interface ContractOverviewProps {
  project: ManagedProject;
  userRole: 'employer' | 'developer';
  userId: string;
  userName: string;
  changeRequests: ContractChangeRequest[];
  isReadOnly?: boolean;
}

export const ContractOverview: React.FC<ContractOverviewProps> = ({
  project,
  userRole,
  userId,
  userName,
  changeRequests,
  isReadOnly = false,
}) => {
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [reason, setReason] = useState('');
  const [newDeadline, setNewDeadline] = useState(project.deadline || '');
  const [newScope, setNewScope] = useState(project.scopeOfWork || project.description || '');
  const [submitting, setSubmitting] = useState(false);

  const pendingRequests = changeRequests.filter(r => r.status === 'pending');

  const handleCreateAmendment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await dbService.createContractChangeRequest({
        projectId: project.id,
        requestedBy: userId,
        requestedByName: userName,
        requestedByRole: userRole,
        newDeadline,
        newScope,
        reason,
        status: 'pending',
      });
      setShowAmendmentModal(false);
      setReason('');
    } catch (err) {
      console.error('Error creating change request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await dbService.respondToChangeRequest(
        requestId,
        project.id,
        status,
        userId,
        userName,
        userRole
      );
    } catch (err) {
      console.error('Error responding to change request:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'In Review': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'Revision Requested': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      Completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      Pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      Cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-midnight to-slate-900 dark:from-slate-900 dark:to-slate-950 p-6 md:p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge(project.status)}
              <span className="text-xs font-mono text-slate-400 bg-white/10 px-2.5 py-1 rounded-lg">
                ID: {project.id}
              </span>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                {project.contractType || 'Fixed Scope Contract'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-white">
              {project.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed line-clamp-3">
              {project.description}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0">
            {!isReadOnly && project.status !== 'Completed' && (
              <button
                onClick={() => setShowAmendmentModal(true)}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm"
              >
                <Edit3 className="w-4 h-4 text-emerald-400" /> Propose Contract Amendment
              </button>
            )}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified SureDev Workspace
            </div>
          </div>
        </div>
      </div>

      {/* Pending Change Requests Notification */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Pending Contract Amendment Proposal</span>
          </div>
          {pendingRequests.map((req, rIdx) => (
            <div key={req.id ? `${req.id}-${rIdx}` : rIdx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-500/20 text-xs space-y-3">
              <div className="flex items-center justify-between text-gray-500 dark:text-slate-400">
                <span>Proposed by <strong>{req.requestedByName}</strong> ({req.requestedByRole})</span>
                <span>{new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-brand-midnight dark:text-slate-200 font-medium">
                <strong>Reason:</strong> {req.reason}
              </p>
              {req.newDeadline && (
                <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                  New Deadline Proposed: {req.newDeadline}
                </div>
              )}
              {req.newScope && (
                <div className="text-gray-600 dark:text-slate-300">
                  New Scope: {req.newScope}
                </div>
              )}

              {req.requestedBy !== userId && !isReadOnly && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleRespondRequest(req.id, 'approved')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept Amendment
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req.id, 'rejected')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    Decline Amendment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Parties Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-brand-border dark:border-slate-800 space-y-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-teal" /> Contract Counterparties
          </h3>

          <div className="space-y-4 text-xs">
            {/* Employer */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-brand-border/60 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold text-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Employer</div>
                  <div className="font-bold text-brand-midnight dark:text-slate-100 text-sm">{project.employerName}</div>
                </div>
              </div>
              {userRole === 'employer' && (
                <span className="text-[10px] bg-brand-teal/10 text-brand-teal font-bold px-2 py-0.5 rounded-md">You</span>
              )}
            </div>

            {/* Developer */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-brand-border/60 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Developer Lead</div>
                  <div className="font-bold text-brand-midnight dark:text-slate-100 text-sm">{project.developerName}</div>
                </div>
              </div>
              {userRole === 'developer' && (
                <span className="text-[10px] bg-purple-500/10 text-purple-600 font-bold px-2 py-0.5 rounded-md">You</span>
              )}
            </div>
          </div>
        </div>

        {/* Timeline & Schedule */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-brand-border dark:border-slate-800 space-y-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" /> Timeline & Schedule
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-brand-border/40 dark:border-slate-800">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Start Date:
              </span>
              <span className="font-semibold text-brand-midnight dark:text-slate-200">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-brand-border/40 dark:border-slate-800">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" /> Target Deadline:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                {project.deadline || 'Flexible'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Last Synchronized:
              </span>
              <span className="font-semibold text-gray-600 dark:text-slate-400">
                {new Date(project.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Skills & Stack */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-brand-border dark:border-slate-800 space-y-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-500" /> Required Competencies
          </h3>

          <div className="flex flex-wrap gap-2">
            {project.requiredSkills.map((skill, idx) => (
              <span
                key={`${skill}-${idx}`}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-brand-midnight dark:text-slate-200 text-xs font-bold border border-brand-border/60 dark:border-slate-700/60"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Deep Scope of Work */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-brand-midnight dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-teal" /> Official Scope of Work & Requirements
        </h3>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-brand-border/60 dark:border-slate-800 text-xs text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
          {project.scopeOfWork || project.description}
        </div>
      </div>

      {/* Amendment Modal */}
      {showAmendmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-teal" /> Propose Contract Amendment
              </h3>
              <button
                onClick={() => setShowAmendmentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAmendment} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">
                  Reason for Amendment *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why deadline or scope modifications are requested..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white text-xs focus:ring-2 focus:ring-brand-teal outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">
                  Proposed Target Deadline
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white text-xs focus:ring-2 focus:ring-brand-teal outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">
                  Adjusted Scope Details
                </label>
                <textarea
                  rows={4}
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  placeholder="Describe updated deliverables or scope changes..."
                  className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white text-xs focus:ring-2 focus:ring-brand-teal outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAmendmentModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-brand-border dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
