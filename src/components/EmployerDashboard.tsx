import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, User, Globe, Mail, Phone, MapPin, Briefcase, Plus, Check, Upload, Sparkles, Code, Layout, Clock, Settings, Key,
  RefreshCw, AlertCircle, CheckCircle, Camera, Image as ImageIcon, ArrowLeft
} from 'lucide-react';
import { Employer } from '../types';
import { uploadFileToStorage, uploadProfileImage } from '../lib/firebaseService';
import { UserAvatar } from './UserAvatar';
import { DashboardProjectsModule } from './DashboardProjectsModule';
import { RealtimeChat } from './workspace/RealtimeChat';
import { EmployerApplicationsView } from './EmployerApplicationsView';

interface EmployerDashboardProps {
  employer: Employer;
  onUpdateEmployer: (updated: Employer) => void;
  onPreviewProfile: () => void;
  isGoogleUser?: boolean;
  onConnectGoogle?: () => void;
  onTabChange?: (tab: string) => void;
  onNavigateToPostProject?: () => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  employer,
  onUpdateEmployer,
  onPreviewProfile,
  isGoogleUser,
  onConnectGoogle,
  onTabChange,
  onNavigateToPostProject,
}) => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'managedProjects' | 'applications' | 'reviews' | 'preferences' | 'chat'
  >('profile');
  const [previousTab, setPreviousTab] = useState<
    'profile' | 'managedProjects' | 'applications' | 'reviews' | 'preferences'
  >('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [selectedChatProject, setSelectedChatProject] = useState<any>(null);

  const handleTabChange = (newTab: 'profile' | 'managedProjects' | 'applications' | 'reviews' | 'preferences' | 'chat') => {
    if (activeTab !== 'chat' && newTab === 'chat') {
      setPreviousTab(activeTab as 'profile' | 'managedProjects' | 'applications' | 'reviews' | 'preferences');
    }
    setActiveTab(newTab);
    onTabChange?.(newTab);
  };

  // Corporate Profile Fields
  const emp = employer || {} as Partial<Employer>;
  const [companyName, setCompanyName] = useState(emp.companyName || '');
  const [contactPerson, setContactPerson] = useState(emp.contactPerson || '');
  const [gender, setGender] = useState(emp.gender || 'Male');
  const [description, setDescription] = useState(emp.description || '');
  const [website, setWebsite] = useState(emp.website || '');
  const [phone, setPhone] = useState(emp.phone || '');
  const [email, setEmail] = useState(emp.email || '');
  const [location, setLocation] = useState(emp.location || '');
  const [industry, setIndustry] = useState(emp.industry || '');

  // Talent Preferences Fields
  const [desiredSkills, setDesiredSkills] = useState<string[]>(emp.desiredSkills || ['React', 'TypeScript', 'Node.js']);
  const [newSkill, setNewSkill] = useState('');
  const [hiringCategories, setHiringCategories] = useState<string[]>(emp.hiringCategories || ['Backend', 'Full Stack']);
  const [hiringTypes, setHiringTypes] = useState<string[]>(emp.hiringTypes || ['Full-time', 'Remote']);
  const [targetQualifications, setTargetQualifications] = useState(emp.targetQualifications || 'Any (Open to all vetted talent)');

  // Logo and Cover States
  const [companyLogo, setCompanyLogo] = useState(emp.companyLogo || '');
  const [coverPhoto, setCoverPhoto] = useState(emp.coverPhoto || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200&h=400');
  
  const [isUploading, setIsUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState<number | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<boolean>(false);

  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverSuccess, setCoverSuccess] = useState<boolean>(false);

  // Security
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);

  // Sync local state whenever employer prop changes
  React.useEffect(() => {
    if (employer) {
      if (employer.companyName) setCompanyName(employer.companyName);
      if (employer.contactPerson) setContactPerson(employer.contactPerson);
      if (employer.gender) setGender(employer.gender);
      if (employer.description !== undefined) setDescription(employer.description);
      if (employer.website !== undefined) setWebsite(employer.website);
      if (employer.phone !== undefined) setPhone(employer.phone);
      if (employer.email !== undefined) setEmail(employer.email);
      if (employer.location) setLocation(employer.location);
      if (employer.industry) setIndustry(employer.industry);
      if (employer.desiredSkills) setDesiredSkills(employer.desiredSkills);
      if (employer.hiringCategories) setHiringCategories(employer.hiringCategories);
      if (employer.hiringTypes) setHiringTypes(employer.hiringTypes);
      if (employer.targetQualifications) setTargetQualifications(employer.targetQualifications);
      if (employer.profileImageUrl || employer.companyLogo) {
        setCompanyLogo(employer.profileImageUrl || employer.companyLogo);
      }
    }
  }, [employer.id, employer.profileImageUrl, employer.companyLogo, employer.updatedAt, employer.gender]);

  const handleSaveCorporate = (e: React.FormEvent) => {
    e.preventDefault();
    const isCustom = Boolean(companyLogo && !companyLogo.includes('unsplash.com'));
    const updatedEmp: Employer = {
      ...employer,
      companyName,
      contactPerson,
      gender,
      description,
      website,
      phone,
      email,
      location,
      industry,
      desiredSkills,
      hiringCategories,
      hiringTypes,
      companyLogo,
      profileImageUrl: companyLogo,
      hasCustomProfileImage: isCustom,
      targetQualifications,
      updatedAt: new Date().toISOString()
    };
    onUpdateEmployer(updatedEmp);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !desiredSkills.includes(newSkill.trim())) {
      setDesiredSkills([...desiredSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setDesiredSkills(desiredSkills.filter(s => s !== skill));
  };

  const handleToggleHiringType = (type: string) => {
    if (hiringTypes.includes(type)) {
      setHiringTypes(hiringTypes.filter(t => t !== type));
    } else {
      setHiringTypes([...hiringTypes, type]);
    }
  };

  const handleToggleCategory = (cat: string) => {
    if (hiringCategories.includes(cat)) {
      setHiringCategories(hiringCategories.filter(c => c !== cat));
    } else {
      setHiringCategories([...hiringCategories, cat]);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setLogoError('Only JPG, JPEG, PNG, and WebP images are allowed.');
        return;
      }

      // Validate size
      if (file.size > 5 * 1024 * 1024) {
        setLogoError('File size exceeds the 5MB limit.');
        return;
      }

      setLogoError(null);
      setLogoSuccess(false);
      setLogoProgress(0);
      setIsUploading(true);

      try {
        const uploadUrl = await uploadProfileImage(
          employer.id,
          file,
          'employer',
          (progress) => {
            setLogoProgress(progress);
          }
        );

        setCompanyLogo(uploadUrl);
        setLogoSuccess(true);
        setLogoProgress(null);

        const updatedEmp: Employer = {
          ...employer,
          companyLogo: uploadUrl,
          profileImageUrl: uploadUrl,
          hasCustomProfileImage: true,
          companyName,
          contactPerson,
          description,
          website,
          phone,
          email,
          location,
          industry,
          desiredSkills,
          hiringCategories,
          hiringTypes,
          targetQualifications,
        };
        console.log("Profile object returned to UI (Employer):", updatedEmp);
        onUpdateEmployer(updatedEmp);
        setTimeout(() => setLogoSuccess(false), 4000);
      } catch (err: any) {
        console.error("Storage upload failed:", err);
        setLogoError(err.message || 'Logo upload failed. Please try again.');
        setLogoProgress(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setCoverError('Only JPG, JPEG, PNG, and WebP images are allowed.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setCoverError('Cover image size exceeds 10MB limit.');
        return;
      }

      setCoverError(null);
      setCoverSuccess(false);
      setCoverProgress(0);
      setIsCoverUploading(true);

      try {
        const uploadUrl = await uploadFileToStorage(file, 'covers', coverPhoto, (progress) => {
          setCoverProgress(progress);
        });

        setCoverPhoto(uploadUrl);
        setCoverSuccess(true);
        setCoverProgress(null);

        const updatedEmp: Employer = {
          ...employer,
          coverPhoto: uploadUrl,
          companyName,
          contactPerson,
          description,
          website,
          phone,
          email,
          location,
          industry,
          desiredSkills,
          hiringCategories,
          hiringTypes,
          companyLogo,
          profileImageUrl: companyLogo,
          hasCustomProfileImage: true,
          targetQualifications,
        };
        onUpdateEmployer(updatedEmp);
        setTimeout(() => setCoverSuccess(false), 4000);
      } catch (err: any) {
        console.error("Storage upload failed, falling back to base64:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setCoverPhoto(base64);
          setCoverSuccess(true);
          setCoverProgress(null);
          const updatedEmp: Employer = {
            ...employer,
            coverPhoto: base64,
            companyName,
            contactPerson,
            description,
            website,
            phone,
            email,
            location,
            industry,
            desiredSkills,
            hiringCategories,
            hiringTypes,
            companyLogo,
            profileImageUrl: companyLogo,
            hasCustomProfileImage: true,
            targetQualifications,
          };
          onUpdateEmployer(updatedEmp);
          setTimeout(() => setCoverSuccess(false), 4000);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCoverUploading(false);
      }
    }
  };

  const availableHiringTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'];
  const availableCategories = ['CAD/CAM', 'Backend', 'Full Stack', 'UI/UX Design', 'Creative Arts', 'Cloud & DevOps', 'AI & Data Science', 'Cybersecurity'];

  if (activeTab === 'chat') {
    return (
      <div className="pt-0 pb-0 px-0 w-full max-w-none h-screen flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Full-Screen Chat Interface Wrapper */}
        <div className="flex-1 w-full min-h-0 relative flex flex-col">
          <RealtimeChat
            projectId={selectedChatProject?.id || employer.projects?.[0]?.id || 'default_chat_room'}
            projectTitle={selectedChatProject?.title || employer.projects?.[0]?.title || 'Workspace Chat'}
            project={selectedChatProject || employer.projects?.[0] || undefined}
            userId={employer.id}
            userName={employer.companyName}
            userRole="employer"
            onSelectProject={(proj) => setSelectedChatProject(proj)}
            onBack={() => handleTabChange(previousTab || 'profile')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 md:px-8 mx-auto transition-all max-w-7xl">
      
      {/* Corporate Branding Header Block */}
      <div className="relative rounded-3xl overflow-hidden border border-brand-border bg-white shadow-premium mb-8">
        {/* Cover Photo Banner */}
        <div className="h-44 md:h-56 relative bg-brand-midnight group">
          <img 
            src={coverPhoto} 
            alt="Corporate Cover" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors" />

          {/* Change Cover Photo button */}
          <label className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all border border-white/20 shadow-lg">
            <Camera size={15} className="text-brand-green" />
            <span>Change Cover Banner</span>
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleCoverChange} className="hidden" />
          </label>

          {/* Cover uploading progress overlay */}
          {isCoverUploading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-30">
              <RefreshCw className="animate-spin text-brand-green mb-2" size={26} />
              <p className="text-xs font-bold uppercase tracking-wider">Uploading Cover Banner...</p>
              <span className="text-xs font-mono font-bold text-brand-green mt-1">
                {coverProgress !== null ? `${coverProgress}%` : 'Processing...'}
              </span>
            </div>
          )}
        </div>

        {/* Corporate Profile Info Overlay */}
        <div className="px-6 md:px-8 pb-8 pt-0 -mt-10 md:-mt-14 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="relative group">
              <UserAvatar 
                name={companyName}
                email={email}
                src={companyLogo} 
                hasCustomProfileImage={employer.hasCustomProfileImage || Boolean(companyLogo && !companyLogo.includes('unsplash.com'))}
                sizeClassName="w-20 h-20 md:w-28 md:h-28"
                roundedClassName="rounded-2xl"
                className="border-4 border-white shadow-premium bg-brand-warm-white text-2xl md:text-4xl font-bold"
              />
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white text-center p-1">
                <Upload size={16} className="mb-0.5" />
                <span className="text-[9px] font-semibold uppercase tracking-wider">Change Logo</span>
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleLogoChange} className="hidden" />
              </label>

              {/* Uploading progress overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white">
                  <RefreshCw className="animate-spin text-brand-green mb-1" size={18} />
                  <span className="text-[10px] font-mono font-bold">
                    {logoProgress !== null ? `${logoProgress}%` : 'Compressing...'}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center md:text-left mb-2">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-brand-midnight tracking-tight">
                  {companyName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-midnight text-brand-gold font-mono text-[9px] uppercase font-bold tracking-wider border border-brand-gold/15">
                  <Sparkles size={9} />
                  Corporate Hub
                </span>
              </div>

              {/* Upload notifications */}
              {logoError && (
                <div className="mt-1 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center justify-center md:justify-start gap-1 max-w-md animate-pulse mx-auto md:mx-0">
                  <AlertCircle size={12} />
                  <span>{logoError}</span>
                </div>
              )}
              {logoSuccess && (
                <div className="mt-1 text-xs text-brand-green bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center justify-center md:justify-start gap-1 max-w-md mx-auto md:mx-0">
                  <CheckCircle size={12} />
                  <span>Company logo updated successfully!</span>
                </div>
              )}

              <p className="text-brand-green font-medium mt-0.5">{industry} Industry</p>
              <p className="text-gray-400 text-xs mt-1 font-semibold uppercase tracking-wider flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-brand-green" />
                  HQ: {location}, Abia State
                </span>
                <span className="flex items-center gap-1 border-l border-gray-200 pl-3">
                  <Sparkles size={12} className={employer?.reviewCount && employer?.reviewCount > 0 && employer?.averageRating ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
                  {employer?.reviewCount && employer?.reviewCount > 0 && employer?.averageRating ? (
                    <span>Real-time Rating: <strong className="text-brand-midnight font-mono">{employer.averageRating.toFixed(1)}</strong> / 5.0 ({employer.reviewCount} {employer.reviewCount === 1 ? 'review' : 'reviews'})</span>
                  ) : (
                    <span className="text-gray-400 font-normal normal-case">Unrated (No reviews submitted yet)</span>
                  )}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-center">
            {onNavigateToPostProject && (
              <button
                type="button"
                onClick={onNavigateToPostProject}
                className="px-5 py-3 rounded-xl bg-brand-midnight hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Plus size={14} className="text-brand-green" />
                Post a Project
              </button>
            )}
            <button
              onClick={handleSaveCorporate}
              className="px-5 py-3 rounded-xl bg-brand-green hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Check size={14} />
              {isSaved ? 'Details Saved!' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 sm:gap-6 lg:gap-8 border-b border-brand-border/60 mb-8 overflow-x-auto scrollbar-hide">
        {(
          [
            'profile',
            'managedProjects',
            'applications',
            'reviews',
            'preferences',
            'chat',
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-3 sm:px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'border-brand-green text-brand-midnight font-extrabold'
                : 'border-transparent text-gray-400 hover:text-brand-midnight'
            }`}
          >
            {tab === 'profile'
              ? 'Company Profile'
              : tab === 'managedProjects'
              ? '💼 Projects'
              : tab === 'applications'
              ? '📋 Applications'
              : tab === 'reviews'
              ? '⭐ Reviews & Complaints'
              : tab === 'preferences'
              ? 'Hiring Directives'
              : '💬 Chat'}
          </button>
        ))}
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Panel */}
        <div className={`${(activeTab === 'profile' || activeTab === 'preferences') ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white p-6 md:p-8 rounded-3xl border border-brand-border shadow-sm`}>
          {/* MANAGED PROJECTS TAB */}
          {activeTab === 'managedProjects' && (
            <DashboardProjectsModule
              userRole="employer"
              userId={employer.id}
              userName={employer.companyName || employer.contactPerson || 'Employer'}
              activeSection="projects"
            />
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <EmployerApplicationsView
              employerId={employer.id}
              employerName={employer.companyName || employer.contactPerson || 'Employer'}
            />
          )}

          {/* REVIEWS & COMPLAINTS TAB */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <div>
                <DashboardProjectsModule
                  userRole="employer"
                  userId={employer.id}
                  userName={employer.companyName || employer.contactPerson || 'Employer'}
                  activeSection="reviews"
                />
              </div>
              <div className="pt-6 border-t border-brand-border/60">
                <DashboardProjectsModule
                  userRole="employer"
                  userId={employer.id}
                  userName={employer.companyName || employer.contactPerson || 'Employer'}
                  activeSection="complaints"
                />
              </div>
            </div>
          )}
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              {/* Dedicated Media Upload Center */}
              <div className="p-6 rounded-2xl bg-brand-warm-white/70 border border-brand-border/80 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-border/60">
                  <div>
                    <h3 className="text-base font-display font-bold text-brand-midnight flex items-center gap-2">
                      <ImageIcon size={18} className="text-brand-green" />
                      Company Logo & Cover Banner Media Upload
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Upload high-resolution corporate logo and cover banners. Media is saved to Firestore and instantly synced across job postings and employer listings.
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-brand-green text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                    <CheckCircle size={12} /> Live Sync
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Logo Upload */}
                  <div className="p-4 rounded-xl bg-white border border-brand-border flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-brand-green tracking-wider">
                        01. Corporate Logo
                      </span>
                      <div className="mt-3 flex items-center gap-4">
                        <UserAvatar 
                          name={companyName}
                          email={email}
                          src={companyLogo} 
                          hasCustomProfileImage={employer.hasCustomProfileImage || Boolean(companyLogo && !companyLogo.includes('unsplash.com'))}
                          sizeClassName="w-16 h-16"
                          roundedClassName="rounded-xl"
                          className="border border-brand-border shadow-sm bg-brand-warm-white text-xl font-bold"
                        />
                        <div>
                          <p className="text-xs font-bold text-brand-midnight">Company Logo</p>
                          <p className="text-[11px] text-gray-400">JPG, PNG, WebP up to 5MB</p>
                          <p className="text-[10px] text-brand-green font-semibold mt-0.5">Recommended: 400x400px</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-brand-border/60">
                      <label className="w-full py-2.5 px-4 rounded-xl bg-brand-midnight hover:bg-brand-midnight/90 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                        <Upload size={14} className="text-brand-green" />
                        <span>Upload Company Logo</span>
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleLogoChange} className="hidden" />
                      </label>

                      {isUploading && (
                        <div className="mt-2 text-center text-xs text-brand-green font-mono flex items-center justify-center gap-1.5">
                          <RefreshCw className="animate-spin" size={13} />
                          <span>Uploading & Compressing ({logoProgress !== null ? `${logoProgress}%` : 'Wait...'})</span>
                        </div>
                      )}
                      {logoSuccess && (
                        <div className="mt-2 text-center text-xs text-brand-green font-semibold flex items-center justify-center gap-1">
                          <CheckCircle size={13} /> Logo updated & saved!
                        </div>
                      )}
                      {logoError && (
                        <div className="mt-2 text-center text-xs text-rose-600 font-semibold flex items-center justify-center gap-1">
                          <AlertCircle size={13} /> {logoError}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Cover Photo Banner Upload */}
                  <div className="p-4 rounded-xl bg-white border border-brand-border flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-brand-green tracking-wider">
                        02. Corporate Cover Banner
                      </span>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="w-24 h-14 rounded-lg overflow-hidden border border-brand-border bg-brand-midnight relative flex-shrink-0">
                          <img src={coverPhoto} alt="Cover Preview" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-brand-midnight">Landscape Banner</p>
                          <p className="text-[11px] text-gray-400">JPG, PNG, WebP up to 10MB</p>
                          <p className="text-[10px] text-brand-green font-semibold mt-0.5">Recommended: 1200x400px</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-brand-border/60">
                      <label className="w-full py-2.5 px-4 rounded-xl bg-brand-midnight hover:bg-brand-midnight/90 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                        <Camera size={14} className="text-brand-green" />
                        <span>Upload Cover Banner</span>
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleCoverChange} className="hidden" />
                      </label>

                      {isCoverUploading && (
                        <div className="mt-2 text-center text-xs text-brand-green font-mono flex items-center justify-center gap-1.5">
                          <RefreshCw className="animate-spin" size={13} />
                          <span>Uploading Cover Banner ({coverProgress !== null ? `${coverProgress}%` : 'Wait...'})</span>
                        </div>
                      )}
                      {coverSuccess && (
                        <div className="mt-2 text-center text-xs text-brand-green font-semibold flex items-center justify-center gap-1">
                          <CheckCircle size={13} /> Cover banner saved!
                        </div>
                      )}
                      {coverError && (
                        <div className="mt-2 text-center text-xs text-rose-600 font-semibold flex items-center justify-center gap-1">
                          <AlertCircle size={13} /> {coverError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveCorporate} className="space-y-6">
              <h2 className="text-lg font-display font-bold text-brand-midnight border-b border-brand-border/60 pb-3 flex items-center gap-2">
                <Building2 size={18} className="text-brand-green" />
                Corporate Branding Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none text-xs text-brand-midnight"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Industry Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight cursor-pointer"
                  >
                    <option>E-commerce & Retail</option>
                    <option>Educational Technology & EdTech</option>
                    <option>Manufacturing & Industrial</option>
                    <option>Creative Arts & Marketing</option>
                    <option>Logistics & Supply Chain</option>
                    <option>Cloud & Infrastructure</option>
                    <option>Fintech & Software</option>
                    <option>Agribusiness & Tech</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Contact Person Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Contact Gender
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                        gender === 'Male'
                          ? 'bg-brand-midnight text-white border-brand-midnight shadow-sm'
                          : 'bg-brand-warm-white text-gray-700 border-brand-border hover:border-brand-midnight'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                        gender === 'Female'
                          ? 'bg-brand-midnight text-white border-brand-midnight shadow-sm'
                          : 'bg-brand-warm-white text-gray-700 border-brand-border hover:border-brand-midnight'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                    Abia State Location
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                  Company Bio & Vision Narrative
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share details about what your company produces and the professional tech projects you are executing in Abia..."
                  className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight resize-none"
                />
              </div>

              <div className="border-t border-brand-border/60 pt-6">
                <h3 className="text-sm font-display font-bold text-brand-midnight mb-4 flex items-center gap-2">
                  <Globe size={16} className="text-brand-green" />
                  Corporate Connections & Channels
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      Company Website URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">
                        <Globe size={14} />
                      </span>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      Corporate Phone
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">
                        <Phone size={14} />
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      Inquiry Email Address
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
                </div>
              </div>

              {/* Account Security & Passkey Section inside Profile */}
              <div className="border-t border-brand-border/60 pt-6 space-y-4">
                <h3 className="text-sm font-display font-bold text-brand-midnight flex items-center gap-2">
                  <Settings size={18} className="text-brand-green" />
                  Account Security & Passkey Setup
                </h3>

                <div className="space-y-4 bg-brand-warm-white/20 p-5 rounded-2xl border border-brand-border shadow-sm">
                  <h4 className="text-xs font-display font-bold text-brand-midnight flex items-center gap-1.5 uppercase tracking-wider">
                    <Key size={15} className="text-brand-green" />
                    Corporate Passkey & Credentials
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                        Change Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-brand-border outline-none text-xs text-brand-midnight"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => alert('Corporate credentials updated!')}
                        className="px-4 py-3 rounded-xl bg-brand-midnight hover:bg-brand-midnight/90 text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                      >
                        Update Passkey
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  Update Company Profile & Credentials
                </button>
              </div>
            </form>
          </div>
          )}

          {/* CHAT TAB (Main Enterprise Chat Section) */}
          {activeTab === 'chat' && (
            <div className="animate-fadeIn min-h-[600px] w-full">
              <RealtimeChat
                projectId={selectedChatProject?.id || 'default_chat_room'}
                projectTitle={selectedChatProject?.title || 'SureDev Main Chat System'}
                project={selectedChatProject || undefined}
                userId={employer.id}
                userName={employer.companyName}
                userRole="employer"
                onSelectProject={(proj) => setSelectedChatProject(proj)}
              />
            </div>
          )}

          {/* HIRING DIRECTIVES TAB */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <h2 className="text-lg font-display font-bold text-brand-midnight border-b border-brand-border/60 pb-3 flex items-center gap-2">
                <Briefcase size={18} className="text-brand-green" />
                Active Talent Acquisition Directives
              </h2>

              {/* Hiring Category Tracks */}
              <div>
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-3 flex items-center gap-1.5">
                  <Layout size={14} className="text-brand-green" />
                  Categories of Recruitment
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableCategories.map((cat) => {
                    const isSelected = hiringCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleToggleCategory(cat)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-brand-green/10 border-brand-green text-brand-green'
                            : 'bg-brand-warm-white/30 border-brand-border hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <span>{cat}</span>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hiring Types Tracks */}
              <div>
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-3 flex items-center gap-1.5">
                  <Clock size={14} className="text-brand-green" />
                  Contract & Commitment Types
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableHiringTypes.map((type) => {
                    const isSelected = hiringTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => handleToggleHiringType(type)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-brand-midnight text-brand-gold border-brand-midnight shadow-md'
                            : 'bg-brand-warm-white/30 border-brand-border hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <span>{type}</span>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Qualifications */}
              <div className="border-t border-brand-border/60 pt-6">
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-3 flex items-center gap-1.5">
                  Preferred Candidate Qualification
                </h3>
                <select
                  value={targetQualifications}
                  onChange={(e) => {
                    setTargetQualifications(e.target.value);
                    const updatedEmp: Employer = {
                      ...employer,
                      companyName,
                      contactPerson,
                      description,
                      website,
                      phone,
                      email,
                      location,
                      industry,
                      desiredSkills,
                      hiringCategories,
                      hiringTypes,
                      companyLogo,
                      targetQualifications: e.target.value
                    };
                    onUpdateEmployer(updatedEmp);
                  }}
                  className="w-full max-w-md px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight cursor-pointer"
                >
                  <option value="Any (Open to all vetted talent)">Any (Open to all vetted talent)</option>
                  <option value="B.Sc. / B.Tech Computer Science or Engineering">B.Sc. / B.Tech Computer Science or Engineering</option>
                  <option value="HND / OND (Polytechnic / Technical Degree)">HND / OND (Polytechnic / Technical Degree)</option>
                  <option value="Certified Bootcamp Graduate">Certified Bootcamp Graduate</option>
                  <option value="Self-Taught with proven portfolios">Self-Taught with proven portfolios</option>
                </select>
              </div>
            </div>
          )}

          {/* CHAT TAB (Empty Panel for future details) */}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-display font-bold text-brand-midnight border-b border-brand-border/60 pb-3 flex items-center gap-2">
                <Settings size={18} className="text-brand-green" />
                Security & Portal Configuration
              </h2>

              <div className="space-y-4 bg-brand-warm-white/10 p-5 rounded-2xl border border-brand-border shadow-sm">
                <h3 className="text-sm font-display font-bold text-brand-midnight flex items-center gap-1.5">
                  <Key size={16} className="text-brand-green" />
                  Corporate Passkey
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1.5">
                      Change Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-brand-border outline-none text-xs text-brand-midnight"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => alert('Corporate credentials updated!')}
                      className="px-4 py-3 rounded-xl bg-brand-midnight hover:bg-brand-midnight/90 text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                    >
                      Update Passkey
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar - Only present on profile and preferences sections */}
        {(activeTab === 'profile' || activeTab === 'preferences') && (
          <div className="lg:col-span-4 space-y-6">
          
          {/* Desired Skills Block */}
          <div className="bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-4">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight flex items-center justify-between">
              <span>Desired Technical Skills</span>
              <span className="px-2 py-0.5 bg-brand-midnight text-brand-gold rounded font-mono text-[9px] font-bold">
                {desiredSkills.length} Desired
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
                className="p-2 rounded-xl bg-brand-green hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
              >
                <Plus size={16} />
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {desiredSkills.map((skill, idx) => (
                <span 
                  key={`${skill}-${idx}`} 
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

          {/* Quick Stats Summary */}
          <div className="bg-brand-midnight text-gray-300 p-6 rounded-3xl border border-brand-midnight font-mono text-xs shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-gold mb-2 flex items-center gap-1.5">
              <Code size={14} className="text-brand-green animate-pulse" />
              Directives Analytics
            </h3>
            <div className="space-y-2 text-[11px] relative z-10 text-gray-400">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span>Total Matches Sourced:</span>
                <span className="text-white font-bold">12 Developers</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span>Open Target Categories:</span>
                <span className="text-white font-bold">{hiringCategories.length} Tracks</span>
              </div>
              <div className="flex justify-between">
                <span>Vetted Requirements:</span>
                <span className="text-white font-bold">{desiredSkills.length} Skills</span>
              </div>
            </div>
          </div>

        </div>
        )}

      </div>

    </div>
  );
};
