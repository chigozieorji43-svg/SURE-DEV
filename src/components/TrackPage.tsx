import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, MapPin, Briefcase, Sparkles, SlidersHorizontal, Eye, Play, 
  Layers, Database, Cloud, Palette, DraftingCompass, Server, Brain, Shield,
  Smartphone, Terminal, Cpu, Zap, Activity
} from 'lucide-react';
import { Developer } from '../types';

interface TrackPageProps {
  trackName: string;
  onBack: () => void;
  onViewDeveloperProfile: (developer: Developer) => void;
  onHireDeveloper: (developer: Developer) => void;
  developers: Developer[];
}

interface TrackMetadata {
  displayName: string;
  tagline: string;
  description: string;
  gradientHeader: string;
  accentColor: string;
  accentBg: string;
  badgeBg: string;
  textMuted: string;
  skillsHighlighted: string[];
  bannerPattern: 'cad' | 'backend' | 'ui-ux' | 'creative' | 'devops' | 'ai' | 'security' | 'default';
}

export const TrackPage: React.FC<TrackPageProps> = ({
  trackName,
  onBack,
  onViewDeveloperProfile,
  onHireDeveloper,
  developers
}) => {
  // Determine track details
  const getTrackMetadata = (): TrackMetadata => {
    const tLower = trackName.toLowerCase();
    
    if (tLower.includes('cad/cam') || tLower.includes('cad') || tLower.includes('cam')) {
      return {
        displayName: 'Precision CAD/CAM Manufacturing Track',
        tagline: 'Vetted in G-code industrial modeling, structural tolerances, and CNC layout paths.',
        description: 'Abia\'s premier industrial-grade engineering talent. Sourced from the technical fabrication guilds of Aba and Umuahia, optimized for direct integration with modern hardware design pipelines.',
        gradientHeader: 'from-zinc-950 via-teal-950 to-zinc-950',
        accentColor: 'text-teal-400',
        accentBg: 'bg-teal-950/40 border-teal-800/60',
        badgeBg: 'bg-teal-950 text-teal-300 border-teal-800',
        textMuted: 'text-teal-100/70',
        skillsHighlighted: ['SolidWorks', 'Fusion 360', 'CNC Toolpaths', '3D Modeling', 'AutoCAD', 'Sheet Metal'],
        bannerPattern: 'cad'
      };
    }
    
    if (tLower.includes('backend')) {
      return {
        displayName: 'High-Throughput Backend Track',
        tagline: 'Vetted in low-latency concurrent API structures, memory safety, and sharding.',
        description: 'Engineers who eat connection pooling, indexing limits, and asynchronous event streams for breakfast. Highly vetted in Go, Rust, Node.js, and Abia\'s localized payment gateway routing standards.',
        gradientHeader: 'from-zinc-950 via-emerald-950 to-zinc-950',
        accentColor: 'text-emerald-400',
        accentBg: 'bg-emerald-950/40 border-emerald-800/60',
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        textMuted: 'text-emerald-100/70',
        skillsHighlighted: ['Go', 'Rust', 'Node.js', 'PostgreSQL', 'gRPC', 'Redis', 'WebSockets'],
        bannerPattern: 'backend'
      };
    }
    
    if (tLower.includes('design') || tLower.includes('ui/ux') || tLower.includes('ui-ux')) {
      return {
        // Highly legibility-oriented theme specifically designed to fix visibility bugs in the design track
        displayName: 'Pixel-Fidelity Product Design Track',
        tagline: 'Vetted in tokenized interface architectures, WCAG constraints, and aesthetic rhythm.',
        description: 'Creating delightful, responsive digital products that combine beautiful African visual identity with state-of-the-art layout science. Every candidate is proven to bridge front-end and Figma perfectly.',
        gradientHeader: 'from-slate-950 via-rose-950 to-slate-950',
        accentColor: 'text-rose-400',
        accentBg: 'bg-rose-950/50 border-rose-800/50',
        badgeBg: 'bg-rose-950 text-rose-300 border-rose-800',
        textMuted: 'text-rose-100/80',
        skillsHighlighted: ['Figma', 'UI Design', 'Framer Motion', 'Tailwind CSS', 'Design Tokens', 'Prototyping'],
        bannerPattern: 'ui-ux'
      };
    }
    
    if (tLower.includes('creative') || tLower.includes('art')) {
      return {
        displayName: 'Immersive Creative Arts Track',
        tagline: 'Vetted in 3D character asset sculpting, Blender retopology, and heritage narrative illustration.',
        description: 'Breathtaking 3D assets, fluid digital motion design, and high-fidelity modeling. Sourced to deliver stunning cinematic sequences, branding vectors, and rich cultural designs.',
        gradientHeader: 'from-zinc-950 via-indigo-950 to-zinc-950',
        accentColor: 'text-indigo-400',
        accentBg: 'bg-indigo-950/40 border-indigo-800/60',
        badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-800',
        textMuted: 'text-indigo-100/70',
        skillsHighlighted: ['Blender', '3D Animation', 'Character Modeling', 'After Effects', 'Illustration', 'Maya'],
        bannerPattern: 'creative'
      };
    }
    
    if (tLower.includes('cloud') || tLower.includes('devops')) {
      return {
        displayName: 'High-Availability Cloud & DevOps Track',
        tagline: 'Vetted in automatic failover cells, secure IAM parameters, and zero-downtime pipelines.',
        description: 'Architects of ironclad digital deployment networks. Specialists in cloud networks, container scheduling, declarative system architecture, and low-latency asset caches optimized for regional access.',
        gradientHeader: 'from-zinc-950 via-cyan-950 to-zinc-950',
        accentColor: 'text-cyan-400',
        accentBg: 'bg-cyan-950/40 border-cyan-800/60',
        badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-800',
        textMuted: 'text-cyan-100/70',
        skillsHighlighted: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD Pipelines', 'Prometheus', 'Linux'],
        bannerPattern: 'devops'
      };
    }
    
    if (tLower.includes('ai') || tLower.includes('data') || tLower.includes('machine')) {
      return {
        displayName: 'AI & Data Science Intelligence Track',
        tagline: 'Vetted in neural parameter fine-tuning, automated labeling engines, and clean model inference.',
        description: 'Engineers specializing in integrating generative AI interfaces, data analysis, local dataset structuring, and optimizing local inference execution for high-performance applications.',
        gradientHeader: 'from-zinc-950 via-purple-950 to-zinc-950',
        accentColor: 'text-purple-400',
        accentBg: 'bg-purple-950/40 border-purple-800/60',
        badgeBg: 'bg-purple-950 text-purple-300 border-purple-800',
        textMuted: 'text-purple-100/70',
        skillsHighlighted: ['Python', 'PyTorch', 'Gemini API', 'Scikit-Learn', 'Inference Optimization', 'SQL'],
        bannerPattern: 'ai'
      };
    }
    
    if (tLower.includes('security') || tLower.includes('cyber')) {
      return {
        displayName: 'Defensive Cybersecurity Track',
        tagline: 'Vetted in network boundary scans, automated threat detection, and API credential locks.',
        description: 'Security authorities ensuring absolute compliance, encryption safety, and robust boundary locks. Trained to conduct continuous penetration trials and configure threat mitigations.',
        gradientHeader: 'from-zinc-950 via-red-950 to-zinc-950',
        accentColor: 'text-red-400',
        accentBg: 'bg-red-950/40 border-red-800/60',
        badgeBg: 'bg-red-950 text-red-300 border-red-800',
        textMuted: 'text-red-100/70',
        skillsHighlighted: ['Penetration Testing', 'Cryptographic Salts', 'API Auditing', 'IAM Hardening', 'OWASP Vitals'],
        bannerPattern: 'security'
      };
    }

    // Default Full Stack / General Track
    return {
      displayName: 'Vetted Full Stack Engineering Track',
      tagline: 'Vetted in full-scale system architecture, rapid integration, and localized databases.',
      description: 'The ultimate versatile generalists. Creating comprehensive modern applications, managing secure user sessions, bridging dynamic APIs with custom interfaces, and deploying scalable structures.',
      gradientHeader: 'from-zinc-950 via-indigo-950 to-zinc-950',
      accentColor: 'text-indigo-400',
      accentBg: 'bg-indigo-950/40 border-indigo-800/60',
      badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      textMuted: 'text-indigo-100/70',
      skillsHighlighted: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Vite', 'GraphQL'],
      bannerPattern: 'default'
    };
  };

  const meta = getTrackMetadata();

  // Filter developers who belong to this track
  const filteredDevs = developers.filter((dev) => {
    const title = dev.title.toLowerCase();
    const skills = dev.skills.map(s => s.toLowerCase());
    const tLower = trackName.toLowerCase();

    if (tLower.includes('cad/cam') || tLower.includes('cad') || tLower.includes('cam')) {
      return title.includes('cad') || title.includes('cam') || title.includes('modeler') || skills.some(s => ['solidworks', 'fusion 360', 'autocad', '3d modeling'].includes(s));
    }
    if (tLower.includes('backend')) {
      return title.includes('backend') || skills.some(s => ['go', 'rust', 'postgresql', 'grpc'].includes(s));
    }
    if (tLower.includes('design') || tLower.includes('ui/ux') || tLower.includes('ui-ux')) {
      return title.includes('ux') || title.includes('design') || skills.some(s => ['figma', 'sketch', 'illustrator', 'ui design'].includes(s));
    }
    if (tLower.includes('creative') || tLower.includes('art')) {
      return title.includes('art') || title.includes('animation') || title.includes('animator') || skills.some(s => ['blender', 'after effects', 'illustration', 'photoshop'].includes(s));
    }
    if (tLower.includes('cloud') || tLower.includes('devops')) {
      return title.includes('cloud') || title.includes('devops') || skills.some(s => ['aws', 'kubernetes', 'terraform', 'docker'].includes(s));
    }
    if (tLower.includes('ai') || tLower.includes('data') || tLower.includes('machine')) {
      return title.includes('ai') || title.includes('data') || title.includes('machine') || skills.some(s => ['python', 'pytorch', 'ml', 'gemini'].includes(s));
    }
    if (tLower.includes('security') || tLower.includes('cyber')) {
      return title.includes('security') || title.includes('cyber') || skills.some(s => ['penetration', 'security', 'cryptography'].includes(s));
    }
    // Default fallback to full stack / other
    return true;
  });

  // CAD Interactive State
  const [cadSpecWidth, setCadSpecWidth] = useState<number>(90);
  const [cadSpecHeight, setCadSpecHeight] = useState<number>(45);
  // Backend Live Diagnostic State
  const [diagnosticActive, setDiagnosticActive] = useState<boolean>(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>(['$ abia-gateway ping', '-> [OK] Ping response in 4.2ms from Aba cell']);
  // Design Token Slider
  const [cornerRound, setCornerRound] = useState<'md' | 'xl' | '3xl'>('xl');
  // Creative Animation State
  const [animationFrame, setAnimationFrame] = useState<number>(0);
  const [animating, setAnimating] = useState<boolean>(false);

  const runDiagnostic = () => {
    setDiagnosticActive(true);
    setDiagnosticLogs(prev => [...prev, '$ checking microservice indices...', '-> [INFO] Thread contention: 1.02% (nominal)', '-> [SUCCESS] All regional Postgres clusters synced.']);
    setTimeout(() => {
      setDiagnosticActive(false);
    }, 1200);
  };

  const triggerAnimationPlay = () => {
    setAnimating(true);
    const interval = setInterval(() => {
      setAnimationFrame(f => {
        if (f >= 4) {
          clearInterval(interval);
          setAnimating(false);
          return 0;
        }
        return f + 1;
      });
    }, 300);
  };

  return (
    <div className="relative min-h-screen bg-brand-warm-white pb-24 pt-32">
      
      {/* Blueprint background designs specifically matching the track theme */}
      {meta.bannerPattern === 'cad' && (
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />
      )}
      {meta.bannerPattern === 'backend' && (
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.03] pointer-events-none" />
      )}
      {meta.bannerPattern === 'ui-ux' && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#fda4af_1px,transparent_1px),linear-gradient(to_bottom,#fda4af_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none" />
      )}
      {meta.bannerPattern === 'creative' && (
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.04] pointer-events-none" />
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Navigation Action Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm font-bold text-brand-midnight hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Directory
          </button>
          
          <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/10 px-3 py-1 rounded-full uppercase tracking-wider border border-brand-green/10">
            SECURE ACTIVE SECTOR
          </span>
        </div>

        {/* TRACK DETAIL COVER HERO */}
        <div className="bg-brand-midnight rounded-[32px] overflow-hidden border border-brand-midnight relative shadow-premium mb-12">
          {/* Glowing Radial Spotlight */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl opacity-60 pointer-events-none" />
          
          <div className="p-8 md:p-14 relative z-10 flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between">
            <div className="max-w-3xl">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md ${meta.badgeBg} text-xs font-mono font-extrabold uppercase tracking-wider border shadow-sm mb-4`}>
                <Sparkles size={12} className="animate-pulse" />
                VETTED SPECIALIST HUB
              </span>
              <h1 className="text-3.5xl md:text-5xl font-display font-extrabold text-white tracking-tight leading-none mt-2">
                {meta.displayName}
              </h1>
              <p className={`text-sm font-semibold ${meta.accentColor} mt-4`}>
                {meta.tagline}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed mt-4 max-w-xl">
                {meta.description}
              </p>

              {/* Skills directory indicators */}
              <div className="flex flex-wrap gap-2 mt-6">
                {meta.skillsHighlighted.map((skill, idx) => (
                  <span
                    key={`${skill}-${idx}`}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-white uppercase tracking-wider"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Interactive Widget Side Area depending on the Category Track */}
            <div className="w-full lg:w-80 bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
              <p className="text-[10px] font-mono uppercase font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                <SlidersHorizontal size={12} className={meta.accentColor} /> TRACK COMPONENT DIAGNOSTIC
              </p>

              {/* CAD/CAM Tool */}
              {meta.bannerPattern === 'cad' && (
                <div className="space-y-4">
                  <div className="bg-black/30 p-4 rounded-xl border border-teal-900/30 font-mono text-[10px] text-teal-400 space-y-2">
                    <p>CALIPER TOLERANCE VALUE:</p>
                    <div className="h-2.5 w-full bg-teal-950 rounded overflow-hidden flex items-center">
                      <div className="h-full bg-teal-400 transition-all duration-300" style={{ width: `${cadSpecWidth}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400">
                      <span>Width: {cadSpecWidth}mm</span>
                      <span>Draft: {cadSpecHeight}°</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setCadSpecWidth(w => Math.min(100, w+10))} className="py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-[9px] font-bold uppercase transition-colors">Width +</button>
                    <button onClick={() => setCadSpecHeight(h => Math.max(10, h-5))} className="py-2 border border-teal-500/30 text-teal-300 hover:bg-white/5 rounded-lg text-[9px] font-bold uppercase transition-colors">Draft -</button>
                  </div>
                </div>
              )}

              {/* Backend Tool */}
              {meta.bannerPattern === 'backend' && (
                <div className="space-y-3">
                  <div className="bg-black/40 p-3 rounded-xl border border-emerald-950 font-mono text-[9px] text-emerald-400 h-24 overflow-y-auto space-y-1 scrollbar-none">
                    {diagnosticLogs.map((log, i) => (
                      <p key={i} className={log.startsWith('$') ? 'text-brand-gold' : 'text-gray-400'}>{log}</p>
                    ))}
                  </div>
                  <button
                    disabled={diagnosticActive}
                    onClick={runDiagnostic}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play size={10} /> {diagnosticActive ? 'Running...' : 'Deploy Edge Check'}
                  </button>
                </div>
              )}

              {/* UI/UX Token Tool */}
              {meta.bannerPattern === 'ui-ux' && (
                <div className="space-y-4">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-center min-h-[70px]">
                    <div className={`px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-center text-xs transition-all duration-300 ${
                      cornerRound === 'md' ? 'rounded-md' : cornerRound === 'xl' ? 'rounded-xl' : 'rounded-[24px]'
                    }`}>
                      UI design demo
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(['md', 'xl', '3xl'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setCornerRound(r)}
                        className={`flex-1 py-1.5 rounded text-[8px] font-bold uppercase border transition-all ${
                          cornerRound === r ? 'bg-rose-500 text-white border-rose-500' : 'bg-transparent text-gray-400 border-white/10 hover:border-gray-600'
                        }`}
                      >
                        {r} radius
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Creative Animating Tool */}
              {meta.bannerPattern === 'creative' && (
                <div className="space-y-3">
                  <div className="aspect-video bg-black/40 rounded-xl border border-indigo-900/40 flex items-center justify-center relative overflow-hidden">
                    {/* Render custom moving polygon vector */}
                    <div className="w-12 h-12 bg-indigo-500 transition-all duration-300" style={{
                      transform: `rotate(${animationFrame * 45}deg) scale(${1 + (animationFrame * 0.15)})`,
                      borderRadius: animationFrame % 2 === 0 ? '50%' : '12px',
                      opacity: 0.7 + (animationFrame * 0.05)
                    }} />
                    <span className="absolute bottom-2 right-2 text-[8px] font-mono text-gray-500">Asset Render Index: {animationFrame}/4</span>
                  </div>
                  <button
                    onClick={triggerAnimationPlay}
                    disabled={animating}
                    className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white text-[10px] font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    <Play size={10} /> {animating ? 'Rendering Keyframes...' : 'Loop Render Frame'}
                  </button>
                </div>
              )}

              {/* Default Fallback Tool */}
              {!['cad', 'backend', 'ui-ux', 'creative'].includes(meta.bannerPattern) && (
                <div className="space-y-2 text-center text-gray-400 font-mono text-[10px] py-4">
                  <Cpu size={24} className="mx-auto text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />
                  <p className="mt-2">Microservice Routing</p>
                  <p className="text-[8px] text-gray-500">Load balancer: Nominal state</p>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* FILTERED DEVELOPERS GRID */}
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-green" />
            <h2 className="text-xl font-display font-extrabold text-brand-midnight tracking-tight">
              Ecosystem Sector Talents ({filteredDevs.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDevs.map((dev, idx) => (
              <div
                key={dev.id ? `${dev.id}-${idx}` : idx}
                id={`track-dev-card-${dev.id}`}
                className="group relative bg-white rounded-[24px] p-6 border border-brand-border hover:border-brand-green/30 hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={dev.avatar}
                          alt={dev.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-full object-cover border border-brand-border shadow-sm group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className={`absolute bottom-0 right-0 block w-3.5 h-3.5 rounded-full border-2 border-white ${
                          dev.availability === 'immediate' ? 'bg-brand-green' : 'bg-brand-gold'
                        }`} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1.5">
                          {/* STYLING FIX: Bold, crisp text color to ensure developer name is highly visible even inside UI/UX Design track card rendering */}
                          <h4 className="font-display font-extrabold text-base text-brand-midnight tracking-tight group-hover:text-brand-green transition-colors">
                            {dev.name}
                          </h4>
                          {dev.featured && (
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-brand-gold/15 text-brand-gold font-display font-extrabold text-[9px] uppercase tracking-wider border border-brand-gold/20">
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-green font-semibold mt-0.5">{dev.title}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                    {dev.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {dev.skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={`${skill}-${idx}`}
                        className="px-2.5 py-1 rounded-full bg-brand-warm-white text-gray-600 font-bold text-xs border border-brand-border/60"
                      >
                        {skill}
                      </span>
                    ))}
                    {dev.skills.length > 4 && (
                      <span className="px-2 py-1 rounded-full bg-brand-warm-white text-gray-400 font-bold text-[10px] border border-brand-border/60">
                        +{dev.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-brand-border/60 pt-5 mt-auto">
                  <div className="flex items-center justify-between gap-4 text-xs font-bold text-gray-400 mb-4 uppercase">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-brand-green" />
                      {dev.location}, Abia
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase size={14} className="text-brand-green" />
                      {dev.experience} yrs exp
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onViewDeveloperProfile(dev)}
                      className="w-full py-3 rounded-xl border border-brand-border text-brand-midnight hover:border-gray-400 hover:bg-gray-50 font-bold text-xs transition-colors cursor-pointer text-center"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => onHireDeveloper(dev)}
                      className="w-full py-3 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer text-center"
                    >
                      Hire Developer
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredDevs.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white border border-brand-border rounded-[24px] shadow-premium">
                <p className="text-base font-display font-bold text-brand-midnight">No vetted developers in this sector yet</p>
                <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
                  Our regional Abia certification councils are actively vetting and grading new talent profiles for this category.
                </p>
                <button
                  onClick={onBack}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-brand-midnight text-white text-xs font-bold cursor-pointer uppercase tracking-wider"
                >
                  Return to Directory
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
