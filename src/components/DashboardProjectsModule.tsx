import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Clock,
  CheckCircle2,
  Star,
  AlertTriangle,
  ChevronRight,
  Filter,
  Search,
  Check,
  X,
  Eye,
  ShieldAlert,
  MessageSquare,
  DollarSign,
  Calendar,
  Building,
  User
} from 'lucide-react';
import {
  ManagedProject,
  Review,
  Complaint,
  ProjectStatus
} from '../types';
import { dbService } from '../lib/firebaseService';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { ProjectWorkspace } from './ProjectWorkspace';

interface DashboardProjectsModuleProps {
  userRole: 'employer' | 'developer';
  userId: string;
  userName: string;
  activeSection?: 'projects' | 'reviews' | 'complaints';
}

export const DashboardProjectsModule: React.FC<DashboardProjectsModuleProps> = ({
  userRole,
  userId,
  userName,
  activeSection = 'projects'
}) => {
  const [currentTab, setCurrentTab] = useState<'projects' | 'reviews' | 'complaints'>(activeSection);
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [allProjects, setAllProjects] = useState<ManagedProject[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);

  const [selectedProject, setSelectedProject] = useState<ManagedProject | null>(null);
  const [activeWorkspaceProject, setActiveWorkspaceProject] = useState<ManagedProject | null>(null);
  const [initialWorkspaceTab, setInitialWorkspaceTab] = useState<string>('dashboard');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    setCurrentTab(activeSection);
  }, [activeSection]);

  useEffect(() => {
    const unsubProj = dbService.subscribeManagedProjects((projects) => {
      const userProjs = projects.filter(p => userRole === 'employer' ? p.employerId === userId : p.developerId === userId);
      setAllProjects(userProjs);
    });

    const unsubRev = dbService.subscribeProjectReviews((reviews) => {
      const userRevs = reviews.filter(r => r.targetUserId === userId || r.reviewerId === userId);
      setAllReviews(userRevs);
    });

    const unsubCmp = dbService.subscribeComplaints((complaints) => {
      const userCmps = complaints.filter(c => c.complainantId === userId || c.respondentId === userId);
      setAllComplaints(userCmps);
    });

    return () => {
      unsubProj();
      unsubRev();
      unsubCmp();
    };
  }, [userId, userRole]);

  // Derived Summary Metrics
  const totalProjects = allProjects.length;
  const pendingProjects = allProjects.filter(p => p.status === 'Pending').length;
  const activeProjects = allProjects.filter(p => p.status === 'Accepted' || p.status === 'Active').length;
  const completedProjects = allProjects.filter(p => p.status === 'Completed').length;

  const targetUserReviews = allReviews.filter(r => r.targetUserId === userId);
  const hasReviews = targetUserReviews.length > 0;
  const avgRating = hasReviews
    ? (targetUserReviews.reduce((sum, r) => sum + r.rating, 0) / targetUserReviews.length).toFixed(1)
    : null;

  const openComplaints = allComplaints.filter(c => c.status === 'Open' || c.status === 'Under Review').length;

  if (activeWorkspaceProject) {
    return (
      <ProjectWorkspace
        project={activeWorkspaceProject}
        userId={userId}
        userName={userName}
        userRole={userRole}
        onBack={() => {
          setActiveWorkspaceProject(null);
          setInitialWorkspaceTab('dashboard');
        }}
        allProjects={allProjects}
        onSelectProject={(p) => setActiveWorkspaceProject(p)}
        initialTab={initialWorkspaceTab}
      />
    );
  }

  // Filtered Projects
  const filteredProjects = allProjects.filter(p => {
    const matchesFilter = projectStatusFilter === 'All' ? true : p.status === projectStatusFilter;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.developerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenDetails = (proj: ManagedProject) => {
    setSelectedProject(proj);
    setIsDetailsModalOpen(true);
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Pending</span>;
      case 'Accepted':
      case 'Active':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Completed</span>;
      case 'Declined':
      case 'Cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">{status}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Summary Cards Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Projects */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Projects</span>
            <Briefcase className="w-4 h-4 text-brand-green" />
          </div>
          <div className="mt-2 text-xl font-bold font-display text-brand-midnight dark:text-white">
            {totalProjects}
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-display text-amber-600 dark:text-amber-400">
            {pendingProjects}
          </div>
        </div>

        {/* Active */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-display text-emerald-600 dark:text-emerald-400">
            {activeProjects}
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-display text-blue-600 dark:text-blue-400">
            {completedProjects}
          </div>
        </div>

        {/* Average Rating */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Avg Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-display text-brand-midnight dark:text-white flex items-center gap-1">
            {avgRating ? (
              <>
                {avgRating} <span className="text-xs text-gray-400 font-normal">/ 5.0 ({targetUserReviews.length})</span>
              </>
            ) : (
              <span className="text-xs font-semibold text-gray-400">Unrated</span>
            )}
          </div>
        </div>

        {/* Open Complaints */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Complaints</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-display text-rose-600 dark:text-rose-400">
            {openComplaints}
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border dark:border-slate-800 pb-3">
        <button
          onClick={() => setCurrentTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            currentTab === 'projects'
              ? 'bg-brand-midnight text-white shadow-sm'
              : 'bg-brand-warm-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-brand-midnight'
          }`}
        >
          Managed Projects ({allProjects.length})
        </button>
        <button
          onClick={() => setCurrentTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            currentTab === 'reviews'
              ? 'bg-brand-midnight text-white shadow-sm'
              : 'bg-brand-warm-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-brand-midnight'
          }`}
        >
          Reviews & Feedback ({allReviews.length})
        </button>
        <button
          onClick={() => setCurrentTab('complaints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            currentTab === 'complaints'
              ? 'bg-brand-midnight text-white shadow-sm'
              : 'bg-brand-warm-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-brand-midnight'
          }`}
        >
          Issue Reports ({allComplaints.length})
        </button>
      </div>

      {/* 3. Tab Content Area */}
      {currentTab === 'projects' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-brand-warm-white/60 dark:bg-slate-800/40 p-3 rounded-2xl border border-brand-border dark:border-slate-800">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['All', 'Pending', 'Active', 'Completed', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setProjectStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    projectStatusFilter === status
                      ? 'bg-brand-green text-white shadow-sm'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects or participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-700 text-xs text-brand-midnight dark:text-slate-100 outline-none focus:border-brand-green"
              />
            </div>
          </div>

          {/* Projects List */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-slate-800 p-8 space-y-3">
              <Briefcase className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto stroke-[1.5]" />
              <h4 className="text-sm font-bold text-brand-midnight dark:text-slate-200">No Projects Found</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                {userRole === 'employer'
                  ? 'Click "Hire Developer" on any developer profile in the directory to initiate a project proposal.'
                  : 'You have no assigned project contracts matching your active search filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj, idx) => (
                <div
                  key={proj.id ? `${proj.id}-${idx}` : idx}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-border dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {getStatusBadge(proj.status)}
                      <span className="text-[10px] text-gray-400 font-mono">{proj.id}</span>
                    </div>

                    <h3 
                      onClick={() => {
                        setInitialWorkspaceTab('dashboard');
                        setActiveWorkspaceProject(proj);
                      }}
                      className="text-base font-bold font-display text-brand-midnight dark:text-white line-clamp-1 cursor-pointer hover:text-brand-green transition-colors"
                    >
                      {proj.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {proj.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-brand-border/60 dark:border-slate-800 space-y-1.5 text-xs text-gray-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Participant:</span>
                        <span className="font-semibold text-brand-midnight dark:text-slate-200">
                          {userRole === 'employer' ? proj.developerName : proj.employerName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Budget:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {proj.budget || 'Negotiable'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Deadline:</span>
                        <span className="font-semibold">{proj.deadline || 'Flexible'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-brand-border/40 dark:border-slate-800">
                    <span className="text-[10px] text-gray-400">
                      Created: {new Date(proj.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDetails(proj)}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="View Contract Specs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Specs
                      </button>

                      <button
                        onClick={() => {
                          setInitialWorkspaceTab('dashboard');
                          setActiveWorkspaceProject(proj);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs hover:opacity-90"
                      >
                        <Briefcase className="w-3.5 h-3.5" /> Workspace
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB */}
      {currentTab === 'reviews' && (
        <div className="space-y-4">
          {allReviews.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-slate-800 p-8 space-y-2">
              <Star className="w-10 h-10 text-gray-300 dark:text-slate-700 mx-auto stroke-[1.5]" />
              <h4 className="text-sm font-bold text-brand-midnight dark:text-slate-200">No Reviews Recorded</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Reviews will automatically appear here once projects are completed and rated by participants.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allReviews.map((rev, idx) => (
                <div
                  key={rev.id ? `${rev.id}-${idx}` : idx}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-brand-border dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-300 dark:text-slate-700'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-brand-midnight dark:text-white">{rev.title}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-300">{rev.comment}</p>
                  <div className="text-[10px] text-gray-400 pt-1 flex items-center gap-2">
                    <span>Project: <strong>{rev.projectTitle}</strong></span>
                    <span>•</span>
                    <span>By: <strong>{rev.reviewerName}</strong> ({rev.reviewerRole})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPLAINTS TAB */}
      {currentTab === 'complaints' && (
        <div className="space-y-4">
          {allComplaints.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-slate-800 p-8 space-y-2">
              <ShieldAlert className="w-10 h-10 text-emerald-500/60 mx-auto stroke-[1.5]" />
              <h4 className="text-sm font-bold text-brand-midnight dark:text-slate-200">Clean Dispute Ledger</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                There are no open or closed complaints logged against your project engagements.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allComplaints.map((cmp, idx) => (
                <div
                  key={cmp.id ? `${cmp.id}-${idx}` : idx}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-500/20 dark:border-rose-950 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{cmp.reason}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      Status: {cmp.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-slate-300">{cmp.description}</p>
                  <div className="text-[10px] text-gray-400 pt-1 flex items-center justify-between">
                    <span>Project: <strong>{cmp.projectTitle}</strong> | Reported by: <strong>{cmp.complainantName}</strong></span>
                    <span>Logged: {new Date(cmp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      <ProjectDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        project={selectedProject}
        currentUserId={userId}
        userRole={userRole}
        userName={userName}
      />
    </div>
  );
};
