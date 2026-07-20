import React from 'react';
import { ArrowRight } from 'lucide-react';
import suredevBrandLogo from '../assets/images/suredev_brand_logo_1784065255454.jpg';

interface JoinCTAProps {
  onJoinClick: () => void;
  onHireClick: () => void;
}

export const JoinCTA: React.FC<JoinCTAProps> = ({ onJoinClick, onHireClick }) => {
  return (
    <section className="relative w-full py-16 bg-brand-warm-white z-10 overflow-hidden noise-bg">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Dynamic Gradient Container */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-green to-[#073F2B] p-8 md:p-16 text-center shadow-premium">
          {/* Subtle noise and decorative rings */}
          <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/5 rounded-full border border-white/5 pointer-events-none" />

          {/* Interactive Icon badge */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <img
              src={suredevBrandLogo}
              alt="SureDev Logo"
              className="w-14 h-14 rounded-2xl object-cover shadow-premium border border-white/20 hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              id="brand-cta-logo"
            />
          </div>

          <h2 className="relative text-3xl md:text-5xl font-display font-bold text-white tracking-tight max-w-3xl mx-auto leading-tight">
            Deploy Abia's Elite Talent in Your Engineering Roster
          </h2>
          
          <p className="relative text-emerald-100 text-base md:text-lg max-w-xl mx-auto mt-4 leading-relaxed font-light">
            Whether you are expanding a high-growth startup or seeking to publish your first vetted portfolio, SureDev is Abia's dedicated gateway.
          </p>

          <div className="relative flex flex-wrap justify-center items-center gap-4 mt-10">
            <button
              onClick={onHireClick}
              className="px-8 py-4 rounded-[14px] bg-[#FAFBFA] text-[#071A16] font-bold text-sm shadow-premium cursor-pointer transition-all hover:scale-105 hover:bg-white"
            >
              Hire Local Innovators
            </button>
            <button
              onClick={onJoinClick}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-[14px] bg-brand-midnight dark:bg-transparent text-white font-semibold text-sm hover:bg-brand-midnight/90 border border-white/10 dark:border-white/20 cursor-pointer transition-all hover:scale-105"
            >
              Apply to Registry
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
