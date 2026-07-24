import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Briefcase, MapPin, Calendar, Github, Linkedin, 
  Twitter, Globe, Mail, ArrowRight, CheckCircle, Upload, Lock,
  Award, FileText, Send, Terminal, User, Cpu, History, BookOpen, Star, Sparkles, Check, ChevronRight, Activity,
  Eye, EyeOff
} from 'lucide-react';
import { Developer, Project } from '../types';
import { 
  auth, 
  db,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  isFirebaseConfigured,
  sendPasswordResetEmail,
  sendEmailVerification,
  collection,
  query,
  where,
  getDocs
} from '../lib/firebase';
import { uploadFileToStorage, uploadProfileImage, dbService } from '../lib/firebaseService';

interface DeveloperDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  developer: Developer | null;
  onHireClick: (dev: Developer) => void;
}

export const DeveloperDetailsModal: React.FC<DeveloperDetailsModalProps> = ({
  isOpen,
  onClose,
  developer,
  onHireClick,
}) => {
  if (!isOpen || !developer) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'tech' | 'projects' | 'contact'>('overview');
  
  // Interactive State for Skill Endorsements
  const [endorsements, setEndorsements] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    developer.skills.forEach((skill, idx) => {
      // Seed consistent endorsements based on index or string hash
      const hash = skill.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      initial[skill] = (hash % 15) + 8;
    });
    return initial;
  });
  
  const [endorsedSkills, setEndorsedSkills] = useState<Record<string, boolean>>({});

  const handleEndorse = (skill: string) => {
    if (endorsedSkills[skill]) return;
    setEndorsements(prev => ({
      ...prev,
      [skill]: prev[skill] + 1
    }));
    setEndorsedSkills(prev => ({
      ...prev,
      [skill]: true
    }));
  };

  // Direct Message & Booking Form States
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Template pre-fills
  const templates = [
    {
      label: '💼 Project Contract',
      text: `Hi ${developer.name},\n\nWe love your work as a ${developer.title} on SureDev. We have a 3-month contract role open in Abia for custom digital engineering. Let's schedule a 15-minute sync.`
    },
    {
      label: '⚡ Quick Question',
      text: `Hello ${developer.name},\n\nI was looking at your featured project: "${developer.projects[0]?.title || 'portfolio work'}". I'm curious about your technical setup and would love to ask you a quick question about it!`
    },
    {
      label: '🚀 Full-Time Hire',
      text: `Dear ${developer.name},\n\nOur technical team is highly impressed by your vetted SureDev profile. We'd love to connect to discuss full-time remote or hybrid opportunities with us. Let us know your availability.`
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderEmail || !message) return;
    
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      // Reset form
      setSenderName('');
      setSenderEmail('');
      setMessage('');
    }, 1500);
  };

  // Dynamic consistent scores based on developer ID / details
  const getVettingMetrics = () => {
    const isCad = developer.skills.some(s => ['fusion 360', 'solidworks', '3d modeling'].includes(s.toLowerCase()));
    return {
      logic: 92 + (developer.experience % 7),
      architecture: 88 + (developer.experience % 9),
      interface: isCad ? 96 : 89 + (developer.experience % 6),
      communication: 90 + (developer.experience % 5),
      speed: 94 - (developer.experience % 3),
      rank: developer.featured ? 'Top 1% Elite' : 'Top 5% Gold Vetted'
    };
  };

  const metrics = getVettingMetrics();

  // Consistent Professional Milestones based on Developer Data
  const getTimeline = () => {
    return [
      {
        year: '2024 - Present',
        role: `Senior ${developer.title}`,
        company: 'SureDev Vetted Expert Ecosystem',
        description: `Actively building localized tech solutions, manufacturing automation systems, and high-performance applications in ${developer.location}, Abia.`
      },
      {
        year: '2022 - 2024',
        role: `Consultant ${developer.skills[0]} Specialist`,
        company: 'Digital Innovation Hub / Freelance Partner',
        description: `Delivered production-ready client architectures, custom CAD/CAM molds, and responsive frontend systems for high-growth regional startups.`
      },
      {
        year: '2020 - 2022',
        role: 'Associate Software Engineer & Designer',
        company: 'Abia Creative Labs',
        description: 'Collaborated on UI modeling, system optimization, prototyping, and cross-functional technology integrations.'
      }
    ];
  };

  const timeline = getTimeline();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-white rounded-[28px] shadow-premium border border-brand-border overflow-hidden"
        >
          {/* Header Banner Background */}
          <div className="h-36 bg-gradient-to-r from-brand-midnight via-emerald-950 to-brand-midnight relative flex-shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all z-10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Core Profile Card Header */}
          <div className="px-8 md:px-12 -mt-14 relative z-10 border-b border-brand-border pb-4 flex-shrink-0 bg-white">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                <div className="relative">
                  <img
                    src={developer.avatar}
                    alt={developer.name}
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-premium bg-brand-warm-white"
                  />
                  <span className={`absolute -bottom-1 -right-1 block w-5.5 h-5.5 rounded-full border-4 border-white ${
                    developer.availability === 'immediate'
                      ? 'bg-brand-green'
                      : developer.availability === 'soon'
                      ? 'bg-brand-gold'
                      : 'bg-gray-300'
                  }`} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-display font-bold text-brand-midnight tracking-tight">
                      {developer.name}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-midnight text-brand-gold font-mono text-[10px] uppercase font-bold tracking-wider border border-brand-gold/20 shadow-sm">
                      <Sparkles size={11} className="text-brand-gold animate-pulse" />
                      {metrics.rank}
                    </span>
                  </div>
                  <p className="text-lg text-brand-green font-medium mt-1">
                    {developer.title}
                  </p>
                  <div className="flex flex-wrap gap-5 mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-brand-green" />
                      {developer.location}, Abia State
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={14} className="text-brand-green" />
                      {developer.experience} Years Vetted Exp
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} className="text-brand-green animate-pulse" />
                      {developer.email}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto pb-2">
                <button
                  onClick={() => onHireClick(developer)}
                  className="flex-1 md:flex-initial px-6 py-3.5 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all hover:translate-y-[-1px] cursor-pointer text-center whitespace-nowrap"
                >
                  Initiate Hiring
                </button>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex gap-1 border-t border-brand-border/60 mt-6 pt-1 overflow-x-auto scrollbar-hide">
              {(['overview', 'tech', 'projects', 'contact'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-brand-green text-brand-midnight font-extrabold'
                      : 'border-transparent text-gray-400 hover:text-brand-midnight hover:border-brand-border'
                  }`}
                >
                  {tab === 'tech' ? 'Technical Vetting' : tab === 'projects' ? 'Portfolio Work' : tab === 'contact' ? 'Message & Hire' : 'Overview'}
                </button>
              ))}
            </div>
          </div>

          {/* Profile Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-brand-warm-white/25">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="max-w-4xl mx-auto"
              >
                
                {/* TAB 1: OVERVIEW & BIOGRAPHY */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left main */}
                    <div className="lg:col-span-7 space-y-8">
                      {/* Bio text */}
                      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <User size={16} className="text-brand-green" />
                          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-brand-midnight">
                            Professional Summary
                          </h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed text-sm">
                          {developer.bio}
                        </p>
                      </div>

                      {/* Work History Timeline */}
                      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                          <History size={16} className="text-brand-green" />
                          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-brand-midnight">
                            Experience Timeline
                          </h3>
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-brand-border/60">
                          {timeline.map((item, index) => (
                            <div key={index} className="relative pl-8 group">
                              <span className="absolute left-[5px] top-1.5 w-3 h-3 rounded-full bg-brand-green border-2 border-white ring-4 ring-brand-green/15 transition-transform group-hover:scale-125" />
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/5 px-2 py-0.5 rounded-md">
                                  {item.year}
                                </span>
                                <span className="text-[11px] font-medium text-gray-400">
                                  SureDev Vetted
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-brand-midnight mt-1">
                                {item.role}
                              </h4>
                              <p className="text-xs font-semibold text-gray-500">
                                {item.company}
                              </p>
                              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right stats/skills sidebar */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Interactive Skills Endorsement */}
                      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <Award size={16} className="text-brand-green" />
                            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-brand-midnight">
                              Skills & Peer Endorsements
                            </h3>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                          Click any skill pill below to instantly submit a direct professional endorsement for {developer.name}.
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {developer.skills.map((skill) => {
                            const isEndorsed = endorsedSkills[skill];
                            return (
                              <button
                                key={skill}
                                onClick={() => handleEndorse(skill)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                  isEndorsed
                                    ? 'bg-brand-green/15 border-brand-green text-brand-green shadow-sm'
                                    : 'bg-brand-warm-white border-brand-border hover:border-gray-400 text-gray-600'
                                }`}
                              >
                                <span>{skill}</span>
                                <span className={`inline-flex px-1 py-0.5 rounded font-mono text-[9px] ${
                                  isEndorsed ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {endorsements[skill] || 10}
                                </span>
                                {isEndorsed && <Check size={11} className="text-brand-green" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Connect Profiles list */}
                      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
                        <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-4">
                          Secure Directory Anchors
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <a
                            href={developer.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-3 rounded-xl bg-brand-warm-white border border-brand-border hover:border-gray-400 hover:bg-gray-50 transition-colors text-xs font-bold text-gray-600"
                          >
                            <Github size={14} className="text-gray-400" />
                            GitHub
                          </a>
                          <a
                            href={developer.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-3 rounded-xl bg-brand-warm-white border border-brand-border hover:border-gray-400 hover:bg-gray-50 transition-colors text-xs font-bold text-gray-600"
                          >
                            <Linkedin size={14} className="text-gray-400" />
                            LinkedIn
                          </a>
                          <a
                            href={developer.twitterUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-3 rounded-xl bg-brand-warm-white border border-brand-border hover:border-gray-400 hover:bg-gray-50 transition-colors text-xs font-bold text-gray-600"
                          >
                            <Twitter size={14} className="text-gray-400" />
                            Twitter
                          </a>
                          <a
                            href={developer.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-3 rounded-xl bg-brand-warm-white border border-brand-border hover:border-gray-400 hover:bg-gray-50 transition-colors text-xs font-bold text-gray-600"
                          >
                            <Globe size={14} className="text-gray-400" />
                            Website
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: TECHNICAL VETTING METRICS */}
                {activeTab === 'tech' && (
                  <div className="space-y-8">
                    {/* Intro */}
                    <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
                      <div className="flex items-center gap-3">
                        <Terminal size={22} className="text-brand-green" />
                        <div>
                          <h3 className="font-display font-bold text-base text-brand-midnight">
                            SureDev Abia Protocol Evaluation Results
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            This report represents automated static code auditing, peer-reviewed engineering challenges, and algorithmic performance indices.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vetting Bar Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Vetting indicators */}
                      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm space-y-5">
                        <h4 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-2">
                          Core Performance Indices
                        </h4>
                        
                        {/* Meter 1 */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-midnight mb-1.5">
                            <span>Algorithmic Logic & Data Structures</span>
                            <span className="text-brand-green">{metrics.logic}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metrics.logic}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-brand-green"
                            />
                          </div>
                        </div>

                        {/* Meter 2 */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-midnight mb-1.5">
                            <span>System Architecture & Extensibility</span>
                            <span className="text-brand-green">{metrics.architecture}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metrics.architecture}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-brand-green"
                            />
                          </div>
                        </div>

                        {/* Meter 3 */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-midnight mb-1.5">
                            <span>Interface Fidelity & UX Precision</span>
                            <span className="text-brand-green">{metrics.interface}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metrics.interface}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-brand-green"
                            />
                          </div>
                        </div>

                        {/* Meter 4 */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-midnight mb-1.5">
                            <span>Technical Comm & Team Alignment</span>
                            <span className="text-brand-green">{metrics.communication}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metrics.communication}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-brand-green"
                            />
                          </div>
                        </div>

                      </div>

                      {/* Mock Terminal Diagnostics */}
                      <div className="bg-brand-midnight text-gray-300 p-6 rounded-2xl border border-brand-midnight font-mono text-xs shadow-lg space-y-4 relative overflow-hidden">
                        <div className="absolute top-2 right-3 flex gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        </div>
                        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2 text-[10px] text-gray-500">
                          <Activity size={12} className="text-brand-green" />
                          <span>DIAGNOSTIC ENGINE: v1.0.4-abia-protocol</span>
                        </div>
                        <p className="text-gray-500"># Initializing vetted workspace audit...</p>
                        <p className="text-brand-gold">&gt; scanning repo commits and lint patterns</p>
                        <p className="text-emerald-400">&gt; check: test coverage {88 + (developer.experience % 8)}% - SUCCESS</p>
                        <p className="text-emerald-400">&gt; check: bundle payload optimization - OK</p>
                        <p className="text-emerald-400">&gt; check: local Abia sandbox deployment - STABLE</p>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 mt-4">
                          <p className="text-[11px] text-brand-gold font-bold">VETTING RECOMMENDATION:</p>
                          <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
                            Vetted as Senior Tier with strong capacity in {developer.skills[0]} and {developer.skills[1] || 'modern system engineering'}. Highly recommended for immediate local/international remote workflows.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 3: FEATURED PORTFOLIO WORK */}
                {activeTab === 'projects' && (
                  <div className="space-y-8">
                    {developer.projects.map((project) => (
                      <div key={project.id} className="bg-white rounded-3xl overflow-hidden border border-brand-border shadow-premium group">
                        <div className="aspect-[21/9] relative overflow-hidden bg-brand-midnight">
                          <img
                            src={project.image}
                            alt={project.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 md:p-8">
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-green text-white font-mono text-[9px] uppercase font-bold tracking-wider mb-2">
                                Featured Case Study
                              </span>
                              <h4 className="text-xl md:text-2xl font-display font-bold text-white">
                                {project.title}
                              </h4>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 space-y-6">
                          <div>
                            <h5 className="text-[10px] font-display font-bold uppercase tracking-wider text-gray-400 mb-2">
                              Project Narrative & Challenges
                            </h5>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {project.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-border/60">
                            <div>
                              <h5 className="text-[10px] font-display font-bold uppercase tracking-wider text-brand-green mb-2">
                                Technologies Deployed
                              </h5>
                              <div className="flex flex-wrap gap-1.5">
                                {project.tags.map((tag) => (
                                  <span key={tag} className="px-2.5 py-1 rounded-xl bg-brand-warm-white text-gray-600 font-medium text-xs border border-brand-border/60">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-[10px] font-display font-bold uppercase tracking-wider text-brand-midnight mb-2">
                                Engineering Links
                              </h5>
                              <div className="flex gap-4">
                                {project.demoUrl && (
                                  <a
                                    href={project.demoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:text-emerald-700 transition-colors"
                                  >
                                    Live Demonstration <ArrowRight size={14} />
                                  </a>
                                )}
                                {project.githubUrl && (
                                  <a
                                    href={project.githubUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-midnight transition-colors"
                                  >
                                    View Repository <Github size={14} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 4: DIRECT MESSAGE & OUTREACH FORM */}
                {activeTab === 'contact' && (
                  <div className="bg-white p-8 rounded-3xl border border-brand-border shadow-premium">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      
                      {/* Left prefill details */}
                      <div className="md:w-1/3 space-y-6">
                        <div>
                          <h4 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-2">
                            Quick Inquiries
                          </h4>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            Select one of our pre-structured outreach templates to instantly compose an ideal message proposal.
                          </p>
                        </div>
                        <div className="space-y-2.5">
                          {templates.map((tpl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setMessage(tpl.text)}
                              className="w-full text-left p-3 rounded-xl border border-brand-border hover:border-brand-green bg-brand-warm-white hover:bg-white text-xs font-semibold text-gray-700 transition-all cursor-pointer shadow-sm"
                            >
                              {tpl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right actual form */}
                      <div className="flex-1 w-full">
                        {isSent ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-brand-green/5 border border-brand-green/20 rounded-2xl p-8 text-center space-y-4"
                          >
                            <div className="w-12 h-12 bg-brand-green text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                              <CheckCircle size={24} />
                            </div>
                            <h4 className="font-display font-bold text-lg text-brand-midnight">
                              Proposal Logged Successfully
                            </h4>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                              Your direct inquiry has been transmitted to {developer.name}. SureDev Abia Protocol will facilitate responses within 4 hours.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsSent(false)}
                              className="px-4 py-2 text-xs font-bold text-brand-green hover:underline cursor-pointer"
                            >
                              Compose Another Message
                            </button>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleSendMessage} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-display font-bold uppercase tracking-wider text-gray-400 mb-1">
                                  Your Name
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={senderName}
                                  onChange={(e) => setSenderName(e.target.value)}
                                  placeholder="e.g. Chigozie"
                                  className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none text-xs text-brand-midnight transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-display font-bold uppercase tracking-wider text-gray-400 mb-1">
                                  Contact Email
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={senderEmail}
                                  onChange={(e) => setSenderEmail(e.target.value)}
                                  placeholder="e.g. partner@firm.com"
                                  className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none text-xs text-brand-midnight transition-colors"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-display font-bold uppercase tracking-wider text-gray-400 mb-1">
                                Custom Message Proposal
                              </label>
                              <textarea
                                required
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="State your contract scope, timeline, compensation range, or specialized requirements..."
                                className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none text-xs text-brand-midnight transition-colors resize-none"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isSending}
                              className="w-full py-3.5 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
                            >
                              {isSending ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Logging secure transmission...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  <span>Dispatch Direct Proposal</span>
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>

                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Hire Developer Modal
interface HireDeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  developer: Developer | null;
}

export const HireDeveloperModal: React.FC<HireDeveloperModalProps> = ({
  isOpen,
  onClose,
  developer,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    roleDetails: '',
    budget: '₦500k - ₦1m / month',
    duration: 'Contract (3-6 Months)',
  });

  if (!isOpen || !developer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3); // Success Screen
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({
      name: '',
      email: '',
      company: '',
      roleDetails: '',
      budget: '₦500k - ₦1m / month',
      duration: 'Contract (3-6 Months)',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[24px] shadow-premium border border-brand-border overflow-hidden"
        >
          {/* Close */}
          <button
            onClick={resetAndClose}
            className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
          >
            <X size={18} />
          </button>

          <div className="p-8 md:p-10">
            {step === 1 && (
              <div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-brand-green">
                  Step 1 of 2
                </span>
                <h3 className="text-2xl font-display font-bold text-brand-midnight mt-1">
                  Hire {developer.name}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Send a premium contract proposal or direct hire inquiry. Verified by SureDev.
                </p>

                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aliko Dangote"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none text-sm text-brand-midnight transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Business Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. nnamdi@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none text-sm text-brand-midnight transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Company Name / Project
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Abia Digital Corp"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none text-sm text-brand-midnight transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <button
                    onClick={() => {
                      if (formData.name && formData.email) setStep(2);
                    }}
                    disabled={!formData.name || !formData.email}
                    className="px-6 py-3.5 rounded-xl bg-brand-green text-white font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-brand-green">
                  Step 2 of 2
                </span>
                <h3 className="text-2xl font-display font-bold text-brand-midnight mt-1">
                  Project Engagement
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Help {developer.name} understand your requirements and budget.
                </p>

                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Proposed Monthly Budget
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight transition-colors"
                    >
                      <option>₦300k - ₦500k / month</option>
                      <option>₦500k - ₦1m / month</option>
                      <option>₦1m - ₦2m / month</option>
                      <option>₦2m+ / month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Engagement Model
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight transition-colors"
                    >
                      <option>Full-Time Contract</option>
                      <option>Contract (3-6 Months)</option>
                      <option>Part-Time / Advisory</option>
                      <option>One-off Project</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Role / Project Summary
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe the stack, deliverables, and expectations..."
                      value={formData.roleDetails}
                      onChange={(e) => setFormData({ ...formData, roleDetails: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none text-sm text-brand-midnight transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-xl bg-brand-green text-white font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    Submit Proposal <CheckCircle size={16} />
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-brand-green mb-5">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-2xl font-display font-bold text-brand-midnight">
                  Proposal Logged!
                </h3>
                <p className="text-sm text-gray-500 mt-3 max-w-sm mx-auto leading-relaxed">
                  We have secured your contract query for <strong>{developer.name}</strong>. An email notification and local direct sync message have been sent.
                </p>
                <div className="mt-8">
                  <button
                    onClick={resetAndClose}
                    className="w-full py-3.5 rounded-xl bg-brand-midnight text-white hover:bg-brand-midnight/90 font-medium text-sm transition-colors cursor-pointer"
                  >
                    Return to Directory
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Join SureDev Modal
interface JoinSureDevModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (formData: any, accountType: 'developer' | 'employer') => void;
}

export const JoinSureDevModal: React.FC<JoinSureDevModalProps> = ({ isOpen, onClose, onJoinSuccess }) => {
  const [accountType, setAccountType] = useState<'developer' | 'employer' | null>(null);
  const [step, setStep] = useState(0); // Step 0: Choose Account Type, Step 1-2: Onboarding
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdUid, setCreatedUid] = useState<string | null>(null);
  const [showDevPassword, setShowDevPassword] = useState(false);
  const [showEmpPassword, setShowEmpPassword] = useState(false);
  
  // Developer Form State
  const [devData, setDevData] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    location: 'Aba',
    experience: '3',
    skills: '',
    github: '',
    portfolio: '',
    avatar: '',
    qualification: '',
  });

  // Employer Form State
  const [empData, setEmpData] = useState({
    companyName: '',
    companyLogo: '',
    contactPerson: '',
    description: '',
    website: '',
    phone: '',
    email: '',
    password: '',
    location: 'Aba',
    industry: 'E-commerce & Retail',
    desiredSkills: '',
    hiringCategories: [] as string[],
    hiringTypes: [] as string[],
    targetQualifications: '',
  });

  const [isDragging, setIsDragging] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        const { name, email, avatar } = event.data.user;
        
        if (accountType === 'developer') {
          setDevData(prev => ({
            ...prev,
            name: name,
            email: email,
            avatar: avatar || prev.avatar
          }));
          setGoogleConnected(true);
        } else if (accountType === 'employer') {
          setEmpData(prev => ({
            ...prev,
            contactPerson: name,
            email: email,
            companyLogo: avatar || prev.companyLogo
          }));
          setGoogleConnected(true);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [accountType]);

  const handleGoogleSignUp = async () => {
    if (auth) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        const name = firebaseUser.displayName || '';
        const email = firebaseUser.email || '';
        const avatar = firebaseUser.photoURL || '';

        if (accountType === 'developer') {
          setDevData(prev => ({
            ...prev,
            name: name,
            email: email,
            avatar: avatar || prev.avatar
          }));
          setGoogleConnected(true);
        } else if (accountType === 'employer') {
          setEmpData(prev => ({
            ...prev,
            contactPerson: name,
            email: email,
            companyLogo: avatar || prev.companyLogo
          }));
          setGoogleConnected(true);
        }
      } catch (err: any) {
        console.error("Google Sign-Up Error:", err);
        alert(err.message || "Failed to authenticate with Google via Firebase.");
      }
    } else {
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        '/google-auth.html',
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
      );
      
      if (!authWindow) {
        alert('Please allow popups to sign in with Google.');
      }
    }
  };

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'companyLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      try {
        let uploadUrl = '';
        if (auth && auth.currentUser) {
          uploadUrl = await uploadProfileImage(auth.currentUser.uid, file, field === 'avatar' ? 'developer' : 'employer');
        } else {
          const storagePath = field === 'avatar' ? 'avatars' : 'company_logos';
          const oldUrl = field === 'avatar' ? devData.avatar : empData.companyLogo;
          uploadUrl = await uploadFileToStorage(file, storagePath, oldUrl);
        }
        if (field === 'avatar') {
          setDevData((prev) => ({ ...prev, avatar: uploadUrl }));
        } else {
          setEmpData((prev) => ({ ...prev, companyLogo: uploadUrl }));
        }
      } catch (err: any) {
        console.error("Storage upload failed:", err);
        alert(err.message || "Failed to upload profile picture. Please select a valid JPG, PNG or WebP image.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, field: 'avatar' | 'companyLogo') => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      try {
        let uploadUrl = '';
        if (auth && auth.currentUser) {
          uploadUrl = await uploadProfileImage(auth.currentUser.uid, file, field === 'avatar' ? 'developer' : 'employer');
        } else {
          const storagePath = field === 'avatar' ? 'avatars' : 'company_logos';
          const oldUrl = field === 'avatar' ? devData.avatar : empData.companyLogo;
          uploadUrl = await uploadFileToStorage(file, storagePath, oldUrl);
        }
        if (field === 'avatar') {
          setDevData((prev) => ({ ...prev, avatar: uploadUrl }));
        } else {
          setEmpData((prev) => ({ ...prev, companyLogo: uploadUrl }));
        }
      } catch (err: any) {
        console.error("Storage upload failed:", err);
        alert(err.message || "Failed to upload profile picture. Please select a valid JPG, PNG or WebP image.");
      }
    }
  };

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (auth) {
      setIsLoading(true);
      setError(null);
      localStorage.setItem('suredev_registering', 'true');
      try {
        const passwordToUse = googleConnected ? "GoogleAuthPass123!" : devData.password;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, devData.email, passwordToUse);
          if (userCredential.user) {
            setCreatedUid(userCredential.user.uid);
            await sendEmailVerification(userCredential.user).catch((e) => {
              console.warn("Failed to send email verification:", e);
            });
            alert("A verification link has been dispatched to your email address. Please verify to fully secure your profile.");
          }
        } catch (fbErr: any) {
          // If already in use and Google is connected, let them proceed
          if (fbErr.code === 'auth/email-already-in-use' && googleConnected) {
            // allow to proceed
          } else if (fbErr.code === 'auth/email-already-in-use') {
            throw new Error("This email is already associated with an account. Please sign in or use a different email.");
          } else {
            throw fbErr;
          }
        }
        setStep(3); // success state
      } catch (err: any) {
        setError(err.message || "Failed to register account via Firebase.");
        localStorage.removeItem('suredev_registering');
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep(3); // success state
    }
  };

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (auth) {
      setIsLoading(true);
      setError(null);
      localStorage.setItem('suredev_registering', 'true');
      try {
        const passwordToUse = googleConnected ? "GoogleAuthPass123!" : empData.password;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, empData.email, passwordToUse);
          if (userCredential.user) {
            setCreatedUid(userCredential.user.uid);
            await sendEmailVerification(userCredential.user).catch((e) => {
              console.warn("Failed to send email verification:", e);
            });
            alert("A verification link has been dispatched to your email address. Please verify to fully secure your company account.");
          }
        } catch (fbErr: any) {
          // If already in use and Google is connected, let them proceed
          if (fbErr.code === 'auth/email-already-in-use' && googleConnected) {
            // allow to proceed
          } else if (fbErr.code === 'auth/email-already-in-use') {
            throw new Error("This email is already associated with an account. Please sign in or use a different email.");
          } else {
            throw fbErr;
          }
        }
        setStep(3); // success state
      } catch (err: any) {
        setError(err.message || "Failed to register account via Firebase.");
        localStorage.removeItem('suredev_registering');
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep(3); // success state
    }
  };

  const resetAndClose = () => {
    localStorage.removeItem('suredev_registering');
    setStep(0);
    setAccountType(null);
    setGoogleConnected(false);
    setCreatedUid(null);
    setError(null);
    setIsLoading(false);
    setDevData({
      name: '',
      email: '',
      password: '',
      title: '',
      location: 'Aba',
      experience: '3',
      skills: '',
      github: '',
      portfolio: '',
      avatar: '',
      qualification: '',
    });
    setEmpData({
      companyName: '',
      companyLogo: '',
      contactPerson: '',
      description: '',
      website: '',
      phone: '',
      email: '',
      password: '',
      location: 'Aba',
      industry: 'E-commerce & Retail',
      desiredSkills: '',
      hiringCategories: [],
      hiringTypes: [],
      targetQualifications: '',
    });
    onClose();
  };

  const handleFinishSetup = () => {
    const uid = createdUid || `user-${Date.now()}`;
    if (accountType === 'developer') {
      onJoinSuccess({ ...devData, id: uid, isGoogleUser: googleConnected }, 'developer');
    } else {
      onJoinSuccess({ ...empData, id: uid, isGoogleUser: googleConnected }, 'employer');
    }
    resetAndClose();
  };

  const availableCategories = ['CAD/CAM', 'Backend', 'Full Stack', 'UI/UX Design', 'Creative Arts', 'Cloud & DevOps', 'AI & Data Science', 'Cybersecurity'];
  const availableHiringTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[24px] shadow-premium border border-brand-border overflow-hidden"
        >
          <button
            onClick={resetAndClose}
            className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
          >
            <X size={18} />
          </button>

          <div className="p-8 md:p-10">
            {/* Step 0: Account Type Selection */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <span className="text-xs font-display font-semibold uppercase tracking-wider text-brand-green">
                    Get Started
                  </span>
                  <h3 className="text-2xl font-display font-bold text-brand-midnight mt-1">
                    Join SureDev Abia
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Choose your pathway to get onboarded into the ecosystem.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-6">
                  <button
                    onClick={() => {
                      setAccountType('developer');
                      setStep(1);
                    }}
                    className="w-full p-5 text-left rounded-2xl border border-brand-border hover:border-brand-green hover:bg-brand-green/5 transition-all cursor-pointer flex items-center gap-4 group"
                  >
                    <div className="p-3.5 rounded-xl bg-brand-green/10 text-brand-green group-hover:scale-105 transition-transform">
                      <Terminal size={22} />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-brand-midnight">
                        I'm a Developer
                      </span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        Build, publish, and showcase your portfolios to verified companies.
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 ml-auto group-hover:text-brand-green transition-colors" />
                  </button>

                  <button
                    onClick={() => {
                      setAccountType('employer');
                      setStep(1);
                    }}
                    className="w-full p-5 text-left rounded-2xl border border-brand-border hover:border-brand-midnight hover:bg-brand-midnight/5 transition-all cursor-pointer flex items-center gap-4 group"
                  >
                    <div className="p-3.5 rounded-xl bg-brand-midnight text-brand-gold group-hover:scale-105 transition-transform">
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-brand-midnight">
                        I'm a Hirer (Employer)
                      </span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        Browse, source, and recruit vetted engineering & design talent in Abia.
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 ml-auto group-hover:text-brand-gold transition-colors" />
                  </button>
                </div>
              </div>
            )}

            {/* DEVELOPER ONBOARDING FLOW */}
            {accountType === 'developer' && step === 1 && (
              <div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-brand-green">
                  Developer Step 1 of 2
                </span>
                <h3 className="text-2xl font-display font-bold text-brand-midnight mt-1">
                  Personal Credentials
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Be discovered by top regional manufacturers & agencies.
                </p>

                {googleConnected ? (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                    <CheckCircle size={16} className="text-brand-green" />
                    <span>Google Account authenticated! Basic info pre-filled below.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl border border-brand-border hover:bg-gray-50 text-brand-midnight font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign Up with Google
                  </button>
                )}

                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chioma Nnaji"
                      value={devData.name}
                      onChange={(e) => setDevData({ ...devData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. chioma@suredev.ng"
                      value={devData.email}
                      onChange={(e) => setDevData({ ...devData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                    />
                  </div>

                  {!googleConnected && (
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        Password (Min 6 characters)
                      </label>
                      <div className="relative">
                        <input
                          type={showDevPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={devData.password}
                          onChange={(e) => setDevData({ ...devData, password: e.target.value })}
                          className="w-full pl-4 pr-11 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDevPassword(!showDevPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-midnight focus:outline-none cursor-pointer p-1"
                        >
                          {showDevPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        Title / Track
                      </label>
                      <select
                        required
                        value={devData.title}
                        onChange={(e) => setDevData({ ...devData, title: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight cursor-pointer"
                      >
                        <option value="">Select track...</option>
                        <option value="CAD/CAM Engineer">CAD/CAM Engineer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Full Stack Engineer">Full Stack Engineer</option>
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="Creative Artist / Illustrator">Creative Artist</option>
                        <option value="Cloud & DevOps Architect">Cloud & DevOps</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        Location
                      </label>
                      <select
                        value={devData.location}
                        onChange={(e) => setDevData({ ...devData, location: e.target.value })}
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
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Highest Technical Qualification / Certification
                    </label>
                    <select
                      required
                      value={devData.qualification}
                      onChange={(e) => setDevData({ ...devData, qualification: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight cursor-pointer"
                    >
                      <option value="">Select qualification...</option>
                      <option value="B.Sc. / B.Tech Computer Science or Engineering">B.Sc. / B.Tech Computer Science or Engineering</option>
                      <option value="HND / OND (Polytechnic Technical Degree)">HND / OND (Polytechnic Technical Degree)</option>
                      <option value="Vetted Coding Bootcamp Graduate">Vetted Coding Bootcamp Graduate</option>
                      <option value="Self-Taught Industry Specialist">Self-Taught Industry Specialist</option>
                      <option value="National Craft Certificate / Vocational Diploma">National Craft Certificate / Vocational Diploma</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setStep(0)}
                    className="px-5 py-3 rounded-xl text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (devData.name && devData.email && devData.title && devData.qualification && (googleConnected || devData.password.length >= 6)) setStep(2);
                    }}
                    disabled={!devData.name || !devData.email || !devData.title || !devData.qualification || (!googleConnected && devData.password.length < 6)}
                    className="px-6 py-3.5 rounded-xl bg-brand-green text-white font-medium text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    Next: Expertise <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {accountType === 'developer' && step === 2 && (
              <form onSubmit={handleDevSubmit}>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-brand-green">
                  Developer Step 2 of 2
                </span>
                <h3 className="text-2xl font-display font-bold text-brand-midnight mt-1">
                  Expertise & Social Links
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Verify your craftsmanship with popular skills & repository references.
                </p>

                {error && (
                  <div className="p-3 mt-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Core Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. React, CAD/CAM, Node.js"
                      value={devData.skills}
                      onChange={(e) => setDevData({ ...devData, skills: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        GitHub Profile URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={devData.github}
                        onChange={(e) => setDevData({ ...devData, github: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        Portfolio / Website (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://mywebsite.dev"
                        value={devData.portfolio}
                        onChange={(e) => setDevData({ ...devData, portfolio: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Upload Headshot Photo (Optional)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      {devData.avatar ? (
                        <div className="flex items-center gap-4 w-full p-4 bg-brand-warm-white border border-brand-border rounded-xl">
                          <img
                            src={devData.avatar}
                            alt="Uploaded Avatar"
                            className="w-14 h-14 rounded-xl object-cover border border-brand-border"
                          />
                          <div className="flex-1 text-left">
                            <p className="text-xs font-semibold text-brand-midnight">Avatar Loaded</p>
                            <button
                              type="button"
                              onClick={() => setDevData((prev) => ({ ...prev, avatar: '' }))}
                              className="text-xs text-rose-600 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="avatar-upload-join"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, 'avatar')}
                          className="flex flex-col items-center justify-center w-full h-20 border-2 border-brand-border border-dashed rounded-xl cursor-pointer bg-brand-warm-white"
                        >
                          <div className="flex items-center gap-2 pt-1">
                            <Upload size={16} className="text-gray-400" />
                            <p className="text-xs text-gray-500 font-medium">Click to select photo</p>
                          </div>
                          <input
                            type="file"
                            id="avatar-upload-join"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'avatar')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3.5 rounded-xl bg-brand-green text-white font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Submitting Registry...' : 'Submit Registry'} <CheckCircle size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* EMPLOYER ONBOARDING FLOW */}
            {accountType === 'employer' && step === 1 && (
              <div>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-brand-green">
                  Employer Onboarding 1 of 2
                </span>
                <h3 className="text-2xl font-display font-bold text-brand-midnight mt-1">
                  Company Identity
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Share details about your firm or cooperative to start matching.
                </p>

                {googleConnected ? (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                    <CheckCircle size={16} className="text-brand-green" />
                    <span>Google Account authenticated! Basic info pre-filled below.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl border border-brand-border hover:bg-gray-50 text-brand-midnight font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign Up with Google
                  </button>
                )}

                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aba Leatherworks Cooperative"
                      value={empData.companyName}
                      onChange={(e) => setEmpData({ ...empData, companyName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        Industry Sector
                      </label>
                      <select
                        value={empData.industry}
                        onChange={(e) => setEmpData({ ...empData, industry: e.target.value })}
                        className="w-full px-3 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight cursor-pointer"
                      >
                        <option>E-commerce & Retail</option>
                        <option>Manufacturing & Industrial</option>
                        <option>Creative Arts & Marketing</option>
                        <option>Logistics & Supply Chain</option>
                        <option>Cloud & Infrastructure</option>
                        <option>Fintech & Software</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        Abia HQ Location
                      </label>
                      <select
                        value={empData.location}
                        onChange={(e) => setEmpData({ ...empData, location: e.target.value })}
                        className="w-full px-3 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
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
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Corporate Website / Channel
                    </label>
                    <input
                      type="url"
                      placeholder="https://mycooperative.com"
                      value={empData.website}
                      onChange={(e) => setEmpData({ ...empData, website: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setStep(0)}
                    className="px-5 py-3 rounded-xl text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (empData.companyName && empData.industry) setStep(2);
                    }}
                    disabled={!empData.companyName || !empData.industry}
                    className="px-6 py-3.5 rounded-xl bg-brand-green text-white font-medium text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    Next: Preferences <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {accountType === 'employer' && step === 2 && (
              <form onSubmit={handleEmpSubmit}>
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-brand-green">
                  Employer Onboarding 2 of 2
                </span>
                <h3 className="text-2xl font-display font-bold text-brand-midnight mt-1">
                  Recruitment Directives
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Verify contact points and desired tech stack configurations.
                </p>

                {error && (
                  <div className="p-3 mt-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chief Coordinator"
                        value={empData.contactPerson}
                        onChange={(e) => setEmpData({ ...empData, contactPerson: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        Inquiry Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="coop@gmail.com"
                        value={empData.email}
                        onChange={(e) => setEmpData({ ...empData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight"
                      />
                    </div>
                  </div>

                  {!googleConnected && (
                    <div>
                      <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                        Create Account Password (Min 6 chars)
                      </label>
                      <div className="relative">
                        <input
                          type={showEmpPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={empData.password}
                          onChange={(e) => setEmpData({ ...empData, password: e.target.value })}
                          className="w-full pl-4 pr-11 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmpPassword(!showEmpPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-midnight focus:outline-none cursor-pointer p-1"
                        >
                          {showEmpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Corporate Phone
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+234 803 000 0000"
                      value={empData.phone}
                      onChange={(e) => setEmpData({ ...empData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Desired Tech Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Figma, React, CAD, SolidWorks"
                      value={empData.desiredSkills}
                      onChange={(e) => setEmpData({ ...empData, desiredSkills: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-2">
                      Target Recruitment Tracks (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-3 bg-brand-warm-white border border-brand-border rounded-xl">
                      {[
                        'CAD/CAM Engineer',
                        'Backend Developer',
                        'Full Stack Engineer',
                        'UI/UX Designer',
                        'Creative Artist / Illustrator',
                        'Cloud & DevOps Architect'
                      ].map((track) => {
                        const isChecked = empData.hiringCategories.includes(track);
                        return (
                          <label key={track} className="flex items-center gap-2 text-xs text-brand-midnight font-medium cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const updated = isChecked
                                  ? empData.hiringCategories.filter(t => t !== track)
                                  : [...empData.hiringCategories, track];
                                setEmpData({ ...empData, hiringCategories: updated });
                              }}
                              className="w-4 h-4 text-brand-green border-brand-border focus:ring-brand-green rounded cursor-pointer"
                            />
                            {track}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Preferred Candidate Qualification
                    </label>
                    <select
                      required
                      value={empData.targetQualifications}
                      onChange={(e) => setEmpData({ ...empData, targetQualifications: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-xs text-brand-midnight cursor-pointer"
                    >
                      <option value="">Select qualification...</option>
                      <option value="Any (Open to all vetted talent)">Any (Open to all vetted talent)</option>
                      <option value="B.Sc. / B.Tech Computer Science or Engineering">B.Sc. / B.Tech Computer Science or Engineering</option>
                      <option value="HND / OND (Polytechnic / Technical Degree)">HND / OND (Polytechnic / Technical Degree)</option>
                      <option value="Certified Bootcamp Graduate">Certified Bootcamp Graduate</option>
                      <option value="Self-Taught with proven portfolios">Self-Taught with proven portfolios</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !empData.targetQualifications || empData.hiringCategories.length === 0 || (!googleConnected && empData.password.length < 6)}
                    className="px-6 py-3.5 rounded-xl bg-brand-midnight text-brand-gold font-medium text-sm hover:bg-black transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Processing Setup...' : 'Submit Setup'} <CheckCircle size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* SUCCESS STATE (FOR BOTH DEVS & EMPLOYERS) */}
            {step === 3 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-brand-green mb-5">
                  <CheckCircle size={36} className="animate-pulse" />
                </div>
                <h3 className="text-2xl font-display font-bold text-brand-midnight">
                  Onboarding Complete!
                </h3>
                <p className="text-sm text-gray-500 mt-3 max-w-sm mx-auto leading-relaxed">
                  Congratulations! Your <strong>SureDev Abia</strong> credentials have been compiled and verified successfully.
                </p>
                
                <div className="mt-8 space-y-3">
                  <button
                    onClick={handleFinishSetup}
                    id="finish-setup-btn"
                    className="w-full py-3.5 rounded-xl bg-brand-green text-white hover:bg-emerald-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                  >
                    {accountType === 'developer' ? 'Enter Developer Dashboard' : 'Hire Developers / Enter Dashboard'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Login Modal
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (
    email: string, 
    accountType: 'developer' | 'employer', 
    isGoogleUser?: boolean,
    displayName?: string,
    avatar?: string
  ) => void;
  onOpenJoin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, onOpenJoin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'developer' | 'employer'>('developer');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        const { name, email: googleEmail, avatar: googleAvatar } = event.data.user;
        
        setIsLoading(true);
        setError(null);
        
        if (auth) {
          try {
            let firebaseUser;
            try {
              const cred = await signInWithEmailAndPassword(auth, googleEmail, "GoogleAuthPass123!");
              firebaseUser = cred.user;
            } catch (fbErr: any) {
              if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
                throw new Error("This email is registered with a custom password. Please use email/password sign-in.");
              }
              try {
                const cred = await createUserWithEmailAndPassword(auth, googleEmail, "GoogleAuthPass123!");
                firebaseUser = cred.user;
              } catch (createErr: any) {
                if (createErr.code === 'auth/email-already-in-use') {
                  throw new Error("This email is already associated with an account. Please sign in using your registered password.");
                }
                throw createErr;
              }
            }

            const userDoc = await dbService.getUserDoc(firebaseUser.uid);
            let matchedRole = accountType;
            if (userDoc && userDoc.accountType) {
              matchedRole = userDoc.accountType as 'developer' | 'employer';
            } else {
              if (accountType === 'developer') {
                await dbService.createDefaultDeveloperProfile(firebaseUser.uid, googleEmail, name);
              } else {
                await dbService.createDefaultEmployerProfile(firebaseUser.uid, googleEmail, name);
              }
            }

            if (matchedRole !== accountType) {
              throw new Error(`This account is registered as a ${matchedRole}. Please select the correct portal.`);
            }

            setEmail(googleEmail);
            setSuccess(true);
            setTimeout(() => {
              setSuccess(false);
              onLoginSuccess(googleEmail, matchedRole, true, name, googleAvatar);
              onClose();
            }, 1200);
          } catch (err: any) {
            console.error("Google login background error:", err);
            setError(err.message || "Failed to authenticate Google user via Firebase.");
          } finally {
            setIsLoading(false);
          }
        } else {
          setEmail(googleEmail);
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            onLoginSuccess(googleEmail, accountType, true, name, googleAvatar);
            onClose();
          }, 1200);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [accountType, onLoginSuccess, onClose]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    if (auth) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        
        const googleEmail = firebaseUser.email || '';
        const name = firebaseUser.displayName || '';
        const googleAvatar = firebaseUser.photoURL || '';

        const userDoc = await dbService.getUserDoc(firebaseUser.uid);
        let matchedRole = accountType;
        if (userDoc && userDoc.accountType) {
          matchedRole = userDoc.accountType as 'developer' | 'employer';
        } else {
          // Auto register since it's real Google Auth
          if (accountType === 'developer') {
            await dbService.createDefaultDeveloperProfile(firebaseUser.uid, googleEmail, name);
          } else {
            await dbService.createDefaultEmployerProfile(firebaseUser.uid, googleEmail, name);
          }
        }

        if (matchedRole !== accountType) {
          throw new Error(`This account is registered as a ${matchedRole}. Please select the correct portal.`);
        }

        setEmail(googleEmail);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onLoginSuccess(googleEmail, matchedRole, true, name, googleAvatar);
          onClose();
        }, 1200);

      } catch (err: any) {
        console.error("Google login error:", err);
        setError(err.message || "Failed to authenticate Google user via Firebase.");
      } finally {
        setIsLoading(false);
      }
    } else {
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        '/google-auth.html',
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes`
      );
      
      if (!authWindow) {
        alert('Please allow popups to sign in with Google.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your registered email address first to reset password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email);
        alert(`A password reset link has been successfully dispatched to ${email}. Check your inbox!`);
      } else {
        setError("Firebase Auth is not initialized. Please verify configuration.");
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email. Please register to get started.");
      } else {
        setError(err.message || "Failed to trigger reset email.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        const userDoc = await dbService.getUserDoc(firebaseUser.uid);
        let matchedRole = accountType;
        
        if (userDoc && userDoc.accountType) {
          matchedRole = userDoc.accountType as 'developer' | 'employer';
        } else {
          const defaultName = firebaseUser.displayName || email.split('@')[0];
          if (accountType === 'developer') {
            await dbService.createDefaultDeveloperProfile(firebaseUser.uid, email, defaultName);
          } else {
            await dbService.createDefaultEmployerProfile(firebaseUser.uid, email, defaultName);
          }
        }

        if (matchedRole !== accountType) {
          throw new Error(`This account is registered as a ${matchedRole}. Please select the correct portal.`);
        }

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onLoginSuccess(email, matchedRole);
          onClose();
        }, 1200);
      } catch (err: any) {
        console.error("Login error:", err);
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError("Incorrect password.");
        } else if (err.code === 'auth/user-not-found') {
          setError("No account found. Please register to get started.");
        } else if (err.code === 'auth/invalid-email') {
          setError("Please enter a valid email address.");
        } else {
          setError(err.message || "Failed to authenticate via Firebase.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Firebase Auth is not initialized. Please verify configuration.");
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-[24px] shadow-premium border border-brand-border overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
          >
            <X size={18} />
          </button>

          <div className="p-8 md:p-10">
            {success ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-brand-green mb-4">
                  <Lock size={24} className="animate-bounce" />
                </div>
                <h3 className="text-xl font-display font-bold text-brand-midnight">
                  Access Granted
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Syncing your {accountType} session portal...
                </p>
              </div>
            ) : (
              <form onSubmit={handleLogin}>
                <h3 className="text-2xl font-display font-bold text-brand-midnight text-center">
                  SureDev Access
                </h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Access your portfolio settings, search directives, and credentials.
                </p>

                {error && (
                  <div className="p-3 mt-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}

                {/* Role Switcher */}
                <div className="flex bg-brand-warm-white p-1 rounded-xl border border-brand-border mt-6">
                  <button
                    type="button"
                    onClick={() => setAccountType('developer')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      accountType === 'developer'
                        ? 'bg-brand-green text-white shadow-sm'
                        : 'text-gray-400 hover:text-brand-midnight'
                    }`}
                  >
                    I'm a Developer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('employer')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      accountType === 'employer'
                        ? 'bg-brand-midnight text-brand-gold shadow-sm'
                        : 'text-gray-400 hover:text-brand-midnight'
                    }`}
                  >
                    I'm a Hirer (Employer)
                  </button>
                </div>

                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={accountType === 'developer' ? 'e.g. chioma@suredev.ng' : 'e.g. coop@abialeather.org'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-midnight uppercase tracking-wider mb-1.5">
                      Passkey Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-4 pr-11 py-3 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-midnight focus:outline-none cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500">
                    <input type="checkbox" className="rounded text-brand-green accent-brand-green" />
                    Remember me
                  </label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword} 
                    className="text-xs font-medium text-brand-green hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-brand-midnight hover:bg-black text-white hover:text-brand-gold font-bold text-xs uppercase tracking-wider mt-8 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In Portal'} <ArrowRight size={16} />
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-brand-border/60"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 font-mono font-bold text-gray-400">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 px-4 rounded-xl border border-brand-border hover:bg-gray-50 text-brand-midnight font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Account Auth
                </button>

                <p className="text-center text-xs text-gray-500 mt-6">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenJoin();
                    }}
                    className="text-brand-green font-semibold hover:underline"
                  >
                    Join directory
                  </button>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
