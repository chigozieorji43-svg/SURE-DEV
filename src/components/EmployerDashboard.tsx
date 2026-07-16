import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, User, Globe, Mail, Phone, MapPin, Briefcase, Plus, Check, Upload, Sparkles, Code, Layout, Clock, Settings, Key
} from 'lucide-react';
import { Employer } from '../types';
import { GoogleInbox } from './GoogleInbox';

interface EmployerDashboardProps {
  employer: Employer;
  onUpdateEmployer: (updated: Employer) => void;
  onPreviewProfile: () => void;
  isGoogleUser?: boolean;
  onConnectGoogle?: () => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  employer,
  onUpdateEmployer,
  onPreviewProfile,
  isGoogleUser,
  onConnectGoogle,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'gmail' | 'security'>('profile');
  const [isSaved, setIsSaved] = useState(false);

  // Corporate Profile Fields
  const [companyName, setCompanyName] = useState(employer.companyName);
  const [contactPerson, setContactPerson] = useState(employer.contactPerson);
  const [description, setDescription] = useState(employer.description);
  const [website, setWebsite] = useState(employer.website);
  const [phone, setPhone] = useState(employer.phone);
  const [email, setEmail] = useState(employer.email);
  const [location, setLocation] = useState(employer.location);
  const [industry, setIndustry] = useState(employer.industry);

  // Talent Preferences Fields
  const [desiredSkills, setDesiredSkills] = useState<string[]>(employer.desiredSkills || ['React', 'TypeScript', 'Node.js']);
  const [newSkill, setNewSkill] = useState('');
  const [hiringCategories, setHiringCategories] = useState<string[]>(employer.hiringCategories || ['Backend', 'Full Stack']);
  const [hiringTypes, setHiringTypes] = useState<string[]>(employer.hiringTypes || ['Full-time', 'Remote']);
  const [targetQualifications, setTargetQualifications] = useState(employer.targetQualifications || 'Any (Open to all vetted talent)');

  // Logo Mock State
  const [companyLogo, setCompanyLogo] = useState(employer.companyLogo);

  // Security
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);

  const handleSaveCorporate = (e: React.FormEvent) => {
    e.preventDefault();
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
      targetQualifications,
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const availableHiringTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'];
  const availableCategories = ['CAD/CAM', 'Backend', 'Full Stack', 'UI/UX Design', 'Creative Arts', 'Cloud & DevOps', 'AI & Data Science', 'Cybersecurity'];

  return (
    <div className="pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
      
      {/* corporate Branding Header Block */}
      <div className="relative rounded-3xl overflow-hidden border border-brand-border bg-white shadow-premium mb-8 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="relative group">
              <img 
                src={companyLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200&h=200'} 
                alt={companyName} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border border-brand-border shadow-sm bg-brand-warm-white"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white">
                <Upload size={14} />
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
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
              <p className="text-brand-green font-medium mt-0.5">{industry} Industry</p>
              <p className="text-gray-400 text-xs mt-1 font-semibold uppercase tracking-wider flex items-center gap-1 justify-center md:justify-start">
                <MapPin size={12} className="text-brand-green" />
                HQ: {location}, Abia State
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-center">
            <button
              onClick={onPreviewProfile}
              className="px-5 py-3 rounded-xl border border-brand-border text-gray-700 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Building2 size={14} />
              View Company Card
            </button>
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
      <div className="flex border-b border-brand-border/60 mb-8 overflow-x-auto scrollbar-hide">
        {(['profile', 'preferences', 'gmail', 'security'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'border-brand-green text-brand-midnight font-extrabold'
                : 'border-transparent text-gray-400 hover:text-brand-midnight'
            }`}
          >
            {tab === 'profile' ? 'Company Profile' : tab === 'preferences' ? 'Hiring Directives' : tab === 'gmail' ? '📬 Google Inbox' : 'Account Config'}
          </button>
        ))}
      </div>

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Panel */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-brand-border shadow-sm">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
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
                    <option>Manufacturing & Industrial</option>
                    <option>Creative Arts & Marketing</option>
                    <option>Logistics & Supply Chain</option>
                    <option>Cloud & Infrastructure</option>
                    <option>Fintech & Software</option>
                    <option>Agribusiness & Tech</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  Update Company Profile
                </button>
              </div>
            </form>
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
                userEmail={employer.email}
                userName={employer.contactPerson}
                isGoogleConnected={!!isGoogleUser}
                onConnectGoogle={onConnectGoogle || (() => {})}
                accountType="employer"
              />
            </div>
          )}

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

        {/* Right Sidebar */}
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
              {desiredSkills.map((skill) => (
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

      </div>

    </div>
  );
};
