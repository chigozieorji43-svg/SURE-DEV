import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Briefcase, Plus, X, Upload, CheckCircle2, ArrowLeft, AlertCircle, 
  Sparkles, Image as ImageIcon, Loader2, DollarSign, Calendar, Tag, Building2, ShieldAlert,
  FolderPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbService, uploadFileToStorage, handleFirestoreError } from '../lib/firebaseService';
import { ProjectPost } from '../types';
import { UserAvatar } from './UserAvatar';

interface PostProjectProps {
  onNavigateDashboard: () => void;
  onNavigateToProjects?: () => void;
  onOpenLoginModal?: () => void;
}

const COMMON_SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Tailwind CSS', 
  'Flutter', 'Firebase', 'PostgreSQL', 'Next.js', 'GraphQL',
  'UI/UX Design', 'DevOps', 'Docker', 'REST API', 'MongoDB'
];

export const PostProject: React.FC<PostProjectProps> = ({
  onNavigateDashboard,
  onNavigateToProjects,
  onOpenLoginModal
}) => {
  const { firebaseUser, userDoc, role, employerProfile, loading: authLoading } = useAuth();

  // Form Field States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);
  const [skillInput, setSkillInput] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');

  // Image Upload States
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Form Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [publishedPost, setPublishedPost] = useState<ProjectPost | null>(null);

  // 1. Access Control Checks
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Verifying employer access credentials...</p>
      </div>
    );
  }

  // Case A: Unauthenticated User
  if (!firebaseUser || !role) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-brand-midnight dark:text-white mb-3">Employer Account Required</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto mb-8 leading-relaxed">
          You must be logged in with an authenticated <strong className="text-brand-midnight dark:text-white">Employer account</strong> to post project opportunities on SureDev.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenLoginModal}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
          >
            Log In / Sign Up as Employer
          </button>
          <button
            onClick={onNavigateDashboard}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-semibold text-sm transition-all cursor-pointer"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Case B: Developer Account Attempting Access
  if (role !== 'employer') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-brand-midnight dark:text-white mb-3">Employer Portal Only</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto mb-8 leading-relaxed">
          Project creation is exclusively reserved for registered employers. You are currently logged in as a <strong className="text-brand-green uppercase font-bold font-mono">Developer</strong>.
        </p>
        <button
          onClick={onNavigateDashboard}
          className="px-6 py-3 rounded-xl bg-brand-midnight dark:bg-gray-800 text-white font-semibold text-sm hover:bg-slate-800 dark:hover:bg-gray-700 transition-all shadow-md cursor-pointer"
        >
          Return to Developer Dashboard
        </button>
      </div>
    );
  }

  // Handlers for Skill Management
  const handleAddSkill = (skillToAdd: string) => {
    const cleaned = skillToAdd.trim();
    if (cleaned && !skills.includes(cleaned)) {
      setSkills([...skills, cleaned]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Handler for Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageError(null);
    setIsUploadingImage(true);
    setUploadProgress(10);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!allowedTypes.includes(file.type.toLowerCase())) {
          setImageError(`File ${file.name} is not a JPG, PNG, or WebP image.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setImageError(`File ${file.name} exceeds 5MB limit.`);
          continue;
        }

        const url = await uploadFileToStorage(
          file,
          `project_posts/${firebaseUser.uid}`,
          undefined,
          (progress) => setUploadProgress(progress)
        );
        newUrls.push(url);
      }

      if (newUrls.length > 0) {
        setImageUrls(prev => [...prev, ...newUrls]);
        if (!imageUrl) setImageUrl(newUrls[0]);
      }
      setUploadProgress(null);
    } catch (err: any) {
      console.error('Project image upload error:', err);
      setImageError('Failed to upload image. You can still publish without an image or try another file.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = imageUrls.filter((_, idx) => idx !== indexToRemove);
    setImageUrls(updated);
    setImageUrl(updated[0] || null);
    setImageError(null);
  };

  // Reset form to post another project
  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl(null);
    setImageUrls([]);
    setSkills(['React', 'TypeScript']);
    setSkillInput('');
    setBudget('');
    setDeadline('');
    setValidationError(null);
    setSubmitError(null);
    setPublishedPost(null);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSubmitError(null);

    // Form Validation
    if (!title.trim()) {
      setValidationError('Project title is required.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Project description is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const employerName = employerProfile?.companyName || userDoc?.name || 'Verified Employer';
      const employerImage = employerProfile?.companyLogo || employerProfile?.profileImageUrl || userDoc?.photoURL || undefined;

      const primaryImg = imageUrls[0] || imageUrl || null;

      const newPost = await dbService.createProjectPost({
        title: title.trim(),
        description: description.trim(),
        imageUrl: primaryImg,
        imageUrls: imageUrls.length > 0 ? imageUrls : (primaryImg ? [primaryImg] : []),
        skills,
        budget: budget.trim() || undefined,
        deadline: deadline.trim() || undefined,
        employerId: firebaseUser.uid,
        employerName,
        employerProfileImage: employerImage,
        status: 'active'
      }, firebaseUser.uid);

      setPublishedPost(newPost);
    } catch (err: any) {
      const friendlyMsg = handleFirestoreError(err, 'post project');
      setSubmitError(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Case C: Success State Screen
  if (publishedPost) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 md:p-12 text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-bold text-brand-midnight dark:text-white mb-2">
            Project Posted Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
            Your project opportunity is now active on SureDev.
          </p>

          {/* Published Preview */}
          <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-left max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-200 dark:border-gray-700">
              <UserAvatar
                src={publishedPost.employerProfileImage}
                email={userDoc?.email || ''}
                sizeClassName="w-10 h-10"
                className="border border-gray-200"
              />
              <div>
                <h4 className="text-sm font-bold text-brand-midnight dark:text-white">{publishedPost.employerName}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Posted Just Now</p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-brand-midnight dark:text-white mb-2">{publishedPost.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
              {publishedPost.description}
            </p>

            {publishedPost.imageUrl && (
              <img 
                src={publishedPost.imageUrl} 
                alt="Project cover" 
                className="w-full h-48 object-cover rounded-lg mb-4 border border-gray-200 dark:border-gray-700" 
              />
            )}

            <div className="flex flex-wrap gap-1.5 mb-4">
              {publishedPost.skills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium rounded">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
              {publishedPost.budget && (
                <span className="flex items-center gap-1 font-bold text-brand-midnight dark:text-white">
                  Budget: {publishedPost.budget}
                </span>
              )}
              {publishedPost.deadline && (
                <span className="flex items-center gap-1 font-bold text-brand-midnight dark:text-white">
                  Timeline: {publishedPost.deadline}
                </span>
              )}
            </div>
          </div>

          {/* Action Navigation Options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onNavigateToProjects || onNavigateDashboard}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4" /> View My Projects
            </button>
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-midnight dark:bg-gray-800 hover:bg-slate-800 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Post Another Project
            </button>
            <button
              onClick={onNavigateDashboard}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Case D: Main Form View
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8">
      {/* Top Header & Breadcrumbs */}
      <div className="mb-8 border-b border-gray-200 dark:border-slate-800 pb-6">
        <button
          onClick={onNavigateDashboard}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-brand-midnight dark:hover:text-white transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-brand-midnight dark:text-white tracking-tight">
              Post a Project
            </h1>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Create a new project opportunity for software engineers.
            </p>
          </div>

          {/* Employer Identity */}
          <div className="flex items-center gap-3">
            <UserAvatar
              src={employerProfile?.companyLogo || employerProfile?.profileImageUrl || userDoc?.photoURL}
              email={userDoc?.email || ''}
              sizeClassName="w-9 h-9"
              className="border border-gray-200"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-brand-midnight dark:text-white truncate max-w-[160px]">
                {employerProfile?.companyName || userDoc?.name}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Verified Employer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation / Submit Error Banners */}
      {validationError && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Missing Required Fields</p>
            <p className="text-xs mt-0.5">{validationError}</p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Submission Failed</p>
            <p className="text-xs mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        
        {/* 1. Project Title */}
        <div>
          <label htmlFor="project-title" className="block text-sm font-bold text-brand-midnight dark:text-white mb-2">
            Project Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Hotel Management Mobile App & Web Dashboard"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-brand-midnight dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green text-sm font-medium transition-all"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-sans">
            Write a clear, concise headline describing the project scope.
          </p>
        </div>

        {/* 2. Detailed Description */}
        <div>
          <label htmlFor="project-description" className="block text-sm font-bold text-brand-midnight dark:text-white mb-2">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="project-description"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the key goals, required features, technical stack requirements, deliverables, and expectations..."
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-brand-midnight dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green text-sm font-medium transition-all leading-relaxed"
            required
          />
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Include features, scope of work, and expected deliverables.</span>
            <span>{description.length} chars</span>
          </div>
        </div>

        {/* 3. Optional Cover / Banner Images Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-brand-midnight dark:text-white">
              Project Screenshots / Cover Images <span className="text-xs text-gray-400 font-normal">(Optional, multiple allowed)</span>
            </label>
            {imageUrls.length > 0 && (
              <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
                {imageUrls.length} image{imageUrls.length > 1 ? 's' : ''} uploaded
              </span>
            )}
          </div>

          {/* Uploaded Images Grid */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900 aspect-video">
                  <img
                    src={url}
                    alt={`Uploaded screenshot ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-brand-green/90 text-white text-[10px] font-bold">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white transition-all shadow-md cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-green rounded-xl p-5 text-center transition-colors bg-gray-50/50 dark:bg-slate-800/40">
            <input
              type="file"
              id="project-image-file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={isUploadingImage}
              className="hidden"
            />
            <label htmlFor="project-image-file" className="cursor-pointer block">
              <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                {isUploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin text-brand-green" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <p className="text-sm font-bold text-brand-midnight dark:text-white mb-0.5">
                {isUploadingImage ? 'Uploading Image(s)...' : imageUrls.length > 0 ? '+ Upload Additional Screenshots' : 'Click to Upload Cover Image or Screenshots'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, or WebP (Max 5MB per file; select multiple files if needed)
              </p>
            </label>

            {uploadProgress !== null && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-green transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">{uploadProgress}% Uploaded</span>
              </div>
            )}
          </div>

          {imageError && (
            <p className="text-xs text-rose-500 font-semibold mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {imageError}
            </p>
          )}
        </div>

        {/* 4. Required Skills & Tech Stack */}
        <div>
          <label className="block text-sm font-bold text-brand-midnight dark:text-white mb-2">
            Required Skills & Tech Stack <span className="text-xs text-gray-400 font-normal">(Optional)</span>
          </label>

          {/* Skill Tag Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-gray-200 dark:border-slate-700"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Skill Input Row */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(skillInput);
                }
              }}
              placeholder="Add skill (e.g., React, Flutter) & press Enter"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-brand-midnight dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green text-sm"
            />
            <button
              type="button"
              onClick={() => handleAddSkill(skillInput)}
              className="px-4 py-2.5 bg-brand-midnight dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Preset Suggestions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">Suggestions:</span>
            {COMMON_SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 7).map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddSkill(s)}
                className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded transition-colors cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Budget & Timeline Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Estimated Budget */}
          <div>
            <label htmlFor="project-budget" className="block text-sm font-bold text-brand-midnight dark:text-white mb-2">
              Estimated Budget <span className="text-xs text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                id="project-budget"
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₦300,000 - ₦600,000 or $1,500"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-brand-midnight dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green text-sm"
              />
            </div>
          </div>

          {/* Timeline / Deadline */}
          <div>
            <label htmlFor="project-deadline" className="block text-sm font-bold text-brand-midnight dark:text-white mb-2">
              Target Timeline / Deadline <span className="text-xs text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                id="project-deadline"
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. 2 Weeks, 1 Month, or Date"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-brand-midnight dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green text-sm"
              />
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={onNavigateDashboard}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-brand-green hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Publishing Project...
              </>
            ) : (
              'Publish Project'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
