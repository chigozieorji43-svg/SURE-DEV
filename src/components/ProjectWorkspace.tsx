import React, { useState, useEffect } from 'react';
import { 
  ManagedProject, ContractMessage, ContractFile, ContractMilestone, 
  ContractDeliverable, KanbanTask, ContractMeeting, ContractChangeRequest, 
  ContractDispute, ProjectTimelineEvent, ExtendedReview, WorkspacePresence,
  WorkspaceBookmark, WorkspaceFavorite, RecentItem, WorkspaceAccessLog
} from '../types';
import { dbService } from '../lib/firebaseService';

// Sub-components
import { ContractOverview } from './workspace/ContractOverview';
import { RealtimeChat } from './workspace/RealtimeChat';
import { VideoAudioMeeting } from './workspace/VideoAudioMeeting';
import { FileManager } from './workspace/FileManager';
import { MilestoneTracker } from './workspace/MilestoneTracker';
import { DeliverablesVault } from './workspace/DeliverablesVault';
import { KanbanBoard } from './workspace/KanbanBoard';
import { ActivityTimeline } from './workspace/ActivityTimeline';
import { ProjectCalendar } from './workspace/ProjectCalendar';
import { WorkspaceAIAssistant } from './workspace/WorkspaceAIAssistant';
import { ContractReviews } from './workspace/ContractReviews';
import { DisputeCenter } from './workspace/DisputeCenter';
import { ProjectDashboardOverview } from './workspace/ProjectDashboardOverview';

// Enterprise Collaboration Modules
import { WorkspacePresenceHeader } from './workspace/WorkspacePresenceHeader';
import { WorkspaceHealthMonitor } from './workspace/WorkspaceHealthMonitor';
import { WorkspaceSearchModal } from './workspace/WorkspaceSearchModal';
import { WorkspaceQuickAccessDrawer } from './workspace/WorkspaceQuickAccessDrawer';
import { WorkspaceAnalytics } from './workspace/WorkspaceAnalytics';
import { WorkspaceSecurityPanel } from './workspace/WorkspaceSecurityPanel';
import { CallOverlay } from './workspace/CallOverlay';

import { 
  LayoutDashboard, MessageSquare, Kanban, Target, PackageCheck, 
  FolderGit2, Video, Calendar, History, Star, ShieldAlert, FileText, 
  ArrowLeft, Lock, ShieldCheck, Search, Bookmark, Activity, BarChart3, Archive, Unlock
} from 'lucide-react';

interface ProjectWorkspaceProps {
  project: ManagedProject;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer';
  onBack: () => void;
  allProjects?: ManagedProject[];
  onSelectProject?: (proj: ManagedProject) => void;
  initialTab?: string;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  userId,
  userName,
  userRole,
  onBack,
  allProjects = [],
  onSelectProject,
  initialTab = 'dashboard',
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Workspace Real-time Data Collections State
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [files, setFiles] = useState<ContractFile[]>([]);
  const [milestones, setMilestones] = useState<ContractMilestone[]>([]);
  const [deliverables, setDeliverables] = useState<ContractDeliverable[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [meetings, setMeetings] = useState<ContractMeeting[]>([]);
  const [changeRequests, setChangeRequests] = useState<ContractChangeRequest[]>([]);
  const [disputes, setDisputes] = useState<ContractDispute[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<ProjectTimelineEvent[]>([]);
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);

  // Collaboration Enterprise States
  const [presences, setPresences] = useState<WorkspacePresence[]>([]);
  const [bookmarks, setBookmarks] = useState<WorkspaceBookmark[]>([]);
  const [favorites, setFavorites] = useState<WorkspaceFavorite[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [accessLogs, setAccessLogs] = useState<WorkspaceAccessLog[]>([]);

  // Modals / Overlays
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');

  // Call state (Audio & Video WebRTC Sessions)
  const [outgoingCall, setOutgoingCall] = useState<{
    projectId: string;
    projectTitle: string;
    callType: 'audio' | 'video';
    receiverId: string;
    receiverName: string;
    receiverRole: 'employer' | 'developer';
    receiverAvatar?: string;
  } | null>(null);

  const isReadOnly = project.status === 'Completed' || project.status === 'Cancelled' || project.isArchived;

  // Record access log on workspace open
  useEffect(() => {
    dbService.logWorkspaceAccess({
      projectId: project.id,
      userId,
      userName,
      userRole,
      action: 'ENTER_WORKSPACE',
      status: 'success'
    });
  }, [project.id, userId]);

  // Firestore Subscriptions
  useEffect(() => {
    const unsubMsgs = dbService.subscribeContractMessages(project.id, setMessages);
    const unsubFiles = dbService.subscribeContractFiles(project.id, setFiles);
    const unsubMilestones = dbService.subscribeContractMilestones(project.id, setMilestones);
    const unsubDeliverables = dbService.subscribeContractDeliverables(project.id, setDeliverables);
    const unsubTasks = dbService.subscribeContractTasks(project.id, setTasks);
    const unsubMeetings = dbService.subscribeContractMeetings(project.id, setMeetings);
    const unsubRequests = dbService.subscribeContractChangeRequests(project.id, setChangeRequests);
    const unsubDisputes = dbService.subscribeContractDisputes(project.id, setDisputes);
    const unsubTimeline = dbService.subscribeProjectTimeline(project.id, setTimelineEvents);
    const unsubReviews = dbService.subscribeContractReviews(project.id, setReviews);

    // Collaboration subscriptions
    const unsubPresence = dbService.subscribeWorkspacePresence(project.id, setPresences);
    const unsubBookmarks = dbService.subscribeWorkspaceBookmarks(project.id, userId, setBookmarks);
    const unsubFavorites = dbService.subscribeWorkspaceFavorites(project.id, userId, setFavorites);
    const unsubRecents = dbService.subscribeRecentItems(project.id, userId, setRecentItems);
    const unsubLogs = dbService.subscribeWorkspaceAccessLogs(project.id, setAccessLogs);

    return () => {
      unsubMsgs();
      unsubFiles();
      unsubMilestones();
      unsubDeliverables();
      unsubTasks();
      unsubMeetings();
      unsubRequests();
      unsubDisputes();
      unsubTimeline();
      unsubReviews();
      unsubPresence();
      unsubBookmarks();
      unsubFavorites();
      unsubRecents();
      unsubLogs();
    };
  }, [project.id, userId]);

  // Heartbeat Presence Ping & Tab Visibility / Unload Lifecycle
  useEffect(() => {
    const pingPresence = (status: 'Online' | 'Away' | 'Offline' = 'Online') => {
      dbService.updateUserPresence(
        project.id,
        userId,
        userName,
        userRole,
        status,
        'idle',
        undefined,
        activeTab
      );
    };

    pingPresence('Online');
    const interval = setInterval(() => pingPresence('Online'), 25000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pingPresence('Away');
      } else {
        pingPresence('Online');
      }
    };

    const handleBeforeUnload = () => {
      pingPresence('Offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [project.id, userId, userName, userRole, activeTab]);

  // Shortcut Listener Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleArchive = async () => {
    if (project.isArchived) {
      if (confirm("Restore this workspace to active mode?")) {
        await dbService.restoreWorkspace(project.id, userId, userName, userRole);
      }
    } else {
      if (confirm("Archive this workspace? Archived workspaces remain viewable in Read-Only mode.")) {
        await dbService.archiveWorkspace(project.id, userId, userName, userRole);
      }
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'contract', label: 'Contract Spec', icon: FileText },
    { id: 'chat', label: 'Realtime Chat', icon: MessageSquare, badge: messages.length },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban, badge: tasks.length },
    { id: 'milestones', label: 'Milestones', icon: Target, badge: milestones.length },
    { id: 'deliverables', label: 'Deliverables', icon: PackageCheck, badge: deliverables.length },
    { id: 'files', label: 'Vault Files', icon: FolderGit2, badge: files.length },
    { id: 'meeting', label: 'Video & Audio', icon: Video, badge: meetings.filter(m => m.status === 'scheduled').length },
    { id: 'calendar', label: 'Schedule', icon: Calendar },
    { id: 'timeline', label: 'Activity Log', icon: History, badge: timelineEvents.length },
    { id: 'reviews', label: 'Reviews', icon: Star, badge: reviews.length },
    { id: 'disputes', label: 'Dispute Center', icon: ShieldAlert, badge: disputes.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 text-brand-midnight dark:text-slate-100 flex flex-col relative">
      {/* Session Lock Overlay */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-brand-midnight dark:text-white font-display">
                Workspace Session Locked
              </h3>
              <p className="text-xs text-gray-500">
                Enter PIN or password to resume real-time collaboration.
              </p>
            </div>
            <input
              type="password"
              value={unlockPin}
              onChange={(e) => setUnlockPin(e.target.value)}
              placeholder="Enter PIN (e.g. 1234)"
              className="w-full text-center py-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-brand-border text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
            <button
              onClick={() => { setIsLocked(false); setUnlockPin(''); }}
              className="w-full py-3 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity"
            >
              Unlock Workspace
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-brand-border/60 dark:border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="h-5 w-[1px] bg-gray-300 dark:bg-slate-700 hidden sm:block" />

          <div>
            <h2 className="text-sm md:text-base font-extrabold font-display text-brand-midnight dark:text-white flex items-center gap-2">
              {project.title}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                project.status === 'Active' || project.status === 'Accepted'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : project.status === 'Pending'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : project.status === 'Completed'
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                {project.status === 'Accepted' ? 'Active' : project.status}
              </span>
              {isReadOnly && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Archived / Read-Only
                </span>
              )}
            </h2>
            <div className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-2">
              <span>{userRole === 'employer' ? `Developer: ${project.developerName}` : `Employer: ${project.employerName}`}</span>
              <span>•</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure Enterprise Sync
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Header Controls */}
        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            title="Search Workspace (Cmd+K)"
          >
            <Search className="w-4 h-4 text-brand-teal" />
            <span className="hidden lg:inline text-[11px]">Search (Cmd+K)</span>
          </button>

          {/* Quick Access Bookmarks Hub */}
          <button
            onClick={() => setIsQuickAccessOpen(true)}
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors relative"
            title="Bookmarks & Favorites"
          >
            <Bookmark className="w-4 h-4 text-amber-500" />
            {(bookmarks.length > 0 || favorites.length > 0) && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5" />
            )}
          </button>

          {/* Health Diagnostics Monitor */}
          <button
            onClick={() => setIsHealthOpen(true)}
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            title="Workspace Health & Ping"
          >
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          </button>

          {/* Security Panel */}
          <button
            onClick={() => setIsSecurityOpen(true)}
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            title="Security Audit & Sessions"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </button>

          {/* Archive Workspace Action */}
          <button
            onClick={handleToggleArchive}
            className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            title={project.isArchived ? "Restore Workspace" : "Archive Workspace"}
          >
            <Archive className="w-4 h-4 text-rose-500" />
          </button>
        </div>
      </header>

      {/* Real-time Presence Header Bar */}
      <WorkspacePresenceHeader
        projectId={project.id}
        userId={userId}
        userName={userName}
        userRole={userRole}
        presences={presences}
        currentTab={activeTab}
      />

      {/* Primary Workspace Layout */}
      <div className={`flex-1 flex flex-col md:flex-row w-full mx-auto p-3 md:p-6 gap-6 transition-all ${activeTab === 'chat' ? 'max-w-[1700px]' : 'max-w-7xl'}`}>
        {/* Tab Navigation Sidebar / Horizontal Bar */}
        <nav className="w-full md:w-64 shrink-0 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm h-fit overflow-x-auto flex md:flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between gap-3 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight shadow-sm'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-teal dark:text-brand-midnight' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                    isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-brand-midnight' : 'bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab Content Display Area */}
        <main className="flex-1 space-y-6">
          {activeTab === 'dashboard' && (
            <ProjectDashboardOverview
              project={project}
              milestones={milestones}
              files={files}
              tasks={tasks}
              meetings={meetings}
              events={timelineEvents}
              userRole={userRole}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'analytics' && (
            <WorkspaceAnalytics
              project={project}
              messages={messages}
              files={files}
              milestones={milestones}
              deliverables={deliverables}
              tasks={tasks}
              meetings={meetings}
            />
          )}

          {activeTab === 'contract' && (
            <ContractOverview
              project={project}
              userRole={userRole}
              userId={userId}
              userName={userName}
              changeRequests={changeRequests}
              isReadOnly={isReadOnly}
            />
          )}

          {activeTab === 'chat' && (
            <div className="h-[calc(100vh-160px)] min-h-[500px] sm:min-h-[600px] w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm">
              <RealtimeChat
                projectId={project.id}
                projectTitle={project.title}
                project={project}
                userId={userId}
                userName={userName}
                userRole={userRole}
                isReadOnly={isReadOnly}
                allProjects={allProjects}
                onSelectProject={onSelectProject}
                onNavigateTab={(tab) => setActiveTab(tab)}
                milestones={milestones}
                deliverables={deliverables}
                files={files}
                tasks={tasks}
                meetings={meetings}
                presences={presences}
                onStartCall={(callData) => setOutgoingCall(callData)}
              />
            </div>
          )}

          {activeTab === 'kanban' && (
            <KanbanBoard
              projectId={project.id}
              projectTitle={project.title}
              userId={userId}
              userName={userName}
              userRole={userRole}
              tasks={tasks}
              isReadOnly={isReadOnly}
            />
          )}

          {activeTab === 'milestones' && (
            <MilestoneTracker
              projectId={project.id}
              projectTitle={project.title}
              userId={userId}
              userName={userName}
              userRole={userRole}
              milestones={milestones}
              isReadOnly={isReadOnly}
            />
          )}

          {activeTab === 'deliverables' && (
            <DeliverablesVault
              projectId={project.id}
              projectTitle={project.title}
              userId={userId}
              userName={userName}
              userRole={userRole}
              deliverables={deliverables}
              isReadOnly={isReadOnly}
            />
          )}

          {activeTab === 'files' && (
            <FileManager
              projectId={project.id}
              projectTitle={project.title}
              userId={userId}
              userName={userName}
              userRole={userRole}
              files={files}
              isReadOnly={isReadOnly}
            />
          )}

          {activeTab === 'meeting' && (
            <VideoAudioMeeting
              projectId={project.id}
              projectTitle={project.title}
              project={project}
              userId={userId}
              userName={userName}
              userRole={userRole}
              meetings={meetings}
              isReadOnly={isReadOnly}
              onStartCall={(callData) => setOutgoingCall(callData)}
            />
          )}

          {activeTab === 'calendar' && (
            <ProjectCalendar
              project={project}
              milestones={milestones}
              meetings={meetings}
            />
          )}

          {activeTab === 'timeline' && (
            <ActivityTimeline events={timelineEvents} />
          )}

          {activeTab === 'reviews' && (
            <ContractReviews
              project={project}
              userId={userId}
              userName={userName}
              userRole={userRole}
              reviews={reviews}
            />
          )}

          {activeTab === 'disputes' && (
            <DisputeCenter
              project={project}
              userId={userId}
              userName={userName}
              userRole={userRole}
              disputes={disputes}
              isReadOnly={isReadOnly}
            />
          )}
        </main>
      </div>

      {/* AI Assistant Floating Widget */}
      <WorkspaceAIAssistant
        project={project}
        userRole={userRole}
        messages={messages}
        milestones={milestones}
      />

      {/* Enterprise Collaboration Overlay Modals */}
      <WorkspaceSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        project={project}
        messages={messages}
        files={files}
        milestones={milestones}
        deliverables={deliverables}
        tasks={tasks}
        meetings={meetings}
        disputes={disputes}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      <WorkspaceQuickAccessDrawer
        isOpen={isQuickAccessOpen}
        onClose={() => setIsQuickAccessOpen(false)}
        bookmarks={bookmarks}
        favorites={favorites}
        recentItems={recentItems}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      <WorkspaceHealthMonitor
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />

      <WorkspaceSecurityPanel
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        userRole={userRole}
        logs={accessLogs}
        onLockWorkspace={() => {
          setIsSecurityOpen(false);
          setIsLocked(true);
        }}
      />

      {/* Real-time WebRTC Audio & Video Calling Overlay */}
      <CallOverlay
        currentUserId={userId}
        currentUserName={userName}
        currentUserRole={userRole}
        activeProject={project}
        outgoingCallData={outgoingCall}
        onCloseCall={() => setOutgoingCall(null)}
      />
    </div>
  );
};
