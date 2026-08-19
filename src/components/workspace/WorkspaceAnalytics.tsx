import React from 'react';
import { 
  ManagedProject, ContractMessage, ContractFile, ContractMilestone, 
  ContractDeliverable, KanbanTask, ContractMeeting 
} from '../../types';
import { 
  BarChart3, CheckCircle2, Clock, AlertCircle, TrendingUp, 
  MessageSquare, FolderGit2, Target, PackageCheck, Video, Award, Zap 
} from 'lucide-react';

interface WorkspaceAnalyticsProps {
  project: ManagedProject;
  messages: ContractMessage[];
  files: ContractFile[];
  milestones: ContractMilestone[];
  deliverables: ContractDeliverable[];
  tasks: KanbanTask[];
  meetings: ContractMeeting[];
}

export const WorkspaceAnalytics: React.FC<WorkspaceAnalyticsProps> = ({
  project,
  messages,
  files,
  milestones,
  deliverables,
  tasks,
  meetings,
}) => {
  // Calculated Metrics
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'Completed' || m.status === 'Approved').length;
  const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const openTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const totalFilesSizeMB = (files.reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024)).toFixed(1);
  const totalMeetingMinutes = meetings.reduce((acc, m) => acc + (m.duration || 30), 0);
  const revisionRequestsCount = deliverables.filter(d => d.status === 'Revision Requested').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Overview */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-brand-midnight via-slate-900 to-brand-midnight text-white shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold text-brand-teal tracking-widest bg-brand-teal/10 px-3 py-1 rounded-full border border-brand-teal/20">
              Live Workspace Analytics
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold font-display">
              Collaboration Productivity & Health Score
            </h2>
            <p className="text-xs text-gray-300 max-w-xl">
              Real-time velocity metrics, deliverable completion rates, and team engagement statistics.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-brand-teal font-display">
                {milestoneProgress}%
              </div>
              <div className="text-[10px] text-gray-300 uppercase font-bold tracking-wider">
                Overall Progress
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-300">
            <span>Contract Milestone Completion Velocity</span>
            <span>{completedMilestones} of {totalMilestones} Milestones Met</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-brand-teal to-emerald-400 rounded-full transition-all duration-1000"
              style={{ width: `${milestoneProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* Task Completion */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border/60 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 font-bold">
            <span className="text-gray-500 dark:text-slate-400">Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-brand-midnight dark:text-white font-display">
            {completedTasks.length} <span className="text-xs font-normal text-gray-400">/ {tasks.length}</span>
          </div>
          <p className="text-[10px] text-gray-400">{taskProgress}% completion rate</p>
        </div>

        {/* Messages Exchanged */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border/60 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-blue-500 font-bold">
            <span className="text-gray-500 dark:text-slate-400">Messages Exchanged</span>
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-brand-midnight dark:text-white font-display">
            {messages.length}
          </div>
          <p className="text-[10px] text-gray-400">Avg response time: ~12 mins</p>
        </div>

        {/* Vault Storage */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border/60 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-indigo-500 font-bold">
            <span className="text-gray-500 dark:text-slate-400">Vault Assets</span>
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-brand-midnight dark:text-white font-display">
            {files.length} <span className="text-xs font-normal text-gray-400">files</span>
          </div>
          <p className="text-[10px] text-gray-400">{totalFilesSizeMB} MB storage utilized</p>
        </div>

        {/* Video Calls Duration */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border/60 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-purple-500 font-bold">
            <span className="text-gray-500 dark:text-slate-400">Meeting Duration</span>
            <Video className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-brand-midnight dark:text-white font-display">
            {totalMeetingMinutes} <span className="text-xs font-normal text-gray-400">mins</span>
          </div>
          <p className="text-[10px] text-gray-400">{meetings.length} sync sessions completed</p>
        </div>
      </div>

      {/* Visual Velocity Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Milestone Velocity Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-brand-border/60 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-extrabold text-brand-midnight dark:text-white font-display flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-teal" />
            Milestone Breakdown
          </h3>

          <div className="space-y-3 text-xs">
            {milestones.map((ms) => {
              const isDone = ms.status === 'Completed' || ms.status === 'Approved';
              return (
                <div key={ms.id} className="space-y-1">
                  <div className="flex justify-between font-bold text-gray-700 dark:text-slate-200 text-[11px]">
                    <span>{ms.title}</span>
                    <span className={isDone ? 'text-emerald-500 font-mono' : 'text-amber-500 font-mono'}>
                      ${ms.amount} • {ms.status}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      style={{ width: isDone ? '100%' : '45%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quality & Revision Metrics */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-brand-border/60 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-extrabold text-brand-midnight dark:text-white font-display flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Quality & Review Index
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-brand-border/40 flex items-center justify-between">
              <div>
                <div className="font-bold text-brand-midnight dark:text-white">Revision Request Rate</div>
                <div className="text-[11px] text-gray-500">{revisionRequestsCount} total revision requests submitted</div>
              </div>
              <span className="text-sm font-extrabold text-brand-midnight dark:text-white font-mono bg-amber-500/10 text-amber-600 px-3 py-1 rounded-xl">
                Low Risk
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-brand-border/40 flex items-center justify-between">
              <div>
                <div className="font-bold text-brand-midnight dark:text-white">Average Satisfaction Rating</div>
                <div className="text-[11px] text-gray-500">Based on submitted milestone reviews</div>
              </div>
              <span className="text-sm font-extrabold text-emerald-500 font-mono bg-emerald-500/10 px-3 py-1 rounded-xl">
                4.9 / 5.0 ★
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
