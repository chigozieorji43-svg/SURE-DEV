import React from 'react';
import { ManagedProject, ContractMilestone, ContractFile, KanbanTask, ContractMeeting, ProjectTimelineEvent } from '../../types';
import { 
  BarChart3, CheckCircle2, Clock, FolderGit2, Video, 
  MessageSquare, Target, Activity, ArrowRight, ShieldCheck, User
} from 'lucide-react';

interface ProjectDashboardOverviewProps {
  project: ManagedProject;
  milestones: ContractMilestone[];
  files: ContractFile[];
  tasks: KanbanTask[];
  meetings: ContractMeeting[];
  events: ProjectTimelineEvent[];
  userRole: 'employer' | 'developer';
  onNavigateTab: (tabId: string) => void;
}

export const ProjectDashboardOverview: React.FC<ProjectDashboardOverviewProps> = ({
  project,
  milestones,
  files,
  tasks,
  meetings,
  events,
  userRole,
  onNavigateTab,
}) => {
  const approvedMilestones = milestones.filter((m) => m.status === 'Approved').length;
  const milestoneProgress = milestones.length > 0 ? Math.round((approvedMilestones / milestones.length) * 100) : 0;

  const completedTasks = tasks.filter((t) => t.column === 'completed').length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled');

  return (
    <div className="space-y-6">
      {/* Overview Stat Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Milestone Progress */}
        <div
          onClick={() => onNavigateTab('milestones')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm hover:border-brand-teal transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Milestones</span>
            <div className="p-2 rounded-xl bg-brand-teal/10 text-brand-teal">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-brand-midnight dark:text-white font-display">
              {milestoneProgress}%
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              {approvedMilestones} of {milestones.length} approved
            </p>
          </div>
        </div>

        {/* Kanban Task Completion */}
        <div
          onClick={() => onNavigateTab('kanban')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm hover:border-brand-teal transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Tasks Done</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-brand-midnight dark:text-white font-display">
              {taskProgress}%
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              {completedTasks} of {tasks.length} task cards closed
            </p>
          </div>
        </div>

        {/* Vault Files Stored */}
        <div
          onClick={() => onNavigateTab('files')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm hover:border-brand-teal transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Vault Assets</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-brand-midnight dark:text-white font-display">
              {files.length}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              Documents & source archives
            </p>
          </div>
        </div>

        {/* Upcoming Video Calls */}
        <div
          onClick={() => onNavigateTab('meeting')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm hover:border-brand-teal transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500">Scheduled Calls</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-brand-midnight dark:text-white font-display">
              {upcomingMeetings.length}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
              Upcoming call sessions
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deliverables & Milestones Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestone Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-brand-border dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
              <h3 className="text-sm font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-teal" /> Milestone Roadmap Summary
              </h3>
              <button
                onClick={() => onNavigateTab('milestones')}
                className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Tracker <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {milestones.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No milestone checkpoints defined yet.
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.slice(0, 4).map((m, idx) => (
                  <div
                    key={`m-${m.id || idx}-${idx}`}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-brand-border/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-brand-midnight dark:text-white">{m.title}</div>
                      <div className="text-[10px] text-gray-400">Target Due: {m.dueDate}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-teal/10 text-brand-teal">
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Recent Activity Stream */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-brand-border dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
            <h3 className="text-sm font-bold text-brand-midnight dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-teal" /> Recent Audit Stream
            </h3>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {events.slice(0, 5).map((e, idx) => (
              <div key={`evt-${e.id || idx}-${idx}`} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/40 text-xs space-y-1">
                <div className="flex justify-between font-bold text-brand-midnight dark:text-slate-200">
                  <span>{e.actorName}</span>
                  <span className="text-[10px] text-gray-400">{new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-gray-500 dark:text-slate-400 text-[11px] line-clamp-2">{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
