import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Briefcase, MapPin, Calendar, Github, Linkedin, 
  Twitter, Globe, Mail, ArrowRight, CheckCircle, CheckCircle2, Upload, Lock,
  Award, FileText, Send, Terminal, User, Cpu, History, BookOpen, Star, Sparkles, Check, ChevronRight, Activity,
  Eye, EyeOff, Camera, Image as ImageIcon, Zap, Shield, Code
} from 'lucide-react';
import suredevBrandLogo from '../assets/images/suredev_brand_logo_1784065255454.jpg';
import { Developer, Project, UserSession, Employer } from '../types';
import { 
  auth, 
  db,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut,
  GoogleAuthProvider, 
  signInWithPopup, 
  isFirebaseConfigured,
  sendPasswordResetEmail,
  sendEmailVerification,
  confirmPasswordReset,
  verifyPasswordResetCode,
  collection,
  query,
  where,
  getDocs
} from '../lib/firebase';
import { uploadFileToStorage, uploadProfileImage, dbService } from '../lib/firebaseService';
import { notificationService } from '../services/notificationService';
import { RealtimeGmailResendModal } from './RealtimeGmailResendModal';
import { useAuth } from '../context/AuthContext';

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
                            <div key={`modal-timeline-${item.year}-${index}`} className="relative pl-8 group">
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
                          {developer.skills.map((skill, idx) => {
                            const isEndorsed = endorsedSkills[skill];
                            return (
                              <button
                                key={`${skill}-${idx}`}
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
                    {developer.projects.map((project, idx) => (
                      <div key={project.id ? `${project.id}-${idx}` : idx} className="bg-white rounded-3xl overflow-hidden border border-brand-border shadow-premium group">
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
                                {project.tags.map((tag, idx) => (
                                  <span key={`${tag}-${idx}`} className="px-2.5 py-1 rounded-xl bg-brand-warm-white text-gray-600 font-medium text-xs border border-brand-border/60">
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
                              key={`modal-template-${tpl.label}-${i}`}
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

// Create Project / Hire Developer Modal
interface HireDeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  developer: Developer | null;
  currentUserSession?: UserSession | null;
  employerProfile?: Employer | null;
}

export const HireDeveloperModal: React.FC<HireDeveloperModalProps> = ({
  isOpen,
  onClose,
  developer,
  currentUserSession,
  employerProfile,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('₦500,000 - ₦1,000,000');
  const [deadline, setDeadline] = useState('');
  const [requiredSkills, setRequiredSkills] = useState(developer?.skills?.slice(0, 3).join(', ') || 'React, TypeScript, Node.js');
  const [notes, setNotes] = useState('');

  if (!isOpen || !developer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !deadline.trim()) return;

    setIsSubmitting(true);
    try {
      const employerId = employerProfile?.id || currentUserSession?.employerProfileId || 'emp-guest';
      const employerName = employerProfile?.companyName || employerProfile?.contactPerson || currentUserSession?.email?.split('@')[0] || 'SureDev Employer';
      const employerLogo = employerProfile?.companyLogo || employerProfile?.profileImageUrl || '';

      await dbService.createManagedProject({
        employerId,
        developerId: developer.id,
        employerName,
        developerName: developer.name,
        employerLogo,
        developerAvatar: developer.profileImageUrl || developer.avatar,
        title,
        description,
        budget,
        deadline,
        requiredSkills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        notes,
      });

      setStep(2); // Success Screen
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setBudget('₦500,000 - ₦1,000,000');
    setDeadline('');
    setRequiredSkills('');
    setNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[24px] shadow-premium border border-brand-border overflow-hidden my-8"
        >
          {/* Close */}
          <button
            onClick={resetAndClose}
            className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10 cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="p-8 md:p-10">
            {step === 1 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="text-xs font-display font-semibold uppercase tracking-wider text-brand-green">
                    Create Project Proposal
                  </span>
                  <h3 className="text-2xl font-display font-bold text-brand-midnight mt-1">
                    Hire {developer.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Define project specifications, timeline, and budget to invite {developer.name}.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mobile Banking App Frontend"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1">
                      Project Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Provide detailed project objectives, scope of work, and key deliverables..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1">
                        Budget (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ₦800,000 / Fixed"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1">
                        Deadline *
                      </label>
                      <input
                        type="date"
                        required
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1">
                      Required Skills (comma separated) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. React, TypeScript, Tailwind CSS, Node.js"
                      value={requiredSkills}
                      onChange={(e) => setRequiredSkills(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-midnight uppercase tracking-wider mb-1">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Specify working hours, meeting expectations, or reference repositories..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-brand-warm-white border border-brand-border focus:border-brand-green outline-none text-sm text-brand-midnight transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="px-5 py-2.5 rounded-xl text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !title || !description || !deadline}
                    className="px-6 py-3 rounded-xl bg-brand-green text-white font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating Project...' : 'Send Project Proposal'} <CheckCircle size={16} />
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-brand-green mb-5">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-2xl font-display font-bold text-brand-midnight">
                  Project Proposal Sent!
                </h3>
                <p className="text-sm text-gray-500 mt-3 max-w-sm mx-auto leading-relaxed">
                  Your project <strong>"{title}"</strong> has been logged in Firestore and sent to <strong>{developer.name}</strong>. Real-time notifications have been dispatched.
                </p>
                <div className="mt-8">
                  <button
                    onClick={resetAndClose}
                    className="w-full py-3.5 rounded-xl bg-brand-midnight text-white hover:bg-brand-midnight/90 font-medium text-sm transition-colors cursor-pointer"
                  >
                    Return to Platform
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
  return (
    <LoginModal
      isOpen={isOpen}
      onClose={onClose}
      initialAuthMode="signup"
      onLoginSuccess={(email, accountType, isGoogleUser, displayName, avatar) => {
        onJoinSuccess({ email, name: displayName, avatar, id: `user-${Date.now()}` }, accountType);
      }}
      onOpenJoin={() => {}}
    />
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
  initialAuthMode?: 'signin' | 'signup';
  initialAccountType?: 'developer' | 'employer';
  onOpenJoin?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  initialAuthMode = 'signin',
  initialAccountType = 'developer',
  onOpenJoin 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'developer' | 'employer'>(initialAccountType);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialAuthMode);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<{ uid: string; email: string } | null>(null);
  const [showGmailResendModal, setShowGmailResendModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialAuthMode);
      setAccountType(initialAccountType);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialAuthMode, initialAccountType]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        const { name: googleName, email: googleEmail, avatar: googleAvatar } = event.data.user;
        
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

            const userDoc = await dbService.getUserDoc(firebaseUser.uid, googleEmail);
            let matchedRole: 'developer' | 'employer' | undefined = undefined;
            if (userDoc && (userDoc.role || userDoc.accountType)) {
              matchedRole = (userDoc.role || userDoc.accountType) as 'developer' | 'employer';
            }

            setEmail(googleEmail);
            setSuccess(true);
            setTimeout(() => {
              setSuccess(false);
              onLoginSuccess(googleEmail, matchedRole, true, googleName, googleAvatar);
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
            onLoginSuccess(googleEmail, undefined, true, googleName, googleAvatar);
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
        const googleName = firebaseUser.displayName || '';
        const googleAvatar = firebaseUser.photoURL || '';

        const userDoc = await dbService.getUserDoc(firebaseUser.uid, googleEmail);
        let matchedRole: 'developer' | 'employer' | undefined = undefined;
        
        if (userDoc && (userDoc.role || userDoc.accountType)) {
          matchedRole = (userDoc.role || userDoc.accountType) as 'developer' | 'employer';
        }

        setEmail(googleEmail);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onLoginSuccess(googleEmail, matchedRole, true, googleName, googleAvatar);
          onClose();
        }, 1200);

      } catch (err: any) {
        if (
          err?.code === 'auth/popup-closed-by-user' ||
          err?.code === 'auth/cancelled-popup-request' ||
          err?.message?.includes('popup-closed-by-user')
        ) {
          console.log("Google Sign-In popup closed by user.");
          return;
        }
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
        let sent = false;
        try {
          await sendPasswordResetEmail(auth, email);
          sent = true;
        } catch (fbErr: any) {
          console.warn("Standard Firebase password reset failed, trying notification service fallback...", fbErr);
          const resetUrl = `${window.location.origin}?mode=resetPassword`;
          const res = await notificationService.triggerPasswordResetEmail(email, resetUrl);
          if (res && res.success) {
            sent = true;
          } else {
            throw fbErr;
          }
        }

        if (sent) {
          alert(`A password reset link has been dispatched to ${email}. Please check your inbox and spam folder!`);
        }
      } else {
        setError("Firebase Auth is not initialized. Please verify configuration.");
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email. Please check spelling or register.");
      } else if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
        setError("Network connection timeout reaching auth servers. Please verify your internet connection or ad-blocker and try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many password reset requests sent. Please wait a few minutes before trying again.");
      } else {
        setError(err.message || "Failed to trigger reset email.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    setUnverifiedUser(null);
    
    if (auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const isGoogleUser = firebaseUser.providerData.some(p => p.providerId === 'google.com');

        if (!firebaseUser.emailVerified && !isGoogleUser) {
          await firebaseUser.reload().catch(() => {});
          if (!firebaseUser.emailVerified) {
            setUnverifiedUser({ uid: firebaseUser.uid, email: firebaseUser.email || email });
            setError("UNVERIFIED_EMAIL");
            await firebaseSignOut(auth);
            setIsLoading(false);
            return;
          }
        }
        
        const userDoc = await dbService.getUserDoc(firebaseUser.uid, email);
        if (!userDoc || (!userDoc.role && !userDoc.accountType)) {
          setError("Account authenticated, but no Developer or Employer profile was found for this email address. Please switch to Create Account.");
          setIsLoading(false);
          return;
        }

        const matchedRole = (userDoc.role || userDoc.accountType) as 'developer' | 'employer';

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
          setError("No account found. Please register or switch to Create Account.");
        } else if (err.code === 'auth/invalid-email') {
          setError("Please enter a valid email address.");
        } else if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
          setError("Network connection issue with authentication servers. Please verify your internet connection or ad-blocker and try again.");
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    if (auth) {
      try {
        const existingDoc = await dbService.getUserDoc("", email);
        if (existingDoc && (existingDoc.role || existingDoc.accountType)) {
          const canonicalRole = existingDoc.role || existingDoc.accountType;
          setError(`This email is already registered as an ${canonicalRole === 'employer' ? 'Employer' : 'Developer'} account. Please switch to Sign In.`);
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const nameToUse = name || email.split('@')[0];

        if (accountType === 'developer') {
          await dbService.createDefaultDeveloperProfile(firebaseUser.uid, email, nameToUse);
        } else {
          await dbService.createDefaultEmployerProfile(firebaseUser.uid, email, nameToUse);
        }

        await sendEmailVerification(firebaseUser, {
          url: window.location.origin,
          handleCodeInApp: true,
        }).catch((e) => console.warn("Email verification trigger warning:", e));

        await notificationService.triggerWelcomeEmail(firebaseUser.uid, email, nameToUse, accountType);

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onLoginSuccess(email, accountType, false, nameToUse);
          onClose();
        }, 1200);
      } catch (err: any) {
        console.error("Sign up error:", err);
        if (err.code === 'auth/email-already-in-use') {
          setError("This email is already associated with an account. Please switch to Sign In.");
        } else if (err.code === 'auth/weak-password') {
          setError("Password should be at least 6 characters long.");
        } else {
          setError(err.message || "Failed to create account.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Firebase Auth is not initialized.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] w-full h-full bg-slate-950 text-slate-100 overflow-y-auto flex flex-col lg:flex-row items-stretch">
        


        {/* LEFT BRANDING / VISUAL AREA */}
        <div className="lg:w-5/12 xl:w-5/12 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-6 sm:p-10 lg:p-10 xl:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden shrink-0 min-h-fit lg:min-h-screen">
          
          {/* Subtle Ambient Glow & Geometric Accents */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={suredevBrandLogo}
                alt="SureDev Logo"
                className="w-10 h-10 rounded-xl object-cover shadow-md border border-emerald-500/30"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xl font-display font-extrabold text-white tracking-tight">
                  Sure<span className="text-emerald-400">Dev</span>
                </span>
              </div>
            </div>
          </div>

          {/* Middle Headline & Description */}
          <div className="my-6 lg:my-0 relative z-10 space-y-4 sm:space-y-6 max-w-lg">

            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-display font-extrabold text-white leading-tight">
              Discover. Build. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                Hire verified developers
              </span>
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm lg:text-base leading-relaxed">
              SureDev connects employers with skilled developers and gives teams a secure workspace to manage projects, contracts, and real-time collaboration.
            </p>

            {/* Feature Badges */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-slate-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="truncate">Verified Talent Directory</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-slate-300">
                <Shield size={16} className="text-emerald-400 shrink-0" />
                <span className="truncate">Escrow Contracts</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-slate-300">
                <Lock size={16} className="text-emerald-400 shrink-0" />
                <span className="truncate">Role-Based Access</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-slate-300">
                <Code size={16} className="text-emerald-400 shrink-0" />
                <span className="truncate">Code Workspaces</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 text-xs text-slate-500 font-mono hidden lg:block pt-4">
            &copy; {new Date().getFullYear()} SureDev Platform. All rights reserved.
          </div>
        </div>

        {/* RIGHT AUTHENTICATION FORM AREA */}
        <div className="lg:w-7/12 xl:w-7/12 bg-slate-950 p-6 sm:p-10 lg:p-10 xl:p-12 flex flex-col justify-start items-center relative min-h-full w-full flex-1 overflow-y-auto">
          


          {/* Form Content Container */}
          <div className="w-full max-w-md my-auto py-8 sm:py-12 space-y-6">
            
            {/* Form Title & Subtitle */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                  {authMode === 'signin' ? 'Welcome back' : 'Create your SureDev account'}
                </h2>
              </div>
              <p className="text-sm text-slate-400">
                {authMode === 'signin' 
                  ? 'Sign in with your registered email and passkey to access your workspace.' 
                  : 'Get started in seconds as a verified developer or hiring team.'}
              </p>
            </div>

            {/* Auth Mode Toggle Tabs (Sign In / Create Account) */}
            <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800/90 gap-1">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                  authMode === 'signin'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                  authMode === 'signup'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Account Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Account Role
              </label>
              <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800/90 gap-1">
                <button
                  type="button"
                  onClick={() => setAccountType('developer')}
                  className={`py-2.5 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center truncate ${
                    accountType === 'developer'
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Developer
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('employer')}
                  className={`py-2.5 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center truncate ${
                    accountType === 'employer'
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Employer / Hirer
                </button>
              </div>
            </div>

            {/* Success Feedback Banner */}
            {success ? (
              <div className="p-6 text-center rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 animate-bounce" />
                <h3 className="text-lg font-bold text-white">Access Granted</h3>
                <p className="text-xs text-slate-300">
                  Syncing your {accountType} session portal...
                </p>
              </div>
            ) : (
              <form onSubmit={authMode === 'signin' ? handleLogin : handleSignUp} className="space-y-4">
                
                {/* Error Banners */}
                {error === "UNVERIFIED_EMAIL" ? (
                  <div className="p-4 bg-amber-950/40 border border-amber-800/60 text-amber-200 rounded-xl text-left text-xs space-y-3">
                    <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                      <Mail size={18} className="text-amber-400 shrink-0" />
                      Email Verification Required
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      Your email address <strong>({unverifiedUser?.email || email})</strong> requires verification. You can trigger a resend or verify using Gmail.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowGmailResendModal(true)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Sparkles size={14} />
                      Verify via Gmail
                    </button>
                  </div>
                ) : error ? (
                  <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs rounded-xl font-medium text-center">
                    {error}
                  </div>
                ) : null}

                {/* Name Input (Sign Up Mode) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {accountType === 'developer' ? 'Full Name' : 'Company / Hirer Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={accountType === 'developer' ? 'e.g. Chioma Okeke' : 'e.g. TechCorp Labs'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-sm text-slate-100 placeholder:text-slate-500 transition-all"
                    />
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={accountType === 'developer' ? 'e.g. chioma@suredev.ng' : 'e.g. coop@abialeather.org'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-sm text-slate-100 placeholder:text-slate-500 transition-all"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-11 py-3.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-sm text-slate-100 placeholder:text-slate-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password (Sign In Mode) */}
                {authMode === 'signin' && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                      <input type="checkbox" className="rounded bg-slate-900 border-slate-800 text-emerald-500 accent-emerald-500 focus:ring-0" />
                      Remember me
                    </label>
                    <button 
                      type="button" 
                      onClick={handleForgotPassword} 
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Form Buttons: CANCEL + SUBMIT */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isLoading ? (
                      authMode === 'signin' ? 'Signing in...' : 'Creating account...'
                    ) : (
                      authMode === 'signin' ? 'Sign In' : 'Create Account'
                    )}
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800/80"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-950 px-3 font-mono font-semibold text-slate-500">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-3.5 px-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google Account Auth
                </button>

              </form>
            )}

          </div>

          {/* Cancel button at bottom of mobile view */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 w-full max-w-md text-center block sm:hidden">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
            >
              Cancel & Return
            </button>
          </div>

        </div>

      </div>

      {/* Gmail Verification Resend Modal */}
      <RealtimeGmailResendModal
        isOpen={showGmailResendModal}
        onClose={() => setShowGmailResendModal(false)}
        email={unverifiedUser?.email || email}
        uid={unverifiedUser?.uid}
        accountType={accountType}
        onVerifiedSuccess={(verifiedEmail, role) => {
          onLoginSuccess(verifiedEmail, role, true);
          onClose();
        }}
      />
    </AnimatePresence>
  );
};

// ==========================================
// RESET PASSWORD MODAL (HANDLES oobCode LINK)
// ==========================================
interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  oobCode: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  oobCode,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!oobCode || !isOpen) return;
    setIsLoading(true);
    setError(null);
    if (auth) {
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setUserEmail(email);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Verify reset code error:", err);
          setError("This password reset link is invalid or has expired. Please request a new password reset email.");
          setIsLoading(false);
        });
    } else {
      setError("Firebase Auth is not initialized.");
      setIsLoading(false);
    }
  }, [oobCode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (auth) {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setSuccess(true);
      } else {
        setError("Firebase Auth is not available.");
      }
    } catch (err: any) {
      console.error("Confirm password reset error:", err);
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-midnight/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-brand-border overflow-hidden"
        >
          <div className="p-6 bg-brand-warm-white border-b border-brand-border/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-green/10 text-brand-green">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-brand-midnight">Reset Account Password</h3>
                <p className="text-xs text-gray-500">Enter a new secure password for your account</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-200/60 text-gray-400 hover:text-brand-midnight transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-gray-500 font-mono flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                Verifying reset authorization link...
              </div>
            ) : success ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-brand-green mx-auto flex items-center justify-center">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-midnight">Password Reset Successfully!</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Your new password is now active. You can sign in using your updated credentials.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-brand-midnight hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Done & Close
                </button>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-midnight font-bold text-xs uppercase tracking-wider"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {userEmail && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-brand-midnight text-xs">
                    Resetting password for: <strong className="text-brand-green">{userEmail}</strong>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-brand-midnight uppercase tracking-wider mb-2">
                    New Password (Min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-sm font-sans pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-midnight uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-sm font-sans"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-brand-midnight hover:bg-black text-white hover:text-brand-gold font-bold text-xs uppercase tracking-wider mt-6 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
