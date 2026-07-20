import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';
import suredevBrandLogo from '../assets/images/suredev_brand_logo_1784065255454.jpg';
import learnFactoryLogo from '../assets/images/learn_factory_logo_1784060499081.jpg';
import techRiseLogo from '../assets/images/techrise_logo_1784060486836.jpg';
import yimbaLogo from '../assets/images/yimba_logo_1784570986848.jpg';

interface FooterProps {
  onSectionScroll: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSectionScroll }) => {
  return (
    <footer className="bg-brand-midnight text-gray-400 py-12 md:py-16 border-t border-emerald-950 relative z-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start gap-10">
        
        {/* Left Side: Brand & Description */}
        <div className="space-y-4 max-w-sm">
          <button
            onClick={() => onSectionScroll('hero-section')}
            className="flex items-center gap-3 group text-left focus:outline-none cursor-pointer"
          >
            <img
              src={suredevBrandLogo}
              alt="SureDev Logo"
              className="w-8 h-8 rounded-xl object-cover shadow-md border border-white/10 transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
              id="brand-footer-logo"
            />
            <span className="font-display font-bold text-lg tracking-tight text-white">
              Sure<span className="text-brand-green">Dev</span>
            </span>
          </button>
          
          <p className="text-gray-400 text-sm leading-relaxed">
            The premium location-based web directory highlighting pre-vetted engineers, UI designers, and developers from Abia, Nigeria.
          </p>
        </div>

        {/* Right Side: Links & Social */}
        <div className="flex flex-wrap gap-x-16 gap-y-8 items-start">
          
          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-display font-bold text-white uppercase tracking-widest">Directory Matrix</h4>
            <ul className="space-y-2 text-sm">
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

          {/* Ecosystem Partners */}
          <div className="space-y-3">
            <h4 className="text-xs font-display font-bold text-white uppercase tracking-widest">Ecosystem Partners</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.learnfactory.com.ng/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                  id="partner-link-learnfactory"
                >
                  <img
                    src={learnFactoryLogo}
                    alt="Learn Factory Nigeria"
                    className="w-5 h-5 rounded object-cover border border-white/10 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <span>Learn Factory</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.abiatechrise.ng/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                  id="partner-link-techrise"
                >
                  <img
                    src={techRiseLogo}
                    alt="Abia TechRise"
                    className="w-5 h-5 rounded object-cover border border-white/10 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <span>Abia TechRise</span>
                </a>
              </li>
              <li>
                <a
                  href="https://yimba-kappa.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                  id="partner-link-yimba"
                >
                  <img
                    src={yimbaLogo}
                    alt="Yimba"
                    className="w-5 h-5 rounded object-cover border border-white/10 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <span>Yimba</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Social Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-display font-bold text-white uppercase tracking-widest">Connect</h4>
            <div className="flex gap-3">
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
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-10 pt-6 border-t border-white/5 text-xs text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} SureDev. Supporting tech talent across Abia State.</p>
        <p className="flex items-center gap-1">
          Fostering engineering craftsmanship.
        </p>
      </div>
    </footer>
  );
};
