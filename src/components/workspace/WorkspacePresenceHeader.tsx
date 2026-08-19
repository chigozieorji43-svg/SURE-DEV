import React, { useState } from 'react';
import { WorkspacePresence, PresenceStatus, ActiveActionType } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { 
  Circle, Activity, User, Laptop, ShieldCheck, Clock, Eye, 
  Sparkles, CheckCircle2, AlertCircle, Radio, Wifi
} from 'lucide-react';

interface WorkspacePresenceHeaderProps {
  projectId: string;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer' | 'admin';
  presences: WorkspacePresence[];
  currentTab: string;
}

export const WorkspacePresenceHeader: React.FC<WorkspacePresenceHeaderProps> = ({
  projectId,
  userId,
  userName,
  userRole,
  presences,
  currentTab,
}) => {
  const [myStatus, setMyStatus] = useState<PresenceStatus>('Online');
  const [customStatus, setCustomStatus] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Other participants presence list (deduplicated by userId, keeping most recent)
  const otherPresences = React.useMemo(() => {
    const map = new Map<string, WorkspacePresence>();
    presences
      .filter((p) => p && p.userId && p.userId !== userId)
      .forEach((p) => {
        const existing = map.get(p.userId);
        if (!existing || new Date(p.lastSeen).getTime() > new Date(existing.lastSeen).getTime()) {
          map.set(p.userId, p);
        }
      });
    return Array.from(map.values());
  }, [presences, userId]);

  const handleStatusChange = async (newStatus: PresenceStatus) => {
    setMyStatus(newStatus);
    setShowStatusMenu(false);
    await dbService.updateUserPresence(
      projectId,
      userId,
      userName,
      userRole,
      newStatus,
      'idle',
      customStatus || undefined,
      currentTab
    );
  };

  const getStatusColor = (status: PresenceStatus) => {
    switch (status) {
      case 'Online': return 'bg-emerald-500 text-emerald-500';
      case 'Away': return 'bg-amber-500 text-amber-500';
      case 'Busy': return 'bg-rose-500 text-rose-500';
      case 'In Meeting': return 'bg-purple-500 text-purple-500';
      default: return 'bg-gray-400 text-gray-400';
    }
  };

  const formatActivityText = (p: WorkspacePresence) => {
    if (p.currentActivity === 'typing') return `${p.userName} is typing a message...`;
    if (p.currentActivity === 'uploading_files') return `${p.userName} is uploading a file...`;
    if (p.currentActivity === 'editing_contract') return `${p.userName} is editing the contract...`;
    if (p.currentActivity === 'reviewing_deliverables') return `${p.userName} is reviewing a deliverable...`;
    if (p.currentActivity === 'viewing_files') return `${p.userName} is viewing vault files...`;
    if (p.currentActivity === 'in_video_call') return `${p.userName} is in a video call...`;
    if (p.activityDetails) return `${p.userName}: ${p.activityDetails}`;
    return `${p.userName} is active`;
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 border-b border-brand-border/60 dark:border-slate-800 px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Active Teammate Status & Live Activity Ticker */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-brand-border/40">
          <Wifi className="w-3.5 h-3.5 text-brand-teal animate-pulse" />
          <span className="font-extrabold text-brand-midnight dark:text-slate-200">Real-Time Presence</span>
        </div>

        {/* Other participants */}
        <div className="flex items-center gap-3">
          {otherPresences.length === 0 ? (
            <span className="text-gray-400 text-[11px] italic flex items-center gap-1">
              <Clock className="w-3 h-3" /> Waiting for teammate to join...
            </span>
          ) : (
            otherPresences.map((p, idx) => {
              const colorClass = getStatusColor(p.status);
              const isActiveTicker = p.currentActivity && p.currentActivity !== 'idle';

              return (
                <div
                  key={`${p.userId || 'presence'}-${idx}`}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-xl border border-brand-border/40"
                  title={`Last seen: ${new Date(p.lastSeen).toLocaleTimeString()}`}
                >
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-brand-teal/20 text-brand-teal font-extrabold flex items-center justify-center text-[10px] uppercase">
                      {p.userName.slice(0, 2)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${colorClass.split(' ')[0]}`} />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 font-bold text-brand-midnight dark:text-slate-200 text-[11px]">
                      <span>{p.userName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-200 dark:bg-slate-700 font-mono text-gray-600 dark:text-slate-300 capitalize">
                        {p.userRole}
                      </span>
                    </div>

                    {isActiveTicker ? (
                      <span className="text-[10px] text-brand-teal font-medium flex items-center gap-1 animate-pulse">
                        <Activity className="w-2.5 h-2.5" />
                        {formatActivityText(p)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 capitalize">
                        {p.status} {p.customStatusMessage ? `• ${p.customStatusMessage}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* My Presence Control Pill */}
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="px-3 py-1.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-brand-midnight dark:text-slate-200 font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(myStatus).split(' ')[0]}`} />
          <span>My Status: {myStatus}</span>
        </button>

        {showStatusMenu && (
          <div className="absolute right-0 top-10 z-50 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-brand-border dark:border-slate-800 shadow-xl p-2 space-y-1">
            {(['Online', 'Away', 'Busy', 'In Meeting', 'Offline'] as PresenceStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 cursor-pointer ${
                  myStatus === st ? 'bg-brand-teal/10 text-brand-teal' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${getStatusColor(st).split(' ')[0]}`} />
                <span>{st}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
