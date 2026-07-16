import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowRight, Github, Code, Sparkles, Database, ShieldCheck } from 'lucide-react';
import { HERO_IMAGE } from '../data';

interface HeroProps {
  onSearch: (query: string) => void;
  onJoinClick: () => void;
  onBrowseClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSearch,
  onJoinClick,
  onBrowseClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <section
      id="hero-section"
      className="relative min-h-screen flex items-center pt-32 pb-24 md:py-36 overflow-hidden bg-brand-warm-white noise-bg"
    >
      {/* Background Grid & Subtle Gradients */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e6eae8_1px,transparent_1px),linear-gradient(to_bottom,#e6eae8_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-green/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        
        {/* Left Section (Content & Search) */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-8">
          {/* Tagline Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20 text-xs font-semibold tracking-wider text-brand-green uppercase"
          >
            <Sparkles size={12} className="text-brand-gold" />
            Discover. Build. Hire.
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-brand-midnight tracking-tight leading-[1.08]">
              Find the Best <br />
              <span className="text-brand-green relative inline-block">
                Tech Talent
                <span className="absolute bottom-1 left-0 w-full h-[6px] bg-brand-gold/10 -z-10 rounded-full" />
              </span> in Abia.
            </h1>
            <p className="text-gray-500 text-lg md:text-xl font-normal max-w-xl leading-relaxed">
              SureDev connects elite software engineers, product designers, and systems architects in Aba, Umuahia, and beyond with world-class local and global teams.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSearchSubmit}
            className="w-full max-w-lg flex items-center bg-white border border-brand-border rounded-[18px] p-2 shadow-premium hover:shadow-premium-hover transition-all duration-300 group"
          >
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="text-gray-400 group-focus-within:text-brand-green transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search Skills (e.g., React, Go, Figma...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-brand-midnight text-base font-normal placeholder-gray-400 py-3"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-[14px] bg-brand-midnight hover:bg-brand-midnight/90 text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              Search
            </button>
          </motion.form>

          {/* Secondary CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-5 pt-2"
          >
            <button
              onClick={onBrowseClick}
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-[14px] bg-brand-green hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-sm cursor-pointer"
            >
              Browse Directory
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onJoinClick}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[14px] bg-white border border-brand-border text-brand-midnight font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
            >
              Join as Developer
            </button>
          </motion.div>
        </div>

        {/* Right Section (3D Assets, Floating Glassmorphism Cards) */}
        <div className="lg:col-span-5 relative w-full flex items-center justify-center">
          {/* Main Visual Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative w-full max-w-[440px] aspect-square rounded-[32px] overflow-hidden border border-brand-border shadow-premium bg-white"
          >
            <img
              src={HERO_IMAGE}
              alt="SureDev Collaboration illustration"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover p-3 rounded-[32px]"
            />
            {/* Soft inner vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-midnight/10 via-transparent to-transparent pointer-events-none" />
          </motion.div>

          {/* Floating Element 1: GitHub Commits Badge */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-6 -left-6 md:-left-10 bg-white/90 backdrop-blur-md p-4 rounded-[20px] shadow-premium border border-brand-border flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-midnight flex items-center justify-center text-white">
              <Github size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium tracking-wide"> Abia Tech Ecosystem </p>
              <p className="text-sm font-display font-bold text-brand-midnight"> Verified Contributors </p>
            </div>
          </motion.div>

          {/* Floating Element 2: Tech Badge */}
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-8 -right-4 bg-white/90 backdrop-blur-md px-4 py-3.5 rounded-[20px] shadow-premium border border-brand-border flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
              <Code size={16} />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold tracking-wider text-brand-green">Availability</p>
              <p className="text-xs font-display font-bold text-brand-midnight">Immediate Booking Live</p>
            </div>
          </motion.div>

          {/* Floating Element 3: Database Badge */}
          <motion.div
            animate={{
              x: [0, 8, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/2 -right-8 bg-brand-midnight/95 text-white p-3.5 rounded-[18px] shadow-premium border border-white/10 hidden md:flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-gold">
              <ShieldCheck size={18} />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 font-medium">Verification Status</p>
              <p className="text-xs font-semibold text-white">Verified Registry Active</p>
            </div>
          </motion.div>

          {/* Floating Element 4: Mini Code Snippet in corner */}
          <div className="absolute bottom-6 -left-8 bg-zinc-950 p-4 rounded-[18px] shadow-premium border border-zinc-800 text-left font-mono text-[10px] text-emerald-400 hidden sm:block max-w-[200px]">
            <p className="text-gray-500">// SureDev API Match</p>
            <p className="text-pink-400">const<span className="text-white"> dev = </span>await<span className="text-white"> SureDev.match(&#123;</span></p>
            <p className="pl-3">location: <span className="text-yellow-200">"Aba"</span>,</p>
            <p className="pl-3">skills: [<span className="text-yellow-200">"React"</span>, <span className="text-yellow-200">"Go"</span>]</p>
            <p className="text-white">&#125;);</p>
          </div>
        </div>

      </div>
    </section>
  );
};
