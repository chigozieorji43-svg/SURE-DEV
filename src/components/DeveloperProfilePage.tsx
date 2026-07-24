import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, MapPin, Briefcase, Mail, Github, Linkedin, Twitter, Globe,
  Award, History, Sparkles, Check, CheckCircle, Send, Terminal, Cpu, 
  Database, Activity, Layers, Smartphone, Cloud, Palette, SlidersHorizontal,
  Zap, Play, Image, Wifi, RefreshCw, GitPullRequest, Settings, Eye, HelpCircle, FileCode, CheckSquare,
  MessageCircle, Link2, Share2, AlertCircle, Sparkle, GraduationCap
} from 'lucide-react';
import { Developer, UserSession, CollabRequest } from '../types';

interface DeveloperProfilePageProps {
  developer: Developer;
  onBack: () => void;
  onHireClick: (developer: Developer) => void;
  userSession?: UserSession | null;
  collabRequests?: CollabRequest[];
  onSendCollabRequest?: (senderId: string, receiverId: string, message?: string) => void;
  onAcceptCollabRequest?: (requestId: string) => void;
  onDeclineCollabRequest?: (requestId: string) => void;
  onCancelCollabRequest?: (requestId: string) => void;
}

export const DeveloperProfilePage: React.FC<DeveloperProfilePageProps> = ({
  developer,
  onBack,
  onHireClick,
  userSession,
  collabRequests = [],
  onSendCollabRequest,
  onAcceptCollabRequest,
  onDeclineCollabRequest,
  onCancelCollabRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tech' | 'projects' | 'contact'>('overview');
  const [collabMsg, setCollabMsg] = useState('');
  const [showCollabForm, setShowCollabForm] = useState(false);

  const isDevViewer = userSession?.accountType === 'developer';
  const isSelf = isDevViewer && userSession?.developerProfileId === developer.id;
  const collabRequest = collabRequests?.find(
    r => (r.senderId === userSession?.developerProfileId && r.receiverId === developer.id) ||
         (r.senderId === developer.id && r.receiverId === userSession?.developerProfileId)
  );


  
  // Interactive State for Skill Endorsements
  const [endorsements, setEndorsements] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    developer.skills.forEach((skill) => {
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

  // Direct Message Form States
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderEmail || !message) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      setSenderName('');
      setSenderEmail('');
      setMessage('');
    }, 1500);
  };

  // Custom prefilled proposals
  const templates = [
    {
      label: '💼 Project Contract Proposal',
      text: `Hi ${developer.name},\n\nWe love your work as a ${developer.title} on SureDev. We have a 3-month contract role open in Abia for custom digital engineering. Let's schedule a 15-minute sync.`
    },
    {
      label: '⚡ Quick Technical Sync',
      text: `Hello ${developer.name},\n\nI was looking at your featured project: "${developer.projects[0]?.title || 'portfolio work'}". I'm curious about your technical setup and would love to ask you a quick question about it!`
    }
  ];

  // Dynamically determine the track theme of the developer
  const getDeveloperTrack = (): 'cad-cam' | 'backend' | 'full-stack' | 'ui-ux' | 'creative-arts' | 'cloud-devops' | 'mobile-systems' => {
    const title = developer.title.toLowerCase();
    const skills = developer.skills.map(s => s.toLowerCase());
    
    if (title.includes('cad') || title.includes('cam') || title.includes('modeler') || skills.includes('solidworks') || skills.includes('fusion 360')) {
      return 'cad-cam';
    }
    if (title.includes('backend') || skills.includes('go') || skills.includes('rust') || skills.includes('grpc')) {
      return 'backend';
    }
    if (title.includes('ux') || title.includes('design') || skills.includes('figma') || skills.includes('illustration')) {
      return 'ui-ux';
    }
    if (title.includes('art') || title.includes('animation') || title.includes('animator') || skills.includes('blender') || skills.includes('photoshop')) {
      return 'creative-arts';
    }
    if (title.includes('cloud') || title.includes('devops') || skills.includes('terraform') || skills.includes('kubernetes')) {
      return 'cloud-devops';
    }
    if (title.includes('mobile') || skills.includes('flutter') || skills.includes('react native') || skills.includes('kotlin')) {
      return 'mobile-systems';
    }
    return 'full-stack';
  };

  const track = getDeveloperTrack();

  // Consistent Professional Timeline
  const timeline = [
    {
      year: '2024 - Present',
      role: `Senior ${developer.title}`,
      company: 'SureDev Vetted Expert Ecosystem',
      description: `Actively building localized tech solutions, custom systems, and high-performance applications in ${developer.location}, Abia.`
    },
    {
      year: '2022 - 2024',
      role: `Consultant ${developer.skills[0]} Specialist`,
      company: 'Digital Innovation Hub / Sourcing Partner',
      description: `Delivered production-ready client architectures, localized prototypes, and responsive setups for regional startups.`
    },
    {
      year: '2020 - 2022',
      role: 'Associate Software Engineer & Modeler',
      company: 'Abia Tech Labs',
      description: 'Collaborated on user modeling, system performance optimization, prototyping, and local technology integrations.'
    }
  ];

  const getTrackMetadata = () => {
    switch (track) {
      case 'cad-cam':
        return {
          badge: 'High-Precision CAD/CAM Track',
          accentColor: 'text-teal-600',
          accentBg: 'bg-teal-50',
          badgeBg: 'bg-teal-950 text-teal-400 border-teal-800',
          gradientHeader: 'from-zinc-900 via-teal-950 to-zinc-900',
          tagLine: 'Vetted in industrial tolerances, G-code CNC logic, and robust geometric modeling.',
          vettingStats: { score: 98, level: 'Industrial Master', peerVote: 'Vouched for Manufacturing Integration' }
        };
      case 'backend':
        return {
          badge: 'High-Throughput Backend Track',
          accentColor: 'text-emerald-500',
          accentBg: 'bg-emerald-950/20',
          badgeBg: 'bg-emerald-950 text-emerald-400 border-emerald-800',
          gradientHeader: 'from-zinc-950 via-zinc-900 to-emerald-950',
          tagLine: 'Vetted in low-latency APIs, distributed microservices, and database transaction boundaries.',
          vettingStats: { score: 97, level: 'Systems Architect', peerVote: 'Vouched for Scale & Concurrency' }
        };
      case 'ui-ux':
        return {
          badge: 'Pixel-Fidelity Product Design Track',
          accentColor: 'text-rose-500',
          accentBg: 'bg-rose-50',
          badgeBg: 'bg-rose-950 text-rose-300 border-rose-800',
          gradientHeader: 'from-slate-900 via-rose-950 to-slate-900',
          tagLine: 'Vetted in token-driven layout architectures, accessible interface systems, and component systems.',
          vettingStats: { score: 96, level: 'Design Authority', peerVote: 'Vouched for WCAG & Visual Polish' }
        };
      case 'creative-arts':
        return {
          badge: 'Immersive Creative Arts Track',
          accentColor: 'text-indigo-500',
          accentBg: 'bg-indigo-50',
          badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-800',
          gradientHeader: 'from-slate-950 via-indigo-950 to-slate-950',
          tagLine: 'Vetted in 3D character animation, vector heritage storytelling, and high-fidelity rendering.',
          vettingStats: { score: 95, level: 'Digital Visionary', peerVote: 'Vouched for Aesthetic Leadership' }
        };
      case 'cloud-devops':
        return {
          badge: 'High-Availability DevOps Track',
          accentColor: 'text-cyan-500',
          accentBg: 'bg-cyan-50',
          badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-800',
          gradientHeader: 'from-zinc-900 via-cyan-950 to-zinc-900',
          tagLine: 'Vetted in declarative cloud networks, multi-stage pipelines, and cluster self-healing logs.',
          vettingStats: { score: 98, level: 'Kubernetes Guru', peerVote: 'Vouched for Zero-Downtime Pipelines' }
        };
      case 'mobile-systems':
        return {
          badge: 'Offline-First Mobile Track',
          accentColor: 'text-amber-500',
          accentBg: 'bg-amber-50',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-800',
          gradientHeader: 'from-stone-900 via-amber-950 to-stone-900',
          tagLine: 'Vetted in sub-optimal network caching, SQLite local storage, and high-performance clients.',
          vettingStats: { score: 97, level: 'Core Mobile Specialist', peerVote: 'Vouched for Network-Resiliency' }
        };
      default:
        return {
          badge: 'Full Stack Engineering Track',
          accentColor: 'text-blue-600',
          accentBg: 'bg-blue-50',
          badgeBg: 'bg-blue-950 text-blue-300 border-blue-800',
          gradientHeader: 'from-zinc-900 via-indigo-950 to-zinc-900',
          tagLine: 'Vetted in full-stack feature delivery, end-to-end integration, and rapid system prototyping.',
          vettingStats: { score: 97, level: 'Universal Developer', peerVote: 'Vouched for Enterprise Delivery' }
        };
    }
  };

  const meta = getTrackMetadata();

  // -------------------------------------------------------------
  // SIMULATOR COMPONENT RENDERERS (THE CORE DETAILED MATCHING WORK)
  // -------------------------------------------------------------

  // 1. CAD/CAM Shoe Mold Configurer Simulator State
  const [cadShoeSize, setCadShoeSize] = useState<number>(42);
  const [cadToeTaper, setCadToeTaper] = useState<number>(15);
  const [cadWidth, setCadWidth] = useState<number>(94);
  const [cadHeelHeight, setCadHeelHeight] = useState<number>(28);

  const calculateCadMetrics = () => {
    const volume = Math.round((cadShoeSize * 1.5) * (cadWidth * 0.8) * (cadHeelHeight * 1.1));
    const printedWeight = Math.round(volume * 0.0012); // PLA density proxy
    const printTimeHours = Math.round(volume * 0.00015 + (cadToeTaper * 0.1));
    return { volume, printedWeight, printTimeHours };
  };
  const cadMetrics = calculateCadMetrics();

  // 2. Backend Live Core Console Log Terminal State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '# Initializing SureDev Backend Diagnostics...',
    `# Handshaking with node@aba-central-${developer.id}`,
    'SYSTEM: Connected to PostgreSQL DB cluster [Region: Abia-South]',
    'METRIC: Redis edge connection cache ping: 4.12ms'
  ]);
  const [activeLatencyTest, setActiveLatencyTest] = useState(false);
  const [simulatedPings, setSimulatedPings] = useState({ Aba: 4, Lagos: 18, London: 86 });

  const runTerminalCommand = (command: string) => {
    if (command === 'health-check') {
      setTerminalLogs(prev => [
        ...prev,
        `$ abia-vitals check-health --node=${developer.id}`,
        `  -> [OK] Thread pool count: 64 active`,
        `  -> [OK] Memory allocation: 114MB / 1024MB`,
        `  -> [OK] Network socket state: STABLE (0% loss)`
      ]);
    } else if (command === 'optimize-db') {
      setTerminalLogs(prev => [
        ...prev,
        '$ pg-engine vacuum-analyze --verbose',
        '  -> Scanning active AbaPay schemas...',
        '  -> Optimized indices on tables: merchants, transactions, payouts',
        '  -> [SUCCESS] Database lock contention reduced by 22%'
      ]);
    } else if (command === 'stress-test') {
      setTerminalLogs(prev => [
        ...prev,
        '$ abia-load-injector --target=api/v1/pay --concurrent=5000',
        '  -> Injecting 5000 peak virtual merchants from Ariaria Market...',
        '  -> Handled 14,840 requests in 3.1 seconds',
        '  -> [RESULT] p99 Latency: 11.2ms | Error rate: 0.00%'
      ]);
    }
  };

  const triggerLatencyTest = () => {
    setActiveLatencyTest(true);
    setTimeout(() => {
      setSimulatedPings({
        Aba: Math.floor(Math.random() * 5) + 2,
        Lagos: Math.floor(Math.random() * 10) + 12,
        London: Math.floor(Math.random() * 15) + 78
      });
      setActiveLatencyTest(false);
      setTerminalLogs(prev => [
        ...prev,
        'SYSTEM: Updated localized latency routing indexes.',
        `  -> Aba: ${simulatedPings.Aba}ms | Lagos: ${simulatedPings.Lagos}ms | London: ${simulatedPings.London}ms`
      ]);
    }, 1200);
  };

  // 3. Full-Stack Distributed Network Flow Simulator State
  const [edgeCacheEnabled, setEdgeCacheEnabled] = useState(true);
  const [dbShardingEnabled, setDbShardingEnabled] = useState(false);
  const [loadBalancerState, setLoadBalancerState] = useState<'nominal' | 'peak' | 'failover'>('nominal');

  const calculateFullStackMetrics = () => {
    let latency = 120;
    let throughput = 800;
    
    if (edgeCacheEnabled) {
      latency -= 85;
      throughput += 1200;
    }
    if (dbShardingEnabled) {
      latency -= 15;
      throughput += 2500;
    }
    if (loadBalancerState === 'peak') {
      latency += 45;
      throughput = Math.min(throughput, 3000);
    } else if (loadBalancerState === 'failover') {
      latency += 90;
      throughput = Math.floor(throughput * 0.6);
    }
    
    return { latency, throughput };
  };
  const fsMetrics = calculateFullStackMetrics();

  // 4. UI/UX Design Token Playground State
  const [uiTheme, setUiTheme] = useState<'sunset' | 'charcoal' | 'forest'>('sunset');
  const [uiRadius, setUiRadius] = useState<'none' | 'md' | 'full'>('md');
  const [uiSpacing, setUiSpacing] = useState<'dense' | 'comfortable'>('comfortable');

  // 5. Creative Arts Character Gallery State
  const [selectedAsset, setSelectedAsset] = useState<number>(0);
  const creativeAssets = [
    {
      title: 'Aba Cultural Masquerade Model',
      polygons: '142,400 Triangles',
      timeSpent: '38 hours sculpt & retopology',
      colors: ['#2e1065', '#d97706', '#059669', '#f3f4f6'],
      concept: 'High-fidelity cinematic model representation of Abia cultural heritage artifacts for educational tourism campaigns.'
    },
    {
      title: 'SureDev Brand Iconography Set',
      polygons: '2D Hand-rendered Vector Math',
      timeSpent: '16 hours vector drafting',
      colors: ['#0f172a', '#10b981', '#f59e0b', '#3b82f6'],
      concept: 'Consistent high-contrast glyphs and brand characters representing localized technical crafts in Abia state.'
    }
  ];

  // 6. Cloud & DevOps Pipeline State
  const [pipelineState, setPipelineState] = useState<'idle' | 'linting' | 'testing' | 'building' | 'deploying' | 'completed'>('idle');
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);

  const startDevOpsPipeline = () => {
    if (pipelineState !== 'idle') return;
    setPipelineState('linting');
    setPipelineLogs(['[PIPELINE] Initializing build agent...', '[LINT] Running eslint rules check...']);
    
    setTimeout(() => {
      setPipelineState('testing');
      setPipelineLogs(prev => [...prev, '[LINT] All style checks passed!', '[TEST] Booting vitest test suites...', '[TEST] 148 specs executing...']);
    }, 1500);

    setTimeout(() => {
      setPipelineState('building');
      setPipelineLogs(prev => [...prev, '[TEST] Vetted specs green (100% coverage)', '[DOCKER] Packing container layers...', '[DOCKER] Bundling production payload...']);
    }, 3200);

    setTimeout(() => {
      setPipelineState('deploying');
      setPipelineLogs(prev => [...prev, '[DOCKER] Pushed to gcr.io/suredev-abia/core', '[DEPLOY] Rolling update deployed to edge cells (Aba, Umuahia)...']);
    }, 4800);

    setTimeout(() => {
      setPipelineState('completed');
      setPipelineLogs(prev => [...prev, '[DEPLOY] Health diagnostics passed successfully!', '[SYSTEM] Live URL active: production-vetted-edge.suredev.ng', '🎉 Pipeline BUILD COMPLETED.']);
    }, 6500);
  };

  // 7. Mobile System Emulator State
  const [mobileHarvestCount, setMobileHarvestCount] = useState<number>(14);
  const [mobileOfflineMode, setMobileOfflineMode] = useState<boolean>(false);
  const [mobileOfflineSyncQueue, setMobileOfflineSyncQueue] = useState<number>(0);

  const addHarvestBagMobile = () => {
    if (mobileOfflineMode) {
      setMobileOfflineSyncQueue(prev => prev + 1);
    } else {
      setMobileHarvestCount(prev => prev + 1);
    }
  };

  const toggleMobileOffline = () => {
    setMobileOfflineMode(!mobileOfflineMode);
    if (mobileOfflineMode && mobileOfflineSyncQueue > 0) {
      // sync simulated
      setMobileHarvestCount(prev => prev + mobileOfflineSyncQueue);
      setMobileOfflineSyncQueue(0);
    }
  };

  return (
    <div className="relative min-h-screen bg-brand-warm-white/40 pb-24 pt-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Navigation Action Area */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm font-bold text-brand-midnight hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Directory
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
            <span className="text-xs font-mono font-bold text-gray-500 uppercase">
              ACTIVE VETTED MEMBER
            </span>
          </div>
        </div>

        {/* PROFILE HEADER GRID */}
        <div className="bg-white rounded-[32px] overflow-hidden border border-brand-border shadow-premium mb-10">
          
          {/* Cover Banner Area based on Track Theme */}
          <div className={`h-48 bg-gradient-to-r ${meta.gradientHeader} relative p-8 flex items-end justify-between`}>
            {/* Blueprint Grid Lines Overlay for CAD/CAM */}
            {track === 'cad-cam' && (
              <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
            )}
            {/* Code Brackets Overlay for Backend */}
            {track === 'backend' && (
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 font-mono text-[9px] text-emerald-500/20 p-4 select-none overflow-hidden leading-none">
                {`for (let i = 0; i < 5000; i++) { checkCluster(AbaCentral); optimizePayoutRails(); }`}
              </div>
            )}
            {/* Layout Grid Overlay for UI/UX */}
            {track === 'ui-ux' && (
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#fda4af_1px,transparent_1px),linear-gradient(to_bottom,#fda4af_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
            )}
            
            <span className={`absolute top-6 right-6 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ${meta.badgeBg} text-xs font-bold uppercase tracking-wider border shadow-sm`}>
              <Sparkles size={12} className="animate-pulse" />
              {meta.badge}
            </span>
          </div>

          {/* Profile Core Branding Strip */}
          <div className="px-8 md:px-12 pb-8 pt-6 relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                <img
                  src={developer.profileImageUrl || developer.avatar}
                  alt={developer.name}
                  referrerPolicy="no-referrer"
                  className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-premium bg-brand-warm-white -mt-14 md:-mt-20 relative z-20"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-midnight tracking-tight">
                      {developer.name}
                    </h1>
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-brand-midnight text-brand-gold font-mono text-[10px] uppercase font-extrabold tracking-wider border border-brand-gold/10">
                      Vetted Top {developer.featured ? '1%' : '5%'}
                    </span>
                  </div>
                  <p className="text-lg text-brand-green font-medium mt-1">
                    {developer.title}
                  </p>
                  
                  <div className="flex flex-wrap gap-5 mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-brand-green" />
                      {developer.location}, Abia State
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={14} className="text-brand-green" />
                      {developer.experience} Years Certified
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} className="text-brand-green animate-pulse" />
                      {developer.email}
                    </span>
                    {developer.qualification && (
                      <span className="flex items-center gap-1.5 normal-case">
                        <GraduationCap size={14} className="text-brand-green" />
                        {developer.qualification}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
                {/* Book Contract button for employers or guests */}
                {(!isDevViewer || isSelf) && (
                  <button
                    onClick={() => onHireClick(developer)}
                    className="flex-1 md:flex-initial px-8 py-4 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all hover:translate-y-[-1px] cursor-pointer text-center whitespace-nowrap"
                  >
                    Book Secure Contract
                  </button>
                )}

                {/* Collaboration System for Developers */}
                {isDevViewer && (
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    {isSelf ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-green/10 text-brand-green border border-brand-green/20 text-xs font-bold uppercase tracking-wider">
                        <Sparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
                        My Public Workspace Profile
                      </span>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        {/* ACCEPTED state: Connected! */}
                        {collabRequest?.status === 'accepted' ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <span className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                              <CheckCircle size={14} />
                              Connected Partner
                            </span>
                            
                            {/* WhatsApp link with phone fallback */}
                            <a
                              href={developer.phone ? `https://wa.me/${developer.phone.replace(/[^0-9]/g, '')}` : `https://wa.me/2348012345678?text=Hello%20${encodeURIComponent(developer.name)}!%20Let's%20collaborate.`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-5 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs shadow-sm transition-all hover:translate-y-[-1px] flex items-center justify-center gap-1.5 text-center cursor-pointer"
                            >
                              <MessageCircle size={14} />
                              Connect WhatsApp
                            </a>

                            {/* GitHub link */}
                            <a
                              href={developer.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-5 py-3.5 rounded-xl bg-brand-midnight hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-all hover:translate-y-[-1px] flex items-center justify-center gap-1.5 text-center cursor-pointer"
                            >
                              <Github size={14} />
                              Open GitHub
                            </a>
                          </div>
                        ) : collabRequest?.status === 'pending' ? (
                          collabRequest.senderId === userSession?.developerProfileId ? (
                            /* PENDING state: Sent by logged-in developer */
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <span className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20 text-xs font-bold uppercase tracking-wider">
                                <AlertCircle size={14} className="animate-pulse" />
                                Connection Request Sent
                              </span>
                              <button
                                onClick={() => onCancelCollabRequest?.(collabRequest.id)}
                                className="px-4 py-3.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs transition-colors cursor-pointer text-center"
                              >
                                Cancel Request
                              </button>
                            </div>
                          ) : (
                            /* PENDING state: Received by logged-in developer */
                            <div className="bg-brand-warm-white p-4 rounded-2xl border border-brand-border shadow-sm flex flex-col gap-3 min-w-[280px]">
                              <p className="text-[10px] font-mono font-bold text-brand-green uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={10} /> Incoming Collaboration Request
                              </p>
                              {collabRequest.message && (
                                <p className="text-xs text-gray-500 italic bg-white p-2 rounded-lg border border-brand-border/60">
                                  "{collabRequest.message}"
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => onAcceptCollabRequest?.(collabRequest.id)}
                                  className="py-2.5 rounded-lg bg-brand-green hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer text-center"
                                >
                                  Accept Partner
                                </button>
                                <button
                                  onClick={() => onDeclineCollabRequest?.(collabRequest.id)}
                                  className="py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold text-xs transition-colors cursor-pointer text-center"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          )
                        ) : (
                          /* NO REQUEST OR DECLINED: Allow connecting! */
                          <div className="flex flex-col gap-3 items-end">
                            {!showCollabForm ? (
                              <button
                                onClick={() => setShowCollabForm(true)}
                                className="px-6 py-4 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all hover:translate-y-[-1px] cursor-pointer text-center flex items-center gap-2"
                              >
                                <Sparkles size={16} />
                                Request Collaboration
                              </button>
                            ) : (
                              <div className="bg-brand-warm-white p-4 rounded-2xl border border-brand-border shadow-sm w-full sm:w-80 flex flex-col gap-3 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-mono font-extrabold text-brand-green uppercase">Write Invitation Note</span>
                                  <button onClick={() => setShowCollabForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold uppercase">Cancel</button>
                                </div>
                                <div className="relative">
                                  <textarea
                                    value={collabMsg}
                                    onChange={(e) => setCollabMsg(e.target.value)}
                                    placeholder="E.g. Hey! Let's collaborate on a local CNC or web manufacturing platform..."
                                    rows={2.5}
                                    className={`w-full p-2.5 pb-6 bg-white border rounded-xl text-xs outline-none focus:ring-1 text-brand-midnight resize-none ${
                                      collabMsg.trim() !== '' && collabMsg.trim().split(/\s+/).length > 30
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                                        : 'border-brand-border focus:border-brand-green focus:ring-brand-green'
                                    }`}
                                  />
                                  <div className="absolute bottom-2 right-3 text-[9px] font-mono font-bold text-gray-400">
                                    <span className={collabMsg.trim() !== '' && collabMsg.trim().split(/\s+/).length > 30 ? 'text-red-500 font-extrabold animate-pulse' : 'text-gray-400'}>
                                      {collabMsg.trim() === '' ? 0 : collabMsg.trim().split(/\s+/).length}
                                    </span>
                                    /30 words
                                  </div>
                                </div>
                                <button
                                  disabled={collabMsg.trim() === '' || collabMsg.trim().split(/\s+/).length > 30}
                                  onClick={() => {
                                    if (userSession?.developerProfileId) {
                                      onSendCollabRequest?.(userSession.developerProfileId, developer.id, collabMsg);
                                      setCollabMsg('');
                                      setShowCollabForm(false);
                                    }
                                  }}
                                  className="w-full py-2 bg-brand-midnight hover:bg-zinc-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                >
                                  Submit Request
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Tab Switcher */}
            <div className="flex gap-1 border-t border-brand-border/60 mt-8 pt-2 overflow-x-auto scrollbar-hide">
              {(['overview', 'tech', 'projects', 'contact'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-brand-green text-brand-midnight font-extrabold'
                      : 'border-transparent text-gray-400 hover:text-brand-midnight hover:border-brand-border'
                  }`}
                >
                  {tab === 'tech' ? '🛠️ Interactive Vetting Console' : tab === 'projects' ? '📂 Case Studies & Portfolio' : tab === 'contact' ? '✉️ Proposal & Inbound' : '👤 Profile Overview'}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* PROFILE BODY DETAILS AREA */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* TAB 1: GENERAL OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side Content (Bio & Experience Grid) */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* Bio statement */}
                  <div className="bg-white p-8 rounded-3xl border border-brand-border shadow-sm">
                    <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-brand-green rounded-full" />
                      Executive Summary & Strategy
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {developer.bio}
                    </p>
                    <p className="text-gray-400 text-xs mt-6 italic">
                      * All profiles displayed on SureDev have completed independent visual identity checking, structural technical interviews, and algorithmic performance indices.
                    </p>
                  </div>

                  {/* Experience Timeline */}
                  <div className="bg-white p-8 rounded-3xl border border-brand-border shadow-sm">
                    <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-6 flex items-center gap-2">
                      <History size={16} className="text-brand-green" />
                      Experience Timeline
                    </h3>
                    
                    <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-brand-border/60">
                      {timeline.map((item, index) => (
                        <div key={index} className="relative pl-9 group">
                          <span className="absolute left-[5px] top-1.5 w-3 h-3 rounded-full bg-brand-green border-2 border-white ring-4 ring-brand-green/10 transition-transform group-hover:scale-125" />
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/5 px-2.5 py-0.5 rounded-md">
                              {item.year}
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                              Verified Role
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-brand-midnight mt-2">
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

                {/* Right Side Sidebar (Endorsements & Anchors) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Skill Endorsements */}
                  <div className="bg-white p-6 rounded-3xl border border-brand-border shadow-sm">
                    <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-3 flex items-center gap-2">
                      <Award size={16} className="text-brand-green" />
                      Skills & Peer Endorsements
                    </h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      Click any skill tag below to instantly submit an endorsement vote for {developer.name}.
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {developer.skills.map((skill) => {
                        const isEndorsed = endorsedSkills[skill];
                        return (
                          <button
                            key={skill}
                            onClick={() => handleEndorse(skill)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              isEndorsed
                                ? 'bg-brand-green/10 border-brand-green text-brand-green shadow-sm'
                                : 'bg-brand-warm-white border-brand-border hover:border-gray-400 text-gray-600'
                            }`}
                          >
                            <span>{skill}</span>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-mono ${
                              isEndorsed ? 'bg-brand-green text-white font-bold' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {endorsements[skill]}
                            </span>
                            {isEndorsed && <Check size={10} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Secure Directory Anchors */}
                  <div className="bg-white p-6 rounded-3xl border border-brand-border shadow-sm">
                    <h3 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-4">
                      Vetted Profile Anchors
                    </h3>
                    <div className="space-y-2.5">
                      <a
                        href={developer.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl bg-brand-warm-white border border-brand-border hover:border-gray-400 transition-all text-xs font-bold text-gray-600"
                      >
                        <span className="flex items-center gap-2.5">
                          <Github size={15} className="text-gray-400" />
                          GitHub Profile
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">Public Repos</span>
                      </a>
                      
                      <a
                        href={developer.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl bg-brand-warm-white border border-brand-border hover:border-gray-400 transition-all text-xs font-bold text-gray-600"
                      >
                        <span className="flex items-center gap-2.5">
                          <Linkedin size={15} className="text-gray-400" />
                          LinkedIn Identity
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">Vetted</span>
                      </a>

                      <a
                        href={developer.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl bg-brand-warm-white border border-brand-border hover:border-gray-400 transition-all text-xs font-bold text-gray-600"
                      >
                        <span className="flex items-center gap-2.5">
                          <Globe size={15} className="text-gray-400" />
                          Personal Sandbox
                        </span>
                        <span className="text-[10px] font-mono text-brand-green font-bold">LIVE</span>
                      </a>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: INTERACTIVE TECHNICAL VETTING CONSOLE */}
            {activeTab === 'tech' && (
              <div className="space-y-8">
                
                {/* Core Track Description Banner */}
                <div className="bg-brand-midnight text-white p-8 rounded-3xl border border-brand-midnight relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl" />
                  <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div>
                      <span className="text-xs font-mono font-bold text-brand-gold uppercase tracking-widest bg-brand-gold/10 px-3 py-1 rounded-md border border-brand-gold/20">
                        {meta.badge}
                      </span>
                      <h3 className="text-2xl font-display font-bold mt-3">
                        Vetted Skill Assessment & Diagnostics
                      </h3>
                      <p className="text-xs text-gray-400 mt-2 max-w-2xl leading-relaxed">
                        {meta.tagLine} SureDev tracks verified testing pipelines, localized project execution, and structural systems knowledge for Abia talent.
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Assessment Score</p>
                      <p className="text-3xl font-mono font-bold text-brand-gold mt-1">{meta.vettingStats.score}%</p>
                      <p className="text-[10px] font-bold text-brand-green mt-1">{meta.vettingStats.level}</p>
                    </div>
                  </div>
                </div>

                {/* TRACK SPECIFIC DETAILED SIMULATORS */}

                {/* SPECIFIC SIMULATOR 1: CAD/CAM */}
                {track === 'cad-cam' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Simulator Settings */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-6">
                      <div className="flex items-center gap-2 border-b border-brand-border pb-3">
                        <SlidersHorizontal size={18} className="text-teal-600" />
                        <h4 className="font-display font-bold text-sm text-brand-midnight uppercase">
                          3D Shoe Mold Configurer
                        </h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-midnight mb-1.5">
                            <span>Base Shoe Size (EU)</span>
                            <span className="text-teal-600 font-mono font-bold">{cadShoeSize}</span>
                          </div>
                          <input
                            type="range"
                            min="35"
                            max="47"
                            value={cadShoeSize}
                            onChange={(e) => setCadShoeSize(Number(e.target.value))}
                            className="w-full accent-teal-600 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-midnight mb-1.5">
                            <span>Toe Taper Angle (deg)</span>
                            <span className="text-teal-600 font-mono font-bold">{cadToeTaper}°</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="30"
                            value={cadToeTaper}
                            onChange={(e) => setCadToeTaper(Number(e.target.value))}
                            className="w-full accent-teal-600 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-midnight mb-1.5">
                            <span>Mid-foot Width Ratio</span>
                            <span className="text-teal-600 font-mono font-bold">{cadWidth}%</span>
                          </div>
                          <input
                            type="range"
                            min="80"
                            max="110"
                            value={cadWidth}
                            onChange={(e) => setCadWidth(Number(e.target.value))}
                            className="w-full accent-teal-600 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-midnight mb-1.5">
                            <span>Heel Draft Lift (mm)</span>
                            <span className="text-teal-600 font-mono font-bold">{cadHeelHeight}mm</span>
                          </div>
                          <input
                            type="range"
                            min="15"
                            max="45"
                            value={cadHeelHeight}
                            onChange={(e) => setCadHeelHeight(Number(e.target.value))}
                            className="w-full accent-teal-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="bg-teal-50 border border-teal-200/60 p-4 rounded-xl space-y-2 text-xs text-teal-800">
                        <p className="font-bold">CAD Tolerances Check:</p>
                        <p className="leading-relaxed text-teal-700">
                          Automatic fit parameters adjusted. This mold configuration compiles direct G-code for Aba localized injection-molding presses with ±0.02mm deviation indexes.
                        </p>
                      </div>
                    </div>

                    {/* Rendering Sandbox visual */}
                    <div className="lg:col-span-7 bg-brand-midnight text-gray-300 p-6 rounded-3xl border border-brand-midnight relative flex flex-col justify-between overflow-hidden">
                      {/* Technical blueprint grids background */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,184,166,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,184,166,0.05)_1px,transparent_1px)] [background-size:16px_16px]" />
                      
                      <div className="relative z-10 flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                        <span className="font-mono text-xs text-teal-400 flex items-center gap-1.5">
                          <Cpu size={14} /> LIVE WIREFRAME ESTIMATION
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 uppercase">
                          3D Canvas Sandbox
                        </span>
                      </div>

                      {/* Mock 3D Blueprint Mesh rendering visual */}
                      <div className="relative z-10 h-44 border border-teal-500/10 rounded-xl bg-black/40 flex items-center justify-center">
                        <svg className="w-64 h-32 text-teal-500/35" viewBox="0 0 200 100" fill="none">
                          {/* Sole line */}
                          <path d="M10,80 Q40,82 80,72 T160,78 Q180,82 190,75" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
                          {/* Upper shape */}
                          <path d="M10,80 Q30,40 70,35 T140,50 T190,75" stroke="currentColor" strokeWidth="2" />
                          {/* Dynamic slider parameters drawn */}
                          <line x1="70" y1="35" x2="70" y2="75" stroke="currentColor" strokeWidth="1" />
                          <circle cx="70" cy="35" r="3" fill="currentColor" />
                          {/* Heel Lift Indicator */}
                          <path d="M10,80 L10,65 L30,65" stroke="#f59e0b" strokeWidth="1.5" />
                          <text x="15" y="60" fill="#f59e0b" fontSize="8" fontFamily="monospace">HEEL: {cadHeelHeight}mm</text>
                          {/* Width indicator line */}
                          <path d="M100,50 L100,75" stroke="#10b981" strokeWidth="1.5" />
                          <text x="105" y="63" fill="#10b981" fontSize="8" fontFamily="monospace">W: {cadWidth}%</text>
                        </svg>
                      </div>

                      {/* G-code metadata results calculated real-time */}
                      <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-4 mt-4 font-mono text-xs">
                        <div>
                          <p className="text-gray-500">Volume</p>
                          <p className="text-sm font-bold text-white mt-1">{cadMetrics.volume} mm³</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Material PLA</p>
                          <p className="text-sm font-bold text-white mt-1">{cadMetrics.printedWeight}g</p>
                        </div>
                        <div>
                          <p className="text-gray-500">CNC Extrude</p>
                          <p className="text-sm font-bold text-teal-400 mt-1">{cadMetrics.printTimeHours} hrs</p>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* SPECIFIC SIMULATOR 2: BACKEND */}
                {track === 'backend' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Console controller Panel */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-6">
                      <div className="flex items-center gap-2 border-b border-brand-border pb-3">
                        <Terminal size={18} className="text-emerald-600" />
                        <h4 className="font-display font-bold text-sm text-brand-midnight uppercase">
                          Aba API Node Operator
                        </h4>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Trigger diagnostic routines verifying {developer.name}'s real-time payment caching pipelines, database lock thresholds, and high-load capacities.
                      </p>

                      <div className="space-y-2">
                        <button
                          onClick={() => runTerminalCommand('health-check')}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-border bg-brand-warm-white hover:bg-white text-xs font-bold text-gray-700 transition-all cursor-pointer shadow-sm hover:border-emerald-500"
                        >
                          <span>🔍 Run Microservices Health Diagnostic</span>
                          <span className="text-[10px] font-mono text-brand-green">abia-vitals</span>
                        </button>
                        <button
                          onClick={() => runTerminalCommand('optimize-db')}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-border bg-brand-warm-white hover:bg-white text-xs font-bold text-gray-700 transition-all cursor-pointer shadow-sm hover:border-emerald-500"
                        >
                          <span>🗄️ Optimize PostgreSQL Schema Indices</span>
                          <span className="text-[10px] font-mono text-brand-green">vacuum-analyze</span>
                        </button>
                        <button
                          onClick={() => runTerminalCommand('stress-test')}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-border bg-brand-warm-white hover:bg-white text-xs font-bold text-gray-700 transition-all cursor-pointer shadow-sm hover:border-emerald-500"
                        >
                          <span>⚡ Trigger 5,000 req/sec Stress Test</span>
                          <span className="text-[10px] font-mono text-brand-green">load-injector</span>
                        </button>
                      </div>

                      <div className="border-t border-brand-border pt-4">
                        <button
                          onClick={triggerLatencyTest}
                          disabled={activeLatencyTest}
                          className="w-full py-3 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          {activeLatencyTest ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>Re-routing low-latency nodes...</span>
                            </>
                          ) : (
                            <>
                              <Activity size={14} />
                              <span>Recalculate Gateway Latency Index</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Styled Console Monitor Output */}
                    <div className="lg:col-span-7 bg-zinc-950 text-gray-300 p-6 rounded-3xl font-mono text-xs shadow-lg space-y-4 relative flex flex-col justify-between overflow-hidden">
                      <div className="absolute top-2 right-3 flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>
                      
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-[10px] text-gray-500">
                        <Activity size={12} className="text-emerald-400" />
                        <span>SHELL CONSOLE: v1.0.4-abia-node-operator</span>
                      </div>

                      {/* Log Screen */}
                      <div className="h-44 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 pr-2">
                        {terminalLogs.map((log, index) => (
                          <div key={index} className={log.startsWith('$') ? 'text-brand-gold' : log.includes('[OK]') || log.includes('[SUCCESS]') ? 'text-emerald-400' : 'text-gray-400'}>
                            {log}
                          </div>
                        ))}
                      </div>

                      {/* Live ping monitoring */}
                      <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 text-[11px] text-gray-500">
                        <div>
                          <span>Aba Ping</span>
                          <p className="text-sm font-bold text-emerald-400 mt-1">{simulatedPings.Aba} ms</p>
                        </div>
                        <div>
                          <span>Lagos Ping</span>
                          <p className="text-sm font-bold text-white mt-1">{simulatedPings.Lagos} ms</p>
                        </div>
                        <div>
                          <span>London CDN</span>
                          <p className="text-sm font-bold text-white mt-1">{simulatedPings.London} ms</p>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* SPECIFIC SIMULATOR 3: FULL STACK */}
                {track === 'full-stack' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Settings Controllers */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-6">
                      <div className="flex items-center gap-2 border-b border-brand-border pb-3">
                        <SlidersHorizontal size={18} className="text-indigo-600" />
                        <h4 className="font-display font-bold text-sm text-brand-midnight uppercase">
                          Full-Stack Network Config
                        </h4>
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border cursor-pointer hover:bg-brand-warm-white">
                          <div>
                            <p className="text-xs font-bold text-brand-midnight">Enable CloudFront Edge Cache</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Caches static client payload closer to regional cells</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={edgeCacheEnabled}
                            onChange={(e) => setEdgeCacheEnabled(e.target.checked)}
                            className="w-4.5 h-4.5 text-brand-green accent-brand-green cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border cursor-pointer hover:bg-brand-warm-white">
                          <div>
                            <p className="text-xs font-bold text-brand-midnight">Enable Database Read Sharding</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Distributes load between read and write replicas</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={dbShardingEnabled}
                            onChange={(e) => setDbShardingEnabled(e.target.checked)}
                            className="w-4.5 h-4.5 text-brand-green accent-brand-green cursor-pointer"
                          />
                        </label>

                        <div>
                          <span className="block text-xs font-bold text-brand-midnight mb-2">Load Balancer Load State</span>
                          <div className="grid grid-cols-3 gap-2">
                            {['nominal', 'peak', 'failover'].map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setLoadBalancerState(mode as any)}
                                className={`py-2 rounded-xl text-center font-semibold text-[10px] border transition-all cursor-pointer uppercase ${
                                  loadBalancerState === mode
                                    ? 'bg-brand-midnight text-white border-brand-midnight'
                                    : 'bg-brand-warm-white text-gray-500 border-brand-border'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Architecture diagram sandbox visual */}
                    <div className="lg:col-span-7 bg-brand-midnight text-gray-300 p-6 rounded-3xl border border-brand-midnight relative flex flex-col justify-between overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
                      
                      <div className="relative z-10 flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                        <span className="font-mono text-xs text-indigo-400 flex items-center gap-1.5">
                          <Layers size={14} /> SYSTEM INTEGRATION FLOW
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">Distributed Architecture Map</span>
                      </div>

                      {/* Mock flow network diagram */}
                      <div className="relative z-10 py-6 px-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center text-center">
                        
                        <div className="space-y-1">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                            <Smartphone size={18} className="text-indigo-400" />
                          </div>
                          <p className="text-[9px] font-bold">Client Device</p>
                        </div>

                        <div className="flex-1 flex items-center relative">
                          <div className="h-[2px] bg-gradient-to-r from-indigo-500 to-teal-500 w-full animate-pulse" />
                          {edgeCacheEnabled && (
                            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-6 px-1.5 py-0.5 bg-brand-green text-white text-[8px] font-bold rounded">
                              Edge Hit
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto transition-all ${edgeCacheEnabled ? 'bg-brand-green/20 border-brand-green' : 'bg-white/5 border-white/10'}`}>
                            <Cloud size={18} className="text-brand-green" />
                          </div>
                          <p className="text-[9px] font-bold">Edge CDN</p>
                        </div>

                        <div className="flex-1 flex items-center">
                          <div className="h-[2px] bg-gradient-to-r from-teal-500 to-indigo-500 w-full animate-pulse" />
                        </div>

                        <div className="space-y-1">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                            <Database size={18} className="text-teal-400" />
                          </div>
                          <p className="text-[9px] font-bold">DB Replicas</p>
                        </div>

                      </div>

                      {/* System outcome values calculated based on checkbox states */}
                      <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-4 text-center">
                        <div className="bg-white/5 py-3 rounded-xl border border-white/5">
                          <p className="text-[10px] uppercase font-bold text-gray-500">System Latency (P95)</p>
                          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{fsMetrics.latency} ms</p>
                        </div>
                        <div className="bg-white/5 py-3 rounded-xl border border-white/5">
                          <p className="text-[10px] uppercase font-bold text-gray-500">Max System Throughput</p>
                          <p className="text-2xl font-mono font-bold text-white mt-1">{fsMetrics.throughput} txn/s</p>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* SPECIFIC SIMULATOR 4: UI/UX DESIGN */}
                {track === 'ui-ux' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Design Token controllers */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-6">
                      <div className="flex items-center gap-2 border-b border-brand-border pb-3">
                        <Palette size={18} className="text-rose-600" />
                        <h4 className="font-display font-bold text-sm text-brand-midnight uppercase">
                          Figma Token Selector
                        </h4>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="block text-xs font-bold text-brand-midnight mb-2">Color Palette Theme</span>
                          <div className="grid grid-cols-3 gap-2">
                            {['sunset', 'charcoal', 'forest'].map((theme) => (
                              <button
                                key={theme}
                                onClick={() => setUiTheme(theme as any)}
                                className={`py-2 rounded-xl text-center font-semibold text-[10px] border transition-all cursor-pointer uppercase ${
                                  uiTheme === theme
                                    ? 'bg-brand-midnight text-white border-brand-midnight'
                                    : 'bg-brand-warm-white text-gray-500 border-brand-border'
                                }`}
                              >
                                {theme}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="block text-xs font-bold text-brand-midnight mb-2">Border Corner Radius</span>
                          <div className="grid grid-cols-3 gap-2">
                            {['none', 'md', 'full'].map((radius) => (
                              <button
                                key={radius}
                                onClick={() => setUiRadius(radius as any)}
                                className={`py-2 rounded-xl text-center font-semibold text-[10px] border transition-all cursor-pointer uppercase ${
                                  uiRadius === radius
                                    ? 'bg-brand-midnight text-white border-brand-midnight'
                                    : 'bg-brand-warm-white text-gray-500 border-brand-border'
                                }`}
                              >
                                {radius === 'none' ? 'brutalist' : radius === 'md' ? 'rounded' : 'capsule'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="block text-xs font-bold text-brand-midnight mb-2">Layout Spacing Density</span>
                          <div className="grid grid-cols-2 gap-2">
                            {['dense', 'comfortable'].map((spacing) => (
                              <button
                                key={spacing}
                                onClick={() => setUiSpacing(spacing as any)}
                                className={`py-2 rounded-xl text-center font-semibold text-[10px] border transition-all cursor-pointer uppercase ${
                                  uiSpacing === spacing
                                    ? 'bg-brand-midnight text-white border-brand-midnight'
                                    : 'bg-brand-warm-white text-gray-500 border-brand-border'
                                }`}
                              >
                                {spacing}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rendering Token Card visual change live */}
                    <div className="lg:col-span-7 bg-slate-900 text-gray-300 p-6 rounded-3xl border border-slate-900 relative flex flex-col justify-between overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(253,164,175,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(253,164,175,0.03)_1px,transparent_1px)] [background-size:20px_20px]" />
                      
                      <div className="relative z-10 flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                        <span className="font-mono text-xs text-rose-300 flex items-center gap-1.5">
                          <Eye size={14} /> LIVE DESIGN CANVAS PREVIEW
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">Fidelity Vector Space</span>
                      </div>

                      {/* Customized card preview rendered based on design tokens */}
                      <div className="relative z-10 p-8 bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-center min-h-[140px]">
                        <div className={`w-64 border transition-all ${
                          uiTheme === 'sunset' ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white border-amber-400' :
                          uiTheme === 'forest' ? 'bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-emerald-500' :
                          'bg-zinc-800 text-gray-200 border-zinc-700'
                        } ${
                          uiRadius === 'none' ? 'rounded-none' :
                          uiRadius === 'full' ? 'rounded-[32px]' : 'rounded-xl'
                        } ${
                          uiSpacing === 'dense' ? 'p-3 space-y-1.5' : 'p-6 space-y-4'
                        }`}>
                          <p className="text-[10px] tracking-wider uppercase font-extrabold opacity-85">Aba Rebranding Card</p>
                          <h5 className="font-display font-extrabold text-base leading-tight">Digital Design Token Tokenizer</h5>
                          <p className="text-[11px] opacity-75 leading-relaxed">
                            A dynamic token component synced with tailwind configuration schemas.
                          </p>
                        </div>
                      </div>

                      {/* Display Computed CSS Output */}
                      <div className="relative z-10 border-t border-white/5 pt-4 mt-4 font-mono text-[10px] text-gray-400">
                        <p className="text-brand-gold">// COMPUTED TAILWIND UTILITY:</p>
                        <p className="mt-1 text-white bg-slate-950 p-2 rounded border border-white/5">
                          {`className="${
                            uiTheme === 'sunset' ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white border-amber-400 ' :
                            uiTheme === 'forest' ? 'bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-emerald-500 ' :
                            'bg-zinc-800 text-gray-200 border-zinc-700 '
                          }${
                            uiRadius === 'none' ? 'rounded-none ' :
                            uiRadius === 'full' ? 'rounded-3xl ' : 'rounded-xl '
                          }${
                            uiSpacing === 'dense' ? 'p-3 space-y-1.5' : 'p-6 space-y-4'
                          }"`}
                        </p>
                      </div>

                    </div>

                  </div>
                )}

                {/* SPECIFIC SIMULATOR 5: CREATIVE ARTS */}
                {track === 'creative-arts' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* List of custom assets */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-brand-border pb-3">
                        <Palette size={18} className="text-indigo-600" />
                        <h4 className="font-display font-bold text-sm text-brand-midnight uppercase">
                          Asset Portfolio Directory
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {creativeAssets.map((asset, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedAsset(index)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                              selectedAsset === index
                                ? 'bg-brand-midnight text-white border-brand-midnight shadow-md'
                                : 'bg-brand-warm-white text-brand-midnight border-brand-border hover:bg-white'
                            }`}
                          >
                            <span className="text-[9px] uppercase font-mono font-bold block opacity-60">Asset Node 0{index + 1}</span>
                            <span className="font-bold text-xs block mt-1">{asset.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Asset details view panel */}
                    <div className="lg:col-span-7 bg-slate-950 text-gray-300 p-6 rounded-3xl border border-slate-900 relative flex flex-col justify-between overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
                      
                      <div className="relative z-10 flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                        <span className="font-mono text-xs text-indigo-400 flex items-center gap-1.5">
                          <Image size={14} /> IMMERSIVE ASSET DIAGNOSTICS
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">Cultural Storytelling Node</span>
                      </div>

                      <div className="relative z-10 space-y-4">
                        <div>
                          <h4 className="text-base font-display font-bold text-white">
                            {creativeAssets[selectedAsset].title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                            {creativeAssets[selectedAsset].concept}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5 font-mono text-xs">
                          <div>
                            <span className="text-gray-500 text-[10px] block">Asset Geometry</span>
                            <span className="text-white font-bold mt-1 block">{creativeAssets[selectedAsset].polygons}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[10px] block">Production Cost</span>
                            <span className="text-indigo-400 font-bold mt-1 block">{creativeAssets[selectedAsset].timeSpent}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-500 text-[10px] uppercase font-mono font-bold block mb-2">Aesthetic Palette Swatches</span>
                          <div className="flex gap-2">
                            {creativeAssets[selectedAsset].colors.map((col, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
                                <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: col }} />
                                <span className="text-[10px] font-mono">{col}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* SPECIFIC SIMULATOR 6: CLOUD & DEVOPS */}
                {track === 'cloud-devops' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* DevOps Trigger Control */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-6">
                      <div className="flex items-center gap-2 border-b border-brand-border pb-3">
                        <Cloud size={18} className="text-cyan-600" />
                        <h4 className="font-display font-bold text-sm text-brand-midnight uppercase">
                          SureDev Pipeline Runner
                        </h4>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Trigger a live rollout pipeline testing static lints, Spec suites, edge Docker containers packaging, and rollout deployment.
                      </p>

                      <button
                        onClick={startDevOpsPipeline}
                        disabled={pipelineState !== 'idle'}
                        className="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Play size={12} />
                        <span>Trigger Vetted CI/CD Deployment</span>
                      </button>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Node Cluster Status:</span>
                          <span className="text-emerald-500 font-bold">100% HEALTHY</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Active Edge Cells:</span>
                          <span className="text-gray-600 font-bold">Aba, Umuahia, Lagos</span>
                        </div>
                      </div>
                    </div>

                    {/* DevOps Logs terminal output */}
                    <div className="lg:col-span-7 bg-zinc-950 text-gray-300 p-6 rounded-3xl font-mono text-xs shadow-lg space-y-4 relative flex flex-col justify-between overflow-hidden">
                      <div className="absolute top-2 right-3 flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      </div>
                      
                      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-[10px] text-gray-500">
                        <Settings size={12} className="text-cyan-400 animate-spin" />
                        <span>PIPELINE AGENT CONSOLE: v2.1-vetted-edge</span>
                      </div>

                      {/* Log Screen */}
                      <div className="h-44 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 pr-2">
                        {pipelineState === 'idle' && (
                          <p className="text-gray-500"># Pipeline agent ready. Trigger deployment to scan commits...</p>
                        )}
                        {pipelineLogs.map((log, index) => (
                          <div key={index} className={log.startsWith('🎉') || log.includes('[DEPLOY]') ? 'text-cyan-400' : log.includes('passed') || log.includes('green') ? 'text-emerald-400' : 'text-gray-400'}>
                            {log}
                          </div>
                        ))}
                      </div>

                      {/* Pipeline Stage Visualizer */}
                      <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-4 text-center text-[10px] font-bold">
                        <div className={`p-1.5 rounded ${pipelineState === 'linting' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-gray-500'}`}>LINT</div>
                        <div className={`p-1.5 rounded ${pipelineState === 'testing' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-gray-500'}`}>SPEC</div>
                        <div className={`p-1.5 rounded ${pipelineState === 'building' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-gray-500'}`}>BUILD</div>
                        <div className={`p-1.5 rounded ${pipelineState === 'deploying' || pipelineState === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500'}`}>ROLLOUT</div>
                      </div>

                    </div>

                  </div>
                )}

                {/* SPECIFIC SIMULATOR 7: MOBILE SYSTEMS */}
                {track === 'mobile-systems' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Mobile Controller Panel */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-brand-border shadow-sm space-y-6">
                      <div className="flex items-center gap-2 border-b border-brand-border pb-3">
                        <Smartphone size={18} className="text-amber-500" />
                        <h4 className="font-display font-bold text-sm text-brand-midnight uppercase">
                          Mobile App Emulator
                        </h4>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Interact with the companion app emulator on the right. Toggle "Offline Sandbox Mode" to test SQLite local database queuing and automated synchronizations.
                      </p>

                      <div className="space-y-3">
                        <button
                          onClick={addHarvestBagMobile}
                          className="w-full py-3.5 rounded-xl border border-brand-border bg-brand-warm-white hover:bg-white text-xs font-bold text-gray-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:border-amber-500"
                        >
                          <CheckSquare size={14} className="text-amber-500" />
                          <span>Simulate User Action (Add Harvest Bag)</span>
                        </button>

                        <button
                          onClick={toggleMobileOffline}
                          className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border ${
                            mobileOfflineMode
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}
                        >
                          <Wifi size={14} />
                          <span>{mobileOfflineMode ? 'Reconnect to Abia Central Network' : 'Disconnect (Simulate Offline)'}</span>
                        </button>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 leading-relaxed">
                        <p className="font-bold">SQLite Sync Queue Metrics:</p>
                        <p className="mt-1 text-amber-700">
                          Offline queue maintains local actions in SQLite. Disconnecting holds queries; reconnecting automatically dispatches backlogs with gRPC compression payloads.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Mobile Emulator Device */}
                    <div className="lg:col-span-7 bg-stone-900 text-gray-300 p-6 rounded-3xl border border-stone-800 relative flex flex-col justify-between items-center overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
                      
                      {/* Mobile phone notch mockup */}
                      <div className="w-56 border-8 border-stone-950 bg-stone-950 rounded-[36px] shadow-2xl p-4 space-y-4 text-center max-w-full">
                        <div className="w-16 h-3.5 bg-stone-900 rounded-full mx-auto mb-2" />
                        
                        <div className="flex justify-between items-center text-[8px] text-gray-500 px-1">
                          <span>SureDev Emulator</span>
                          <span className="flex items-center gap-1">
                            {mobileOfflineMode ? 'OFFLINE' : 'LTE 4G'}
                            <Wifi size={8} className={mobileOfflineMode ? 'text-red-500' : 'text-emerald-500'} />
                          </span>
                        </div>

                        {/* Mobile active app screen interface */}
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-left space-y-3 min-h-[140px]">
                          <p className="text-[7px] text-amber-500 uppercase font-mono font-bold tracking-widest">FarmRoute Mobile Client</p>
                          <h5 className="text-[10px] font-bold text-white font-display">Logistics Sync Hub</h5>
                          
                          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 flex items-center justify-between">
                            <span className="text-[8px] text-gray-400">Logged Output:</span>
                            <span className="text-xs font-mono font-bold text-white">{mobileHarvestCount} Bags</span>
                          </div>

                          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 flex items-center justify-between">
                            <span className="text-[8px] text-gray-400">Offline Queue:</span>
                            <span className={`text-[10px] font-mono font-bold ${mobileOfflineSyncQueue > 0 ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>
                              {mobileOfflineSyncQueue} Queries
                            </span>
                          </div>
                        </div>

                        <p className="text-[7px] text-gray-500 uppercase font-mono leading-none">Home Indicator</p>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

            {/* TAB 3: FEATURED PORTFOLIO WORK / CASE STUDIES */}
            {activeTab === 'projects' && (
              <div className="space-y-8">
                {developer.projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-3xl overflow-hidden border border-brand-border shadow-premium group">
                    <div className="aspect-[21/9] relative overflow-hidden bg-brand-midnight">
                      <img
                        src={project.image}
                        alt={project.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 md:p-8">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-brand-green text-white font-mono text-[9px] uppercase font-bold tracking-wider mb-2">
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
                          Project Narrative & Scope
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
                                Live Demonstration <ArrowLeft size={12} className="rotate-180" />
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

            {/* TAB 4: DIRECT PROPOSAL OUTREACH */}
            {activeTab === 'contact' && (
              <div className="bg-white p-8 rounded-3xl border border-brand-border shadow-premium">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  
                  {/* Left outreach templates */}
                  <div className="md:w-1/3 space-y-6">
                    <div>
                      <h4 className="text-xs font-display font-bold uppercase tracking-wider text-brand-midnight mb-2">
                        Quick Proposals
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

                  {/* Right contact form */}
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
                          Proposal Logs Sent Successfully
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
    </div>
  );
};
