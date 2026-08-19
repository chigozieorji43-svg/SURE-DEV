import React, { useState } from 'react';
import { ExtendedReview, ManagedProject } from '../../types';
import { dbService } from '../../lib/firebaseService';
import { Star, Award, MessageSquare, Send, CheckCircle2, User, Building2 } from 'lucide-react';

interface ContractReviewsProps {
  project: ManagedProject;
  userId: string;
  userName: string;
  userRole: 'employer' | 'developer';
  reviews: ExtendedReview[];
}

export const ContractReviews: React.FC<ContractReviewsProps> = ({
  project,
  userId,
  userName,
  userRole,
  reviews,
}) => {
  const [rating, setRating] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [timelinessRating, setTimelinessRating] = useState(5);
  const [profRating, setProfRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const myReview = reviews.find((r) => r.reviewerId === userId);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);

    try {
      await dbService.submitExtendedContractReview({
        projectId: project.id,
        projectTitle: project.title,
        reviewerId: userId,
        reviewerName: userName,
        reviewerRole: userRole,
        targetUserId: userRole === 'employer' ? project.developerId : project.employerId,
        targetUserRole: userRole === 'employer' ? 'developer' : 'employer',
        rating,
        overallRating: rating,
        communicationRating: commRating,
        workQualityRating: qualityRating,
        timelinessRating,
        professionalismRating: profRating,
        comment,
      });
      setComment('');
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarPicker = (val: number, setVal: (v: number) => void) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setVal(star)}
          className="p-1 cursor-pointer hover:scale-110 transition-transform"
        >
          <Star className={`w-4 h-4 ${star <= val ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-700'}`} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-brand-border dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-brand-midnight dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-teal" /> Performance Rating & Counterparty Reviews
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Formal evaluation hub for code quality, communication, timeliness, and professionalism upon project conclusion.
        </p>
      </div>

      {/* Review Form or My Existing Review */}
      {!myReview ? (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm space-y-6">
          <h4 className="text-sm font-bold text-brand-midnight dark:text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Submit Contract Evaluation
          </h4>

          <form onSubmit={handleSubmitReview} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-brand-border/60">
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1">Overall Rating</label>
                {renderStarPicker(rating, setRating)}
              </div>
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1">Communication</label>
                {renderStarPicker(commRating, setCommRating)}
              </div>
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1">Code / Output Quality</label>
                {renderStarPicker(qualityRating, setQualityRating)}
              </div>
              <div>
                <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1">Timeliness & Punctuality</label>
                {renderStarPicker(timelinessRating, setTimelinessRating)}
              </div>
            </div>

            <div>
              <label className="block text-gray-600 dark:text-slate-300 font-bold mb-1.5">
                Detailed Feedback Testimonial *
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Detail technical execution, collaboration, responsiveness, and project outcomes..."
                className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-brand-midnight dark:text-white outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-brand-midnight text-white dark:bg-brand-teal dark:text-brand-midnight font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" /> Publish Verified Review
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>You have submitted your formal contract review for this project.</span>
        </div>
      )}

      {/* Published Reviews Grid */}
      <div className="space-y-4">
        {reviews.map((rev, revIdx) => (
          <div
            key={rev.id ? `${rev.id}-${revIdx}` : revIdx}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-teal/10 text-brand-teal font-bold flex items-center justify-center text-xs">
                  {rev.reviewerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-midnight dark:text-white">{rev.reviewerName}</h4>
                  <span className="text-[10px] text-gray-400 capitalize">{rev.reviewerRole}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-xs font-bold text-brand-midnight dark:text-white">{rev.rating}.0 / 5.0</span>
              </div>
            </div>

            <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed italic">
              "{rev.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
