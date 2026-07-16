import React, { useState } from 'react';
import { Github, Twitter, Linkedin, Mail, ArrowRight, Check } from 'lucide-react';
import techriseLogo from '../assets/images/techrise_logo_1784060486836.jpg';
import learnFactoryLogo from '../assets/images/learn_factory_logo_1784060499081.jpg';
import suredevBrandLogo from '../assets/images/suredev_brand_logo_1784065255454.jpg';

interface FooterProps {
  onSectionScroll: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSectionScroll }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
      }, 3000);
    }
  };

  return (
    <footer className="bg-brand-midnight text-gray-400 py-16 md:py-24 border-t border-emerald-950 relative z-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* Left Side: Brand & Newsletter */}
        <div className="lg:col-span-5 space-y-8">
          <button
            onClick={() => onSectionScroll('hero-section')}
            className="flex items-center gap-3 group text-left focus:outline-none cursor-pointer"
          >
            <img
              src={suredevBrandLogo}
              alt="SureDev Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-md border border-white/10 transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
              id="brand-footer-logo"
            />
            <span className="font-display font-bold text-xl tracking-tight text-white">
              Sure<span className="text-brand-green">Dev</span>
            </span>
          </button>
          
          <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
            The premium location-based web directory highlighting pre-vetted engineers, UI designers, and systems architects from Abia, Nigeria.
          </p>

          {/* Newsletter subscription */}
          <div className="space-y-3">
            <p className="text-xs font-display font-semibold text-white uppercase tracking-widest">
              Subscribe to Tech Talent digests
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-brand-green text-sm font-medium">
                <Check size={16} /> Verified subscription successful!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex max-w-sm bg-white/5 border border-white/10 rounded-xl p-1 focus-within:border-brand-green transition-all">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 border-none outline-none text-white text-xs placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="p-2 px-4 rounded-lg bg-brand-green hover:bg-emerald-700 text-white font-medium text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  Join <ArrowRight size={12} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Links columns */}
        <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-10">
          
          {/* Column 1: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-display font-bold text-white uppercase tracking-widest">Directory Matrix</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onSectionScroll('developers-section')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Find Developers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSectionScroll('projects-section')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Inspect Projects
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSectionScroll('why-section')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Validation Protocol
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSectionScroll('testimonials-section')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Client Success
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Ecosystems */}
          <div className="space-y-4">
            <h4 className="text-xs font-display font-bold text-white uppercase tracking-widest">Abia Ecosystem</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://gdgaba.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GDG Aba
                </a>
              </li>
              <li>
                <a
                  href="https://abiatechhub.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Abia Tech Hub
                </a>
              </li>
              <li>
                <a
                  href="https://abastartupweek.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Aba Startup Week
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/devsinabia"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  DevsInAbia Org
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Social & Meta */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <h4 className="text-xs font-display font-bold text-white uppercase tracking-widest">Official Channels</h4>
            <div className="flex gap-4">
              <a
                href="https://github.com/suredev-abia"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all border border-white/5"
              >
                <Github size={18} />
              </a>
              <a
                href="https://twitter.com/suredev_abia"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all border border-white/5"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://linkedin.com/company/suredev-abia"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all border border-white/5"
              >
                <Linkedin size={18} />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Sync operations managed in Aba, Nigeria.
            </p>
          </div>

        </div>
      </div>

      {/* Official Partners Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16 pt-10 border-t border-white/5" id="partners-footer-section">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xs font-display font-bold text-white uppercase tracking-widest">
              Official Ecosystem Partners
            </h4>
            <p className="text-xs text-gray-500">
              Collaborating with leading technology drivers to foster digital excellence in Abia.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
            <div className="bg-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg border border-white/10 hover:scale-105 hover:bg-brand-warm-white transition-all duration-300">
              <img
                src={techriseLogo}
                alt="TechRise Logo"
                className="h-8 sm:h-9 w-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
                id="partner-logo-techrise"
              />
              <span className="font-display font-extrabold text-sm sm:text-base text-brand-midnight tracking-tight">
                TechRise
              </span>
            </div>
            <div className="bg-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg border border-white/10 hover:scale-105 hover:bg-brand-warm-white transition-all duration-300">
              <img
                src={learnFactoryLogo}
                alt="LearnFactory Logo"
                className="h-7 sm:h-8 w-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
                id="partner-logo-learnfactory"
              />
              <span className="font-display font-extrabold text-sm sm:text-base text-brand-midnight tracking-tight">
                LearnFactory
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-white/5 text-xs text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} SureDev. Supporting tech talent across Abia State.</p>
        <p className="flex items-center gap-1">
          Fostering engineering craftsmanship.
        </p>
      </div>
    </footer>
  );
};
