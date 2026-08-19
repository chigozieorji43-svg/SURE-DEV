import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Calendar, DollarSign, Tag, Clock, Building2, 
  Eye, Search, Sparkles, Filter, Loader2, AlertCircle, 
  X, CheckCircle2, ArrowRight, Layers, ShieldCheck, Plus,
  Image as ImageIcon
} from 'lucide-react';
import { ProjectPost, ProjectApplication, UserSession } from '../types';
import { dbService } from '../lib/firebaseService';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './UserAvatar';
import { ImageViewerModal } from './ImageViewerModal';

interface FindWorkProps {
  userSession: UserSession | null;
  onNavigateToPostProject?: () => void;
  onNavigateToEmployers?: () => void;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const FindWork: React.FC<FindWorkProps> = ({
  userSession,
  onNavigateToPostProject,
  onNavigateToEmployers
}) => {
  const { firebaseUser, role, developerProfile, userDoc } = useAuth();
  const [posts, setPosts] = useState<ProjectPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  
  // View Project Detail Modal
  const [selectedProject, setSelectedProject] = useState<ProjectPost | null>(null);

  // Fullscreen Image Lightbox Viewer State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxTitle, setLightboxTitle] = useState('');

  const handleOpenLightbox = (images: string[], index: number = 0, title?: string) => {
    const validImgs = images.filter(img => typeof img === 'string' && img.trim().length > 0);
    if (validImgs.length > 0) {
      setLightboxImages(validImgs);
      setLightboxIndex(index);
      setLightboxTitle(title || '');
      setLightboxOpen(true);
    }
  };

  // Developer Applications state
  const [developerApplications, setDeveloperApplications] = useState<ProjectApplication[]>([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [proposal, setProposal] = useState('');
  const [experience, setExperience] = useState('');
  const [completionTime, setCompletionTime] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  const isDeveloper = role === 'developer' || userSession?.accountType === 'developer';
  const currentDevUid = firebaseUser?.uid || userSession?.developerProfileId;

  // Subscribe to developer applications when logged in as a developer
  useEffect(() => {
    if (currentDevUid && isDeveloper) {
      const unsub = dbService.subscribeDeveloperApplications(currentDevUid, (apps) => {
        setDeveloperApplications(apps);
      });
      return () => unsub();
    }
  }, [currentDevUid, isDeveloper]);

  // Reset application form when selected project changes
  useEffect(() => {
    if (selectedProject) {
      setShowApplyForm(false);
      setProposal('');
      setExperience('');
      setCompletionTime(selectedProject.deadline || '2 weeks');
      setProposedBudget(selectedProject.budget || '');
      setAppError(null);
    }
  }, [selectedProject]);

  const handleOpenApplyForm = () => {
    setShowApplyForm(true);
    setAppError(null);
  };

  const handleCancelApplyForm = () => {
    setShowApplyForm(false);
    setAppError(null);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      setAppError('Please select a valid project opportunity.');
      return;
    }

    const devUid = firebaseUser?.uid || currentDevUid;
    if (!devUid) {
      setAppError('You must be logged in as an authenticated developer to submit an application.');
      return;
    }

    if (!proposal.trim()) {
      setAppError('Please enter a proposal/cover message.');
      return;
    }

    setIsSubmittingApp(true);
    setAppError(null);

    try {
      const devName = developerProfile?.name || userDoc?.name || firebaseUser?.displayName || userSession?.email || 'Developer';
      const devImg = developerProfile?.avatar || userDoc?.photoURL || firebaseUser?.photoURL || userSession?.profileImageUrl || undefined;

      const newApp = await dbService.submitProjectApplication({
        projectId: selectedProject.id,
        employerId: selectedProject.employerId,
        developerId: devUid,
        developerName: devName,
        developerProfileImage: devImg,
        projectTitle: selectedProject.title,
        proposal: proposal.trim(),
        experience: experience.trim() || undefined,
        estimatedCompletionTime: completionTime.trim() || undefined,
        proposedBudget: proposedBudget.trim() || undefined,
      });

      // Update state
      setDeveloperApplications(prev => [newApp, ...prev.filter(a => a.id !== newApp.id)]);
      setShowApplyForm(false);
    } catch (err: any) {
      console.error("Failed to submit project application:", err);
      setAppError(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const fetchProjectPosts = () => {
    setLoading(true);
    setError(null);

    const unsubscribe = dbService.subscribeProjectPosts((livePosts) => {
      try {
        // Filter ONLY posts where status = "active" (or "open") AND visibility = "public" (or undefined/not private)
        const activePublicPosts = (livePosts || []).filter(post => {
          const isActive = post.status === 'active' || post.status === 'open';
          const isPublic = !post.visibility || post.visibility === 'public';
          return isActive && isPublic;
        });

        // Sort newest projects first using createdAt
        activePublicPosts.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        setPosts(activePublicPosts);
        setLoading(false);
      } catch (err: any) {
        console.error("Error processing project posts:", err);
        setError("Failed to load project posts. Please try again.");
        setLoading(false);
      }
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = fetchProjectPosts();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Collect unique skills across all posts for tag filter chips
  const allSkills = Array.from(
    new Set(posts.flatMap(p => p.skills || []))
  ).filter(Boolean);

  // Filtered posts based on search query and selected skill
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery.trim() === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.employerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.skills && post.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesSkill = !selectedSkill || (post.skills && post.skills.includes(selectedSkill));

    return matchesSearch && matchesSkill;
  });

  return (
    <div className="min-h-screen bg-brand-warm-white dark:bg-slate-950 pt-20 pb-16 px-4 sm:px-8 lg:px-12 w-full">
      <div className="max-w-7xl mx-auto">
        
        {/* Clean Natural Page Header */}
        <div className="mb-8 border-b border-gray-200 dark:border-slate-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-brand-midnight dark:text-white">
              Find Work
            </h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">
              Browse active project opportunities posted by employers.
            </p>
          </div>
          {onNavigateToEmployers && (
            <button
              onClick={onNavigateToEmployers}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              Browse Employer Profiles →
            </button>
          )}
        </div>

        {/* Search Bar & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, description, company, or tech stack..."
              className="w-full pl-12 pr-10 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-xl text-sm font-medium text-brand-midnight dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skill Tag Filters */}
          {allSkills.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              <button
                onClick={() => setSelectedSkill(null)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedSkill === null
                    ? 'bg-brand-midnight text-white dark:bg-emerald-500 dark:text-slate-950'
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-800 hover:border-gray-300'
                }`}
              >
                All
              </button>
              {allSkills.map((skill, idx) => (
                <button
                  key={`${skill}-${idx}`}
                  onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    selectedSkill === skill
                      ? 'bg-brand-green text-white dark:bg-emerald-500 dark:text-slate-950'
                      : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-800 hover:border-gray-300'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FEED CONTENT AREA */}
        {loading ? (
          /* Loading State */
          <div className="space-y-6">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin mb-3" />
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Loading project posts...
                </p>
              </div>
            </div>

            {/* Skeleton Placeholders */}
            {[1, 2, 3].map(i => (
              <div key={`find-work-skeleton-${i}`} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-800" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-gray-200 dark:bg-slate-800 rounded" />
                    <div className="w-20 h-3 bg-gray-100 dark:bg-slate-800/60 rounded" />
                  </div>
                </div>
                <div className="w-3/4 h-5 bg-gray-200 dark:bg-slate-800 rounded mb-3" />
                <div className="space-y-2 mb-4">
                  <div className="w-full h-4 bg-gray-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-8 text-center max-w-xl mx-auto my-10">
            <div className="w-10 h-10 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200 mb-1">
              Unable to Load Project Posts
            </h3>
            <p className="text-sm text-rose-700 dark:text-rose-300 mb-5">
              {error}
            </p>
            <button
              onClick={fetchProjectPosts}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              Retry Loading Projects
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-10 text-center max-w-xl mx-auto my-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-midnight dark:text-white mb-2">
              No projects available yet
            </h3>
            <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
              {searchQuery || selectedSkill
                ? 'No project posts match your search or filters.'
                : 'New projects will appear here as soon as employers create them.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {(searchQuery || selectedSkill) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSkill(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-medium text-sm transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}

              {userSession?.accountType === 'employer' && onNavigateToPostProject && (
                <button
                  onClick={onNavigateToPostProject}
                  className="px-5 py-2 rounded-lg bg-brand-green hover:bg-emerald-700 text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Post a New Project
                </button>
              )}
            </div>
          </div>
        ) : (
          /* PROJECT POSTS FEED - Clean, spacious layout */
          <div className="space-y-6">
            {filteredPosts.map((post, idx) => (
              <article
                key={post.id ? `${post.id}-${idx}` : idx}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 hover:border-gray-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Employer Info */}
                <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      email={post.employerName || 'Employer'}
                      src={post.employerProfileImage}
                      sizeClassName="w-10 h-10"
                      className="border border-gray-200 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-brand-midnight dark:text-white leading-tight">
                        {post.employerName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Posted {formatRelativeTime(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  {post.budget && (
                    <div className="hidden sm:block text-right">
                      <span className="text-xs text-gray-500 dark:text-slate-400 block">Budget</span>
                      <span className="text-sm font-bold text-brand-midnight dark:text-white">
                        {post.budget}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-brand-midnight dark:text-white leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {post.description}
                  </p>

                  {/* Image & Screenshots Gallery */}
                  {(() => {
                    const postImages = post.imageUrls && post.imageUrls.length > 0 
                      ? post.imageUrls 
                      : (post.imageUrl ? [post.imageUrl] : []);
                    
                    if (postImages.length === 0) return null;

                    return (
                      <div className="mt-4 space-y-2">
                        {/* Primary Image Preview */}
                        <div 
                          onClick={() => handleOpenLightbox(postImages, 0, post.title)}
                          className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 max-h-96 flex items-center justify-center group cursor-pointer"
                        >
                          <img
                            src={postImages[0]}
                            alt={post.title}
                            className="w-full h-auto max-h-96 object-contain group-hover:scale-[1.01] transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).parentElement!.style.display = 'none';
                            }}
                          />
                          {postImages.length > 1 && (
                            <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/70 text-white font-bold text-[10px] backdrop-blur-xs">
                              1 / {postImages.length}
                            </span>
                          )}
                        </div>

                        {/* Additional Screenshots Strip */}
                        {postImages.length > 1 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {postImages.map((img, idx) => (
                              <button
                                key={`${post.id}-screenshot-${idx}`}
                                type="button"
                                onClick={() => handleOpenLightbox(postImages, idx, post.title)}
                                className="relative w-16 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-brand-green transition-all shrink-0 cursor-pointer group shadow-xs"
                              >
                                <img
                                  src={img}
                                  alt={`${post.title} screenshot ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Mobile budget & deadline */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-slate-400 pt-1">
                    {post.budget && (
                      <span className="sm:hidden font-medium">Budget: <strong className="text-brand-midnight dark:text-white">{post.budget}</strong></span>
                    )}
                    {post.deadline && (
                      <span className="font-medium">Deadline: <strong className="text-brand-midnight dark:text-white">{post.deadline}</strong></span>
                    )}
                  </div>

                  {/* Skills Tags */}
                  {post.skills && post.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {post.skills.map((skill, idx) => (
                        <span
                          key={`${skill}-${idx}`}
                          className="px-2.5 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    Public Opportunity
                  </span>

                  <button
                    onClick={() => setSelectedProject(post)}
                    className="px-4 py-2 rounded-lg bg-brand-midnight hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* VIEW PROJECT DETAILS MODAL */}
        <AnimatePresence>
          {selectedProject && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center min-h-screen">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      email={selectedProject.employerName}
                      src={selectedProject.employerProfileImage}
                      sizeClassName="w-10 h-10"
                      className="border border-gray-200 dark:border-slate-700"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-brand-midnight dark:text-white">
                        {selectedProject.employerName}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Posted {formatRelativeTime(selectedProject.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                  <h2 className="text-2xl font-bold text-brand-midnight dark:text-white">
                    {selectedProject.title}
                  </h2>

                  {/* Project Screenshots & Cover Images Gallery */}
                  {(() => {
                    const modalImages = selectedProject.imageUrls && selectedProject.imageUrls.length > 0
                      ? selectedProject.imageUrls
                      : (selectedProject.imageUrl ? [selectedProject.imageUrl] : []);

                    if (modalImages.length === 0) return null;

                    return (
                      <div className="space-y-3">
                        {modalImages.length > 1 && (
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                            Project Screenshots ({modalImages.length})
                          </h3>
                        )}

                        {/* Main Cover Image Viewport */}
                        <div 
                          onClick={() => handleOpenLightbox(modalImages, 0, selectedProject.title)}
                          className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 max-h-80 flex items-center justify-center group cursor-pointer shadow-xs"
                        >
                          <img
                            src={modalImages[0]}
                            alt={selectedProject.title}
                            className="w-full h-auto max-h-80 object-contain group-hover:scale-[1.01] transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Gallery Thumbnails Strip */}
                        {modalImages.length > 1 && (
                          <div className="flex items-center gap-2 overflow-x-auto py-1">
                            {modalImages.map((img, idx) => (
                              <button
                                key={`modal-thumb-${selectedProject.id}-${idx}`}
                                type="button"
                                onClick={() => handleOpenLightbox(modalImages, idx, selectedProject.title)}
                                className="relative w-20 h-14 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-slate-700 hover:border-brand-green transition-all shrink-0 cursor-pointer group shadow-xs"
                              >
                                <img
                                  src={img}
                                  alt={`Screenshot ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {selectedProject.description}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                    {selectedProject.budget && (
                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800">
                        <span className="text-xs text-gray-500 dark:text-slate-400 block mb-0.5">
                          Budget
                        </span>
                        <span className="text-base font-bold text-brand-midnight dark:text-white">
                          {selectedProject.budget}
                        </span>
                      </div>
                    )}

                    {selectedProject.deadline && (
                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800">
                        <span className="text-xs text-gray-500 dark:text-slate-400 block mb-0.5">
                          Deadline
                        </span>
                        <span className="text-base font-bold text-brand-midnight dark:text-white">
                          {selectedProject.deadline}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {selectedProject.skills && selectedProject.skills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
                        Technologies & Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.skills.map((skill, i) => (
                          <span
                            key={`modal-skill-${skill}-${i}`}
                            className="px-2.5 py-1 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Application Status or Application Form Section */}
                  {selectedProject && (() => {
                    const existingApp = developerApplications.find(a => a.projectId === selectedProject.id);

                    if (existingApp) {
                      return (
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Application Submitted
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                existingApp.status === 'accepted'
                                  ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                  : existingApp.status === 'rejected'
                                  ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                                  : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                              }`}
                            >
                              {existingApp.status}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
                            You applied for this project {formatRelativeTime(existingApp.createdAt)}. Your proposal is currently under review by the employer.
                          </p>
                          <div className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300 pt-1">
                            <strong>Your Proposal:</strong> "{existingApp.proposal.length > 120 ? existingApp.proposal.substring(0, 120) + '...' : existingApp.proposal}"
                          </div>
                        </div>
                      );
                    }

                    if (showApplyForm) {
                      return (
                        <form onSubmit={handleSubmitApplication} className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-brand-midnight dark:text-white flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-brand-green" />
                              Submit Application / Proposal
                            </h3>
                            <button
                              type="button"
                              onClick={handleCancelApplyForm}
                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>

                          {appError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{appError}</span>
                            </div>
                          )}

                          {/* Proposal */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-brand-midnight dark:text-slate-200">
                                Cover Message / Proposal <span className="text-rose-500">*</span>
                              </label>
                              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                                {proposal.length} / 1000
                              </span>
                            </div>
                            <textarea
                              required
                              maxLength={1000}
                              rows={4}
                              value={proposal}
                              onChange={(e) => setProposal(e.target.value)}
                              placeholder="Describe your approach, relevant technical skills, and why you are the best fit for this project..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-midnight dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                            />
                          </div>

                          {/* Grid for Experience, Completion Time & Proposed Budget */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-brand-midnight dark:text-slate-200 block mb-1">
                                Proposed Budget / Rate
                              </label>
                              <input
                                type="text"
                                value={proposedBudget}
                                onChange={(e) => setProposedBudget(e.target.value)}
                                placeholder="e.g. $1,500 or $50/hr"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-midnight dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-brand-midnight dark:text-slate-200 block mb-1">
                                Estimated Completion Time
                              </label>
                              <input
                                type="text"
                                value={completionTime}
                                onChange={(e) => setCompletionTime(e.target.value)}
                                placeholder="e.g. 2 weeks"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-midnight dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-brand-midnight dark:text-slate-200 block mb-1">
                              Relevant Experience (Optional)
                            </label>
                            <input
                              type="text"
                              value={experience}
                              onChange={(e) => setExperience(e.target.value)}
                              placeholder="e.g. Built 5 similar React/Node apps; 4+ years full-stack experience"
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-midnight dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={handleCancelApplyForm}
                              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingApp || !proposal.trim()}
                              className="px-5 py-2 rounded-xl bg-brand-green hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isSubmittingApp ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Briefcase className="w-3.5 h-3.5" />
                                  Submit Application
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return null;
                  })()}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                  {selectedProject && (() => {
                    const existingApp = developerApplications.find(a => a.projectId === selectedProject.id);
                    if (existingApp || showApplyForm) {
                      return <div />;
                    }

                    if (isDeveloper) {
                      return (
                        <button
                          onClick={handleOpenApplyForm}
                          className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Briefcase className="w-4 h-4" />
                          Apply for Project
                        </button>
                      );
                    }

                    return (
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        Log in as a Developer to apply
                      </span>
                    );
                  })()}

                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-5 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
        <ImageViewerModal
          isOpen={lightboxOpen}
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          title={lightboxTitle || selectedProject?.title || 'Project Screenshot'}
        />

      </div>
    </div>
  );
};
