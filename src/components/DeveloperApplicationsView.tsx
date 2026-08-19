import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle2, XCircle, Clock, Search, 
  DollarSign, Calendar, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { ProjectApplication } from '../types';
import { dbService } from '../lib/firebaseService';

interface DeveloperApplicationsViewProps {
  developerId: string;
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

export const DeveloperApplicationsView: React.FC<DeveloperApplicationsViewProps> = ({
  developerId
}) => {
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = dbService.subscribeDeveloperApplications(developerId, (apps) => {
      setApplications(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [developerId]);

  const filteredApps = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto text-brand-green mb-3" />
        <p className="text-sm font-medium">Loading your submitted applications...</p>
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
            My Project Applications
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Track and check the status of applications you have submitted to employers.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
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

      {/* List */}
      {filteredApps.length === 0 ? (
        <div className="py-16 px-6 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-gray-50/50 dark:bg-slate-900/30">
          <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-brand-midnight dark:text-white">
            No applications submitted
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {applications.length === 0
              ? 'You have not submitted any project applications yet. Browse the Find Work feed to discover opportunities and apply.'
              : 'No applications match your selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app, idx) => {
            const isExpanded = expandedAppId === app.id;

            return (
              <div
                key={app.id ? `${app.id}-${idx}` : idx}
                className="p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all shadow-sm hover:border-gray-300 dark:hover:border-slate-700"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-brand-midnight dark:text-white">
                      {app.projectTitle}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      Submitted {formatRelativeTime(app.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
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

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/80">
                  {app.proposedBudget && (
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800/60">
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 block font-medium">
                        Your Proposed Budget
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

                {/* Proposal preview */}
                <div className="mt-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
                    Your Proposal
                  </h4>
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-slate-300 bg-gray-50/80 dark:bg-slate-800/30 p-3 rounded-xl border border-gray-100 dark:border-slate-800/60">
                    {isExpanded || app.proposal.length <= 200
                      ? app.proposal
                      : `${app.proposal.substring(0, 200)}...`}
                  </p>
                  {app.proposal.length > 200 && (
                    <button
                      onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                      className="mt-1 text-xs font-bold text-brand-green hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? 'Show Less' : 'Read Full Proposal'}
                    </button>
                  )}
                </div>

                {/* Accepted Application Project Notice */}
                {app.status === 'accepted' && (
                  <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-brand-green" />
                      <span>Application Accepted — Project workspace and Chat are now active in your Projects tab</span>
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
