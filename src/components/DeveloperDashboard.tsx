import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, Briefcase, MapPin, Calendar, Link as LinkIcon, Github, Linkedin, Twitter, Globe, 
  Mail, Phone, Shield, Plus, Trash2, Edit2, Check, Sparkles, Upload, FileText, Settings, Key, Eye,
  CheckCircle, MessageCircle, AlertCircle, Users, ExternalLink, RefreshCw
} from 'lucide-react';
import { Developer, Project, CollabRequest } from '../types';
import { GoogleInbox } from './GoogleInbox';
import { uploadFileToStorage, uploadProfileImage } from '../lib/firebaseService';
import { UserAvatar } from './UserAvatar';

interface DeveloperDashboardProps {
  developer: Developer;
  onUpdateDeveloper: (updated: Developer) => void;
  onPreviewProfile: () => void;
  collabRequests?: CollabRequest[];
  developers?: Developer[];
  onAcceptCollabRequest?: (requestId: string) => void;
  onDeclineCollabRequest?: (requestId: string) => void;
  onCancelCollabRequest?: (requestId: string) => void;
  isGoogleUser?: boolean;
  onConnectGoogle?: () => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  developer,
  onUpdateDeveloper,
  onPreviewProfile,
  collabRequests = [],
  developers = [],
  onAcceptCollabRequest,
  onDeclineCollabRequest,
  onCancelCollabRequest,
  isGoogleUser,
  onConnectGoogle,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'projects' | 'settings' | 'collab' | 'gmail'>('profile');
  const [isSaved, setIsSaved] = useState(false);

  // Profile fields state
  const dev = developer || {} as Partial<Developer>;
  const [name, setName] = useState(dev.name || '');
  const [title, setTitle] = useState(dev.title || '');
  const [location, setLocation] = useState(dev.location || '');
  const [experience, setExperience] = useState((dev.experience || 1).toString());
  const [bio, setBio] = useState(dev.bio || '');
  const [currentWorkplace, setCurrentWorkplace] = useState(dev.currentWorkplace || '');
  const [githubUrl, setGithubUrl] = useState(dev.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(dev.linkedinUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(dev.twitterUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(dev.portfolioUrl || '');
  const [email, setEmail] = useState(dev.email || '');
  const [phone, setPhone] = useState(dev.phone || '');
  const [availability, setAvailability] = useState<'immediate' | 'soon' | 'no'>(dev.availability || 'immediate');

  // Skill management state
  const [skills, setSkills] = useState<string[]>(dev.skills || ['React', 'TypeScript']);
  const [newSkill, setNewSkill] = useState('');

  // Experience state
  const [experiences, setExperiences] = useState(dev.workExperience || [
    {
      id: 'exp-1',
      role: 'Senior Software Engineer',
      company: 'Abia Creative Labs',
      duration: '2022 - Present',
      description: 'Developing responsive web interfaces, system APIs, and digital tooling configurations.'
    },
    {
      id: 'exp-2',
      role: 'Full Stack Consultant',
      company: 'Regional Startups',
      duration: '2020 - 2022',
      description: 'Consulted on digital migrations, tech integrations, and custom database structures.'
    }
  ]);
  const [newExp, setNewExp] = useState({ role: '', company: '', duration: '', description: '' });
  const [showAddExp, setShowAddExp] = useState(false);

  // Project management state
  const [projects, setProjects] = useState(developer.projects || []);
  const [newProj, setNewProj] = useState({ title: '', description: '', tags: '', image: '', demoUrl: '', githubUrl: '' });
  const [showAddProj, setShowAddProj] = useState(false);

  // Avatar and Cover mock states
  const [avatar, setAvatar] = useState(developer.avatar);
  const [coverPhoto, setCoverPhoto] = useState(developer.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200&h=400');

  const [isUploading, setIsUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState<number | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<boolean>(false);

  // General Settings
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const isCustom = Boolean(avatar && !avatar.includes('unsplash.com'));
    const updatedDev: Developer = {
      ...developer,
      name,
      title,
      location,
      experience: parseInt(experience) || 0,
      bio,
      currentWorkplace,
      githubUrl,
      linkedinUrl,
      twitterUrl,
      portfolioUrl,
      email,
      phone,
      availability,
      skills,
      avatar,
      profileImageUrl: avatar,
      hasCustomProfileImage: isCustom,
      coverPhoto,
      workExperience: experiences,
      projects: projects,
    };
    onUpdateDeveloper(updatedDev);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExp.role && newExp.company && newExp.duration) {
      setExperiences([
        ...experiences,
        {
          id: `exp-${Date.now()}`,
          ...newExp
        }
      ]);
      setNewExp({ role: '', company: '', duration: '', description: '' });
      setShowAddExp(false);
    }
  };

  const handleDeleteExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProj.title && newProj.description) {
      const tagsArray = newProj.tags
        ? newProj.tags.split(',').map(t => t.trim()).filter(Boolean)
        : ['React', 'TypeScript'];
      
      const imgPlaceholder = newProj.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&h=600';
      
      setProjects([
        ...projects,
        {
          id: `proj-${Date.now()}`,
          title: newProj.title,
          description: newProj.description,
          tags: tagsArray,
          image: imgPlaceholder,
          demoUrl: newProj.demoUrl || undefined,
          githubUrl: newProj.githubUrl || undefined,
        }
      ]);
      setNewProj({ title: '', description: '', tags: '', image: '', demoUrl: '', githubUrl: '' });
      setShowAddProj(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setAvatarError('Only JPG, JPEG, PNG, and WebP images are allowed.');
        return;
      }

      // Validate size
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError('File size exceeds the 5MB limit.');
        return;
      }

      setAvatarError(null);
      setAvatarSuccess(false);
      setAvatarProgress(0);
      setIsUploading(true);

      try {
        const uploadUrl = await uploadProfileImage(
          developer.id,
          file,
          'developer',
          (progress) => {
            setAvatarProgress(progress);
          }
        );

        setAvatar(uploadUrl);
        setAvatarSuccess(true);
        setAvatarProgress(null);

        const updatedDev: Developer = {
          ...developer,
          avatar: uploadUrl,
          profileImageUrl: uploadUrl,
          hasCustomProfileImage: true,
          name,
          title,
          location,
          experience: parseInt(experience) || 0,
          bio,
          currentWorkplace,
          githubUrl,
          linkedinUrl,
          twitterUrl,
          portfolioUrl,
          email,
          phone,
          availability,
          skills,
          workExperience: experiences,
          projects: projects,
        };
        console.log("Profile object returned to UI (Developer):", updatedDev);
        onUpdateDeveloper(updatedDev);
        setTimeout(() => setAvatarSuccess(false), 4000);
      } catch (err: any) {
        console.error("Storage upload failed:", err);
        setAvatarError(err.message || 'Image upload failed. Please try again.');
        setAvatarProgress(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      setIsUploading(true);
      try {
        const uploadUrl = await uploadFileToStorage(file, 'covers', coverPhoto);
        setCoverPhoto(uploadUrl);
        const updatedDev: Developer = {
          ...developer,
          coverPhoto: uploadUrl,
          name,
          title,
          location,
          experience: parseInt(experience) || 0,
          bio,
          currentWorkplace,
          githubUrl,
          linkedinUrl,
          twitterUrl,
          portfolioUrl,
          email,
          phone,
          availability,
          skills,
          workExperience: experiences,
          projects: projects,
        };
        onUpdateDeveloper(updatedDev);
      } catch (err: any) {
        console.error("Storage upload failed, falling back to base64:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setCoverPhoto(base64);
          const updatedDev: Developer = {
            ...developer,
            coverPhoto: base64,
            name,
            title,
            location,
            experience: parseInt(experience) || 0,
            bio,
            currentWorkplace,
            githubUrl,
            linkedinUrl,
            twitterUrl,
            portfolioUrl,
            email,
            phone,
            availability,
            skills,
            workExperience: experiences,
            projects: projects,
          };
          onUpdateDeveloper(updatedDev);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
      
      {/* Premium Header Profile Strip */}
      <div className="relative rounded-3xl overflow-hidden border border-brand-border bg-white shadow-premium mb-8">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 relative bg-brand-midnight">
          <img 
            src={coverPhoto} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Profile Info Overlay */}
        <div className="px-8 pb-8 pt-0 -mt-12 md:-mt-16 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="relative group">
              <UserAvatar 
                name={name}
                email={email}
                src={avatar} 
                hasCustomProfileImage={developer.hasCustomProfileImage || Boolean(avatar && !avatar.includes('unsplash.com'))}
                sizeClassName="w-24 h-24 md:w-32 md:h-32"
                roundedClassName="rounded-2xl"
                className="border-4 border-white shadow-premium bg-brand-warm-white text-3xl md:text-5xl"
              />
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white text-center p-2">
                <Upload size={18} className="mb-1" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Change Photo</span>
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
              </label>

              {/* Uploading progress overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white">
                  <RefreshCw className="animate-spin text-brand-green mb-1" size={20} />
                  <span className="text-[10px] font-mono font-bold">
                    {avatarProgress !== null ? `${avatarProgress}%` : 'Compressing...'}
                  </span>
                </div>
              )}
            </div>
            <div className="mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-brand-midnight tracking-tight">
                  {name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-mono text-[10px] uppercase font-bold tracking-wider border border-brand-green/20">
                  <Sparkles size={10} />
                  Developer Portal
                </span>
              </div>

              {/* Upload notifications */}
              {avatarError && (
                <div className="mt-1 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1 max-w-md animate-pulse">
                  <AlertCircle size={12} />
                  <span>{avatarError}</span>
                </div>
              )}
              {avatarSuccess && (
                <div className="mt-1 text-xs text-brand-green bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1 max-w-md">
                  <CheckCircle size={12} />
                  <span>Profile picture updated successfully!</span>
                </div>
              )}

              <p className="text-brand-green font-medium mt-0.5">{title}</p>
              <p className="text-gray-400 text-xs mt-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} className="text-brand-green" />
                {location}, Abia State
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onPreviewProfile}
              className="px-5 py-3 rounded-xl border border-brand-border text-gray-700 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Eye size={14} />
              View Live Profile
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-5 py-3 rounded-xl bg-brand-green hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Check size={14} />
              {isSaved ? 'All Saved!' : 'Save Portfolio'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border/60 mb-8 overflow-x-auto scrollbar-hide">
        {(['profile', 'experience', 'projects', 'collab', 'gmail', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'border-brand-green text-brand-midnight font-extrabold'
                : 'border-transparent text-gray-400 hover:text-brand-midnight'
            }`}
          >
            {tab === 'profile' ? 'My Credentials' : tab === 'experience' ? 'Work History' : tab === 'projects' ? 'Portfolio Projects' : tab === 'collab' ? '🤝 Collaboration Hub' : tab === 'gmail' ? '📬 Google Inbox' : 'Account Setup'}
          </button>
        ))}
      </div>

      {/* Forms Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Panel */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-brand-border shadow-sm">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h2 className="text-lg font-display font-bold text-brand-midnight border-b border-brand-border/60 pb-3 flex items-center gap-2">
                <User size={18} className="text-brand-green" />
                Personal Credentials
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none text-xs text-brand-midnight"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Category Track
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight cursor-pointer"
                  >
                    <option value="CAD/CAM Engineer">CAD/CAM Engineer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Full Stack Engineer">Full Stack Engineer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Creative Artist / Illustrator">Creative Artist / Illustrator</option>
                    <option value="Cloud & DevOps Architect">Cloud & DevOps Architect</option>
                    <option value="AI & Data Scientist">AI & Data Scientist</option>
                    <option value="Cybersecurity Specialist">Cybersecurity Specialist</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Abia Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                  >
                    <option>Aba</option>
                    <option>Umuahia</option>
                    <option>Ohafia</option>
                    <option>Arochukwu</option>
                    <option>Bende</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Current Workplace
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Freelance, AbiaTech Corp"
                    value={currentWorkplace}
                    onChange={(e) => setCurrentWorkplace(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                  Professional Bio / Summary
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell potential hirers about your core competence and solution track record..."
                  className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight resize-none"
                />
              </div>

              <div className="border-t border-brand-border/60 pt-6">
                <h3 className="text-sm font-display font-bold text-brand-midnight mb-4 flex items-center gap-2">
                  <Globe size={16} className="text-brand-green" />
                  Developer Anchors & Contact Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      GitHub URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">
                        <Github size={14} />
                      </span>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">
                        <Linkedin size={14} />
                      </span>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      Twitter / X URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">
                        <Twitter size={14} />
                      </span>
                      <input
                        type="url"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      Personal Portfolio / Website
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">
                        <Globe size={14} />
                      </span>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">
                        <Phone size={14} />
                      </span>
                      <input
                        type="tel"
                        placeholder="+234 803 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  Save Personal Data
                </button>
              </div>
            </form>
          )}

          {/* EXPERIENCE TAB */}
          {activeTab === 'experience' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-brand-border/60 pb-3">
                <h2 className="text-lg font-display font-bold text-brand-midnight flex items-center gap-2">
                  <Briefcase size={18} className="text-brand-green" />
                  Work Experience History
                </h2>
                <button
                  onClick={() => setShowAddExp(!showAddExp)}
                  className="px-3.5 py-2 rounded-xl bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-wider hover:bg-brand-green/20 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  Add Position
                </button>
              </div>

              {showAddExp && (
                <form onSubmit={handleAddExperience} className="bg-brand-warm-white/40 p-5 rounded-2xl border border-brand-border space-y-4">
                  <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight">
                    Add New Position
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Role Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lead Designer"
                        value={newExp.role}
                        onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aba Leatherworks"
                        value={newExp.company}
                        onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 2021 - 2023"
                        value={newExp.duration}
                        onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Brief Description of Achievements
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Coordinated automated CAD molding designs..."
                      value={newExp.description}
                      onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExp(false)}
                      className="px-4 py-2 rounded-lg border border-brand-border text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-brand-green text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Add Position
                    </button>
                  </div>
                </form>
              )}

              {/* Experiences List */}
              <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-brand-border/60">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-8 group flex items-start justify-between gap-4">
                    <span className="absolute left-[5px] top-1.5 w-3 h-3 rounded-full bg-brand-green border-2 border-white ring-4 ring-brand-green/15 transition-transform group-hover:scale-125" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold text-brand-green bg-brand-green/5 px-2 py-0.5 rounded-md">
                          {exp.duration}
                        </span>
                        <span className="text-xs font-semibold text-brand-midnight">
                          {exp.company}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-brand-midnight mt-1">
                        {exp.role}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="p-1.5 rounded-lg border border-brand-border text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all cursor-pointer shadow-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PORTFOLIO PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-brand-border/60 pb-3">
                <h2 className="text-lg font-display font-bold text-brand-midnight flex items-center gap-2">
                  <FileText size={18} className="text-brand-green" />
                  Portfolio Showcase Projects
                </h2>
                <button
                  onClick={() => setShowAddProj(!showAddProj)}
                  className="px-3.5 py-2 rounded-xl bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-wider hover:bg-brand-green/20 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  Add Project
                </button>
              </div>

              {showAddProj && (
                <form onSubmit={handleAddProject} className="bg-brand-warm-white/40 p-5 rounded-2xl border border-brand-border space-y-4">
                  <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight">
                    Publish New Showcase Project
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Project Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Abia Shoe CAD Mold"
                        value={newProj.title}
                        onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Technologies Deployed (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="React, SolidWorks, Node.js"
                        value={newProj.tags}
                        onChange={(e) => setNewProj({ ...newProj, tags: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Live Demo URL (optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://demoproject.com"
                        value={newProj.demoUrl}
                        onChange={(e) => setNewProj({ ...newProj, demoUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        GitHub Repository URL (optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/project-code"
                        value={newProj.githubUrl}
                        onChange={(e) => setNewProj({ ...newProj, githubUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Project Preview Image Link (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={newProj.image}
                        onChange={(e) => setNewProj({ ...newProj, image: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Narrative Summary & Engineering Challenges
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Discuss what you designed, what problem it solves, and the tooling pipeline you engineered..."
                      value={newProj.description}
                      onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-brand-border text-xs resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProj(false)}
                      className="px-4 py-2 rounded-lg border border-brand-border text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-brand-green text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      Publish Project
                    </button>
                  </div>
                </form>
              )}

              {/* Projects List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((proj) => (
                  <div key={proj.id} className="bg-white rounded-2xl overflow-hidden border border-brand-border shadow-sm group relative">
                    <div className="aspect-video relative bg-brand-midnight overflow-hidden">
                      <img 
                        src={proj.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=300'} 
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-rose-600 hover:scale-105 text-white transition-all cursor-pointer shadow-md"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-5">
                      <h4 className="font-display font-bold text-sm text-brand-midnight group-hover:text-brand-green transition-colors">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {proj.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {proj.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-brand-warm-white text-gray-600 font-mono text-[9px] border border-brand-border/60">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <h2 className="text-lg font-display font-bold text-brand-midnight border-b border-brand-border/60 pb-3 flex items-center gap-2">
                <Settings size={18} className="text-brand-green" />
                Account Configuration & Security
              </h2>

              {/* Simulated password change */}
              <div className="space-y-4 bg-brand-warm-white/10 p-5 rounded-2xl border border-brand-border shadow-sm">
                <h3 className="text-sm font-display font-bold text-brand-midnight flex items-center gap-1.5">
                  <Key size={16} className="text-brand-green" />
                  Credentials & Passkey
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      Secure Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-brand-border outline-none text-xs text-brand-midnight"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3 text-gray-400 hover:text-brand-midnight cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => alert('Secure credentials set successfully!')}
                      className="px-4 py-3 rounded-xl bg-brand-midnight hover:bg-brand-midnight/90 text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification preferences toggles */}
              <div className="space-y-4">
                <h3 className="text-sm font-display font-bold text-brand-midnight flex items-center gap-1.5">
                  <Shield size={16} className="text-brand-green" />
                  Visibility & Notification Preferences
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-brand-warm-white/20 border border-brand-border hover:border-brand-green transition-all shadow-sm">
                    <input
                      type="checkbox"
                      checked={profileVisibility}
                      onChange={(e) => setProfileVisibility(e.target.checked)}
                      className="rounded text-brand-green accent-brand-green mt-1 h-4 w-4"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-brand-midnight">
                        Public Profile Directory Visibility
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">
                        If active, verified employers can discover your credentials and invite you for direct hiring syncs.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-brand-warm-white/20 border border-brand-border hover:border-brand-green transition-all shadow-sm">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="rounded text-brand-green accent-brand-green mt-1 h-4 w-4"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-brand-midnight">
                        Direct Client Email Dispatch
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">
                        Receive instant notifications when registered employers log a proposal or reach out to match your profile.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* COLLABORATION HUB TAB */}
          {activeTab === 'collab' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-brand-border/60 pb-4">
                <h2 className="text-lg font-display font-bold text-brand-midnight flex items-center gap-2">
                  <Users size={18} className="text-brand-green" />
                  Abia Developer Collaboration Hub
                </h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Connect with vetted peers across Aba, Umuahia, and Arochukwu. Partner up on localized hardware, industrial software development, or custom design token modules. Accepting requests reveals mutual WhatsApp numbers and GitHub profiles.
                </p>
              </div>

              {/* SECTION 1: INCOMING REQUESTS */}
              <div className="space-y-4">
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                  Incoming Partnerships ({collabRequests.filter(r => r.receiverId === developer.id && r.status === 'pending').length})
                </h3>
                
                {collabRequests.filter(r => r.receiverId === developer.id && r.status === 'pending').length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-brand-border rounded-2xl bg-brand-warm-white/20">
                    <p className="text-xs text-gray-400">No pending incoming requests at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {collabRequests
                      .filter(r => r.receiverId === developer.id && r.status === 'pending')
                      .map((req) => {
                        const sender = developers.find(d => d.id === req.senderId);
                        if (!sender) return null;
                        return (
                          <div key={req.id} className="p-4 rounded-2xl border border-brand-border bg-white shadow-sm hover:shadow-premium transition-all space-y-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex gap-3 items-start">
                              <img src={sender.avatar} alt={sender.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-xl object-cover border border-brand-border" />
                              <div>
                                <h4 className="text-xs font-bold text-brand-midnight">{sender.name}</h4>
                                <p className="text-[10px] text-brand-green font-medium">{sender.title}</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">{sender.location}, Abia • {sender.experience} yrs exp</p>
                                {req.message && (
                                  <p className="text-xs italic text-gray-500 bg-brand-warm-white/60 p-2.5 rounded-xl border border-brand-border/60 mt-2 max-w-md">
                                    "{req.message}"
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 self-end md:self-center">
                              <button
                                onClick={() => onAcceptCollabRequest?.(req.id)}
                                className="px-4 py-2 bg-brand-green hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => onDeclineCollabRequest?.(req.id)}
                                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* SECTION 2: ACTIVE CONNECTIONS */}
              <div className="space-y-4">
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight flex items-center gap-2">
                  <CheckCircle size={14} className="text-brand-green" />
                  My Collaboration Network ({collabRequests.filter(r => (r.senderId === developer.id || r.receiverId === developer.id) && r.status === 'accepted').length})
                </h3>

                {collabRequests.filter(r => (r.senderId === developer.id || r.receiverId === developer.id) && r.status === 'accepted').length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-brand-border rounded-2xl bg-brand-warm-white/20">
                    <p className="text-xs text-gray-400">You haven't added any collaboration partners yet.</p>
                    <p className="text-[10px] text-gray-400/80 mt-1">Browse the public directory and tap "Request Collaboration" on another developer's profile to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {collabRequests
                      .filter(r => (r.senderId === developer.id || r.receiverId === developer.id) && r.status === 'accepted')
                      .map((req) => {
                        const partnerId = req.senderId === developer.id ? req.receiverId : req.senderId;
                        const partner = developers.find(d => d.id === partnerId);
                        if (!partner) return null;
                        return (
                          <div key={req.id} className="p-4 rounded-2xl border border-brand-border bg-white shadow-sm hover:shadow-premium transition-all flex flex-col justify-between space-y-4">
                            <div className="flex gap-3 items-start">
                              <img src={partner.avatar} alt={partner.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-xl object-cover border border-brand-border" />
                              <div>
                                <h4 className="text-xs font-extrabold text-brand-midnight">{partner.name}</h4>
                                <p className="text-[10px] text-brand-green font-bold mt-0.5">{partner.title}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{partner.location}, Abia State</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-brand-border/60 pt-3">
                              <a
                                href={partner.phone ? `https://wa.me/${partner.phone.replace(/[^0-9]/g, '')}` : `https://wa.me/2348012345678?text=Hello%20${encodeURIComponent(partner.name)}!%20Let's%20collaborate.`}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-[10px] flex items-center justify-center gap-1 hover:translate-y-[-1px] transition-all cursor-pointer"
                              >
                                <MessageCircle size={12} />
                                WhatsApp
                              </a>
                              <a
                                href={partner.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2.5 rounded-xl bg-brand-midnight hover:bg-zinc-800 text-white font-bold text-[10px] flex items-center justify-center gap-1 hover:translate-y-[-1px] transition-all cursor-pointer"
                              >
                                <Github size={12} />
                                GitHub
                              </a>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* SECTION 3: SENT PENDING REQUESTS */}
              <div className="space-y-4">
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight flex items-center gap-2">
                  <AlertCircle size={14} className="text-brand-gold" />
                  Sent Requests (Pending) ({collabRequests.filter(r => r.senderId === developer.id && r.status === 'pending').length})
                </h3>

                {collabRequests.filter(r => r.senderId === developer.id && r.status === 'pending').length === 0 ? (
                  <div className="p-5 text-center border border-dashed border-brand-border rounded-2xl bg-brand-warm-white/20">
                    <p className="text-xs text-gray-400">No pending outgoing invitations.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {collabRequests
                      .filter(r => r.senderId === developer.id && r.status === 'pending')
                      .map((req) => {
                        const receiver = developers.find(d => d.id === req.receiverId);
                        if (!receiver) return null;
                        return (
                          <div key={req.id} className="p-3.5 rounded-xl border border-brand-border bg-brand-warm-white/10 flex items-center justify-between gap-3">
                            <div className="flex gap-2.5 items-center">
                              <img src={receiver.avatar} alt={receiver.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg object-cover" />
                              <div>
                                <h4 className="text-xs font-bold text-brand-midnight">{receiver.name}</h4>
                                <p className="text-[9px] text-gray-400 font-medium">{receiver.title} • {receiver.location}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => onCancelCollabRequest?.(req.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 font-bold text-[9px] uppercase transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* GMAIL INBOX TAB */}
          {activeTab === 'gmail' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-brand-border/60 pb-4">
                <h2 className="text-lg font-display font-bold text-brand-midnight flex items-center gap-2">
                  <Mail size={18} className="text-brand-green" />
                  Your Synchronized Google Inbox
                </h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  View your automated Abia Tech Guild welcome updates, onboarding messages, and contract dispatches synchronized directly using your Google Account details.
                </p>
              </div>

              <GoogleInbox 
                userEmail={developer.email}
                userName={developer.name}
                isGoogleConnected={!!isGoogleUser}
                onConnectGoogle={onConnectGoogle || (() => {})}
                accountType="developer"
              />
            </div>
          )}

        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Availability Block */}
          <div className="bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-4">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight">
              Availability Status
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => setAvailability('immediate')}
                className={`w-full text-left p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  availability === 'immediate'
                    ? 'bg-brand-green/10 border-brand-green text-brand-green'
                    : 'bg-brand-warm-white/30 border-brand-border text-gray-600 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold">Available Immediately</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">Ready to jump into contracts</span>
                </div>
                {availability === 'immediate' && <Check size={16} />}
              </button>

              <button
                onClick={() => setAvailability('soon')}
                className={`w-full text-left p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  availability === 'soon'
                    ? 'bg-brand-gold/10 border-brand-gold text-brand-gold'
                    : 'bg-brand-warm-white/30 border-brand-border text-gray-600 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold">Available Soon</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">Wrapping up ongoing roles</span>
                </div>
                {availability === 'soon' && <Check size={16} />}
              </button>

              <button
                onClick={() => setAvailability('no')}
                className={`w-full text-left p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  availability === 'no'
                    ? 'bg-gray-100 border-gray-300 text-gray-600'
                    : 'bg-brand-warm-white/30 border-brand-border text-gray-600 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold">Busy / Closed</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">Currently not accepting matches</span>
                </div>
                {availability === 'no' && <Check size={16} />}
              </button>
            </div>
          </div>

          {/* Technical Skills Block */}
          <div className="bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-4">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight flex items-center justify-between">
              <span>Technical Vetted Skills</span>
              <span className="px-2 py-0.5 bg-brand-green/10 text-brand-green rounded font-mono text-[9px] font-bold">
                {skills.length} Vetted
              </span>
            </h3>

            {/* Add Skill Form */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Next.js"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-brand-warm-white border border-brand-border text-xs focus:border-brand-green outline-none"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-brand-midnight hover:bg-brand-midnight/90 text-white cursor-pointer shadow-sm"
              >
                <Plus size={16} />
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((skill) => (
                <span 
                  key={skill} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-warm-white border border-brand-border text-xs font-bold text-gray-600"
                >
                  {skill}
                  <button 
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-gray-400 hover:text-rose-600 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
