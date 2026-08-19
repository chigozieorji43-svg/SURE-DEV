import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, CheckCircle2, XCircle, Clock, Search, Filter, 
  DollarSign, Calendar, User, Briefcase, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { ProjectApplication } from '../types';
import { dbService } from '../lib/firebaseService';
import { UserAvatar } from './UserAvatar';

interface EmployerApplicationsViewProps {
  employerId: string;
  employerName: string;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const EmployerApplicationsView: React.FC<EmployerApplicationsViewProps> = ({
  employerId,
  employerName
}) => {
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = dbService.subscribeEmployerApplications(employerId, (apps) => {
      setApplications(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [employerId]);

  const handleUpdateStatus = async (app: ProjectApplication, newStatus: 'accepted' | 'rejected') => {
    const appId = app.id;
    setUpdatingId(appId);
    setFeedbackMsg(null);
    try {
      const res = await dbService.updateProjectApplicationStatus(appId, newStatus, employerId, app);
      setFeedbackMsg({
        id: appId,
        msg: newStatus === 'accepted'
          ? `Application accepted! Project workspace created and synced with chat.`
          : `Application marked as rejected.`,
        type: 'success'
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      setFeedbackMsg({
        id: appId,
        msg: err?.message || 'Failed to update application status.',
        type: 'error'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Get unique list of project titles
  const projectTitles = Array.from(new Set(applications.map(a => a.projectTitle).filter(Boolean)));

  // Filtered applications
  const filteredApps = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (selectedProjectFilter !== 'all' && app.projectTitle !== selectedProjectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDev = app.developerName?.toLowerCase().includes(q);
      const matchTitle = app.projectTitle?.toLowerCase().includes(q);
      const matchProposal = app.proposal?.toLowerCase().includes(q);
      if (!matchDev && !matchTitle && !matchProposal) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto text-brand-green mb-3" />
        <p className="text-sm font-medium">Loading developer applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-brand-midnight dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-green" />
            Project Applications Received
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Review proposals submitted by developers for your posted opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold">
            Total: <strong>{applications.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200/50 dark:border-amber-900/30">
            Pending: <strong>{applications.filter(a => a.status === 'pending').length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200/50 dark:border-emerald-900/30">
            Accepted: <strong>{applications.filter(a => a.status === 'accepted').length}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by developer name, project title, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-brand-midnight dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
        </div>

        {/* Project Filter Dropdown */}
        {projectTitles.length > 0 && (
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-brand-midnight dark:text-white text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Posted Projects ({projectTitles.length})</option>
            {projectTitles.map((t, idx) => (
              <option key={`${t}-${idx}`} value={t}>{t}</option>
            ))}
          </select>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-900 text-brand-midnight dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-brand-midnight dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="py-16 px-6 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-gray-50/50 dark:bg-slate-900/30">
          <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-brand-midnight dark:text-white">
            No applications found
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {applications.length === 0
              ? 'No developers have applied to your project posts yet. Applications will appear here as soon as they submit.'
              : 'No applications match your selected filters. Try broadening your search or filter options.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app, idx) => {
            const isExpanded = expandedAppId === app.id;
            const isUpdating = updatingId === app.id;
            const hasFeedback = feedbackMsg?.id === app.id;

            return (
              <div
                key={app.id ? `${app.id}-${idx}` : idx}
                className="p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all shadow-sm hover:border-gray-300 dark:hover:border-slate-700"
              >
                {/* Card Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Developer Info */}
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={app.developerName}
                      src={app.developerProfileImage}
                      sizeClassName="w-11 h-11"
                      className="border border-gray-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-brand-midnight dark:text-white">
                          {app.developerName}
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          • {formatRelativeTime(app.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-brand-green font-medium mt-0.5">
                        Applied for: <span className="font-bold text-brand-midnight dark:text-white">{app.projectTitle}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        app.status === 'accepted'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : app.status === 'rejected'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {app.status === 'accepted' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {app.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                      {app.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Feedback Toast */}
                {hasFeedback && (
                  <div
                    className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      feedbackMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{feedbackMsg.msg}</span>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/80">
                  {app.proposedBudget && (
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800/60">
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 block font-medium">
                        Proposed Budget / Rate
                      </span>
                      <span className="text-xs font-bold text-brand-midnight dark:text-white">
                        {app.proposedBudget}
                      </span>
                    </div>
                  )}

                  {app.estimatedCompletionTime && (
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800/60">
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 block font-medium">
                        Estimated Completion Time
                      </span>
                      <span className="text-xs font-bold text-brand-midnight dark:text-white">
                        {app.estimatedCompletionTime}
                      </span>
                    </div>
                  )}
                </div>

                {/* Proposal Text */}
                <div className="mt-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">
                    Proposal / Cover Message
                  </h4>
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-slate-300 whitespace-pre-line bg-gray-50/80 dark:bg-slate-800/30 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800/60">
                    {isExpanded || app.proposal.length <= 250
                      ? app.proposal
                      : `${app.proposal.substring(0, 250)}...`}
                  </p>
                  {app.proposal.length > 250 && (
                    <button
                      onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                      className="mt-1 text-xs font-bold text-brand-green hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>Show Less <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Read Full Proposal <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </div>

                {/* Relevant Experience */}
                {app.experience && (
                  <div className="mt-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
                      Relevant Experience
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-slate-300 bg-gray-50/50 dark:bg-slate-800/20 p-2.5 rounded-lg">
                      {app.experience}
                    </p>
                  </div>
                )}

                {/* Action Controls for Pending Applications */}
                {app.status === 'pending' && (
                  <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(app, 'rejected')}
                      className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Reject Application
                    </button>
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(app, 'accepted')}
                      className="px-5 py-2 rounded-xl bg-brand-green hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept Application
                    </button>
                  </div>
                )}

                {/* Accepted Application Project Status */}
                {app.status === 'accepted' && (
                  <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-brand-green" />
                      <span>Application Accepted — Project workspace created & synced with Chat</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
