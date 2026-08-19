import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  FileText,
  DollarSign,
  Calendar,
  Code,
  User,
  Building,
  Send,
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  ManagedProject,
  ProjectTimelineEvent,
  Review,
  Complaint,
  ComplaintReason,
  ProjectStatus
} from '../types';
import { dbService } from '../lib/firebaseService';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ManagedProject | null;
  currentUserId: string;
  userRole: 'employer' | 'developer';
  userName: string;
  onProjectUpdated?: () => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  isOpen,
  onClose,
  project,
  currentUserId,
  userRole,
  userName,
  onProjectUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'reviews' | 'complaints'>('overview');
  const [timeline, setTimeline] = useState<ProjectTimelineEvent[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Review Form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  // Complaint Form state
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintReason, setComplaintReason] = useState<ComplaintReason>('Developer did not deliver');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintEvidence, setComplaintEvidence] = useState('');

  // Success Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (project && isOpen) {
      const unsubTimeline = dbService.subscribeProjectTimeline(project.id, (events) => {
        setTimeline(events);
      });

      const unsubReviews = dbService.subscribeProjectReviews((allReviews) => {
        setReviews(allReviews.filter((r) => r.projectId === project.id));
      });

      const unsubComplaints = dbService.subscribeComplaints((allComplaints) => {
        setComplaints(allComplaints.filter((c) => c.projectId === project.id));
      });

      return () => {
        unsubTimeline();
        unsubReviews();
        unsubComplaints();
      };
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStatusUpdate = async (newStatus: ProjectStatus) => {
    setIsSubmittingAction(true);
    try {
      await dbService.updateProjectStatus(project.id, newStatus, currentUserId, userName, userRole);
      triggerToast(`Project status updated to ${newStatus}`);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Error updating project status:', err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    setIsSubmittingAction(true);
    try {
      const targetUserId = userRole === 'employer' ? project.developerId : project.employerId;
      const targetUserRole = userRole === 'employer' ? 'developer' : 'employer';

      await dbService.createProjectReview({
        projectId: project.id,
        projectTitle: project.title,
        reviewerId: currentUserId,
        reviewerName: userName,
        reviewerRole: userRole,
        targetUserId,
        targetUserRole,
        rating,
        title: reviewTitle,
        comment: reviewComment
      });

      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
      triggerToast('Review submitted successfully! ⭐');
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDescription.trim()) return;

    setIsSubmittingAction(true);
    try {
      const respondentId = userRole === 'employer' ? project.developerId : project.employerId;
      const respondentName = userRole === 'employer' ? project.developerName : project.employerName;

      await dbService.createComplaint({
        projectId: project.id,
        projectTitle: project.title,
        complainantId: currentUserId,
        complainantName: userName,
        complainantRole: userRole,
        respondentId,
        respondentName,
        reason: complaintReason,
        description: complaintDescription,
        evidenceLink: complaintEvidence
      });

      setShowComplaintForm(false);
      setComplaintDescription('');
      setComplaintEvidence('');
      triggerToast('Issue report logged and sent for review ⚠️');
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Error filing complaint:', err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'Pending':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Pending</span>;
      case 'Accepted':
      case 'Active':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>;
      case 'Completed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Completed</span>;
      case 'Declined':
      case 'Cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">{status}</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-400">{status}</span>;
    }
  };

  const existingUserReview = reviews.find((r) => r.reviewerId === currentUserId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden my-8"
        >
          {/* Toast Notice */}
          {toastMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-lg animate-bounce">
              {toastMessage}
            </div>
          )}

          {/* Modal Header */}
          <div className="p-6 md:p-8 bg-slate-950/60 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {getStatusBadge(project.status)}
                <span className="text-xs text-slate-400 font-mono">ID: {project.id}</span>
              </div>
              <h2 className="text-2xl font-bold font-display text-white">{project.title}</h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <strong className="text-slate-200">{project.employerName}</strong>
                <span>•</span>
                <User className="w-3.5 h-3.5 text-slate-500" />
                <strong className="text-slate-200">{project.developerName}</strong>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors self-end md:self-auto cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tabs Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview & Specs
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Timeline Events ({timeline.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'reviews'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Reviews & Ratings ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'complaints'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Issues & Complaints ({complaints.length})
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Meta Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Budget</span>
                      <span className="text-sm font-bold text-slate-100">{project.budget || 'Negotiable'}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Deadline</span>
                      <span className="text-sm font-bold text-slate-100">{project.deadline || 'Flexible'}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Created Date</span>
                      <span className="text-sm font-bold text-slate-100">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" /> Project Description
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-4 rounded-2xl border border-slate-800 whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>

                {/* Required Skills */}
                {project.requiredSkills && project.requiredSkills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-emerald-400" /> Required Technical Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.requiredSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                {project.notes && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Additional Specifications</h4>
                    <p className="text-xs text-slate-300 bg-slate-800/20 p-3.5 rounded-xl border border-slate-800 italic">
                      "{project.notes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Project Activity Ledger
                </h4>
                {timeline.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No timeline events recorded yet.</p>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {timeline.map((evt, idx) => (
                      <div key={evt.id ? `${evt.id}-${idx}` : idx} className="relative flex items-start gap-4">
                        <div className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                        <div className="flex-1 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold text-white">{evt.eventType}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(evt.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">{evt.description}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            Actor: {evt.actorName} ({evt.actorRole})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project Reviews</h4>
                  {project.status === 'Completed' && !existingUserReview && !showReviewForm && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" /> Write Review
                    </button>
                  )}
                </div>

                {/* Review Form Drawer */}
                {showReviewForm && (
                  <form onSubmit={handleReviewSubmit} className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700 space-y-4">
                    <h5 className="text-sm font-bold text-white">Rate & Review Engagement</h5>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Rating</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-1 cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Headline</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Excellent engineering output & timely delivery"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Detailed Review</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Provide honest, professional feedback on communication, work quality, and reliability..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingAction}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Submit Review
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    {project.status === 'Completed'
                      ? 'No reviews submitted yet for this completed project.'
                      : 'Reviews can be submitted once this project is marked as Completed.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev, idx) => (
                      <div key={rev.id ? `${rev.id}-${idx}` : idx} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-slate-700'}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-white">{rev.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-300">{rev.comment}</p>
                        <span className="text-[10px] text-slate-400 block">
                          By: {rev.reviewerName} ({rev.reviewerRole})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* COMPLAINTS TAB */}
            {activeTab === 'complaints' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dispute & Complaint Log</h4>
                  {!showComplaintForm && (
                    <button
                      onClick={() => setShowComplaintForm(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> Report Issue
                    </button>
                  )}
                </div>

                {/* Complaint Form */}
                {showComplaintForm && (
                  <form onSubmit={handleComplaintSubmit} className="bg-slate-800/70 p-5 rounded-2xl border border-rose-500/30 space-y-4">
                    <h5 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Log Complaint / Dispute
                    </h5>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Reason for Dispute</label>
                      <select
                        value={complaintReason}
                        onChange={(e) => setComplaintReason(e.target.value as ComplaintReason)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                      >
                        <option value="Developer did not deliver">Developer did not deliver</option>
                        <option value="Employer did not pay">Employer did not pay</option>
                        <option value="Poor communication">Poor communication</option>
                        <option value="Spam">Spam</option>
                        <option value="Fake profile">Fake profile</option>
                        <option value="Harassment">Harassment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Description of Issue</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Provide clear details regarding what went wrong..."
                        value={complaintDescription}
                        onChange={(e) => setComplaintDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Evidence Link (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://github.com/issue or screenshot URL"
                        value={complaintEvidence}
                        onChange={(e) => setComplaintEvidence(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowComplaintForm(false)}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingAction}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        File Complaint
                      </button>
                    </div>
                  </form>
                )}

                {/* Complaints List */}
                {complaints.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No complaints recorded for this project.</p>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((cmp, idx) => (
                      <div key={cmp.id ? `${cmp.id}-${idx}` : idx} className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300">{cmp.reason}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {cmp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{cmp.description}</p>
                        {cmp.evidenceLink && (
                          <a
                            href={cmp.evidenceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-400 underline block"
                          >
                            View Evidence Link
                          </a>
                        )}
                        {cmp.resolutionNotes && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-900 text-xs text-emerald-400 border border-emerald-500/20">
                            <strong>Resolution Note:</strong> {cmp.resolutionNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Actions based on user role and status */}
              {userRole === 'developer' && project.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('Accepted')}
                    disabled={isSubmittingAction}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Accept Project
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('Declined')}
                    disabled={isSubmittingAction}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Decline
                  </button>
                </>
              )}

              {userRole === 'employer' && (project.status === 'Pending' || project.status === 'Accepted' || project.status === 'Active') && (
                <button
                  onClick={() => handleStatusUpdate('Cancelled')}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel Contract
                </button>
              )}

              {userRole === 'employer' && (project.status === 'Accepted' || project.status === 'Active') && (
                <button
                  onClick={() => handleStatusUpdate('Completed')}
                  disabled={isSubmittingAction}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Completed
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
