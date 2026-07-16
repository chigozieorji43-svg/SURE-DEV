import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, LayoutDashboard, Search, FileCode2, Home } from 'lucide-react';
import suredevBrandLogo from '../assets/images/suredev_brand_logo_1784065255454.jpg';
import { UserSession } from '../types';

interface NavbarProps {
  userSession: UserSession | null;
  activeView: 'landing' | 'dashboard' | 'directory';
  onViewChange: (view: 'landing' | 'dashboard' | 'directory') => void;
  onLoginClick: () => void;
  onJoinClick: () => void;
  onLogoutClick: () => void;
  onSectionScroll: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userSession,
  activeView,
  onViewChange,
  onLoginClick,
  onJoinClick,
  onLogoutClick,
  onSectionScroll,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onViewChange('landing');
    setTimeout(() => {
      onSectionScroll(sectionId);
    }, 100);
  };

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled || activeView !== 'landing'
          ? 'bg-brand-warm-white/90 backdrop-blur-md border-b border-brand-border/60 py-4 shadow-sm'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => {
            onViewChange('landing');
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
        >
          <img
            src={suredevBrandLogo}
            alt="SureDev Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-md border border-brand-border/40 transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
            id="brand-navbar-logo"
          />
          <span className="font-display font-bold text-xl tracking-tight text-brand-midnight">
            Sure<span className="text-brand-green">Dev</span>
          </span>
        </button>

        {/* Navigation links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {userSession ? (
            <>
              {/* Logged In Navigation */}
              <button
                onClick={() => {
                  onViewChange('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'text-brand-green'
                    : 'text-gray-500 hover:text-brand-midnight'
                }`}
              >
                <LayoutDashboard size={15} />
                Dashboard
              </button>

              <button
                onClick={() => {
                  onViewChange('directory');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeView === 'directory'
                    ? 'text-brand-green'
                    : 'text-gray-500 hover:text-brand-midnight'
                }`}
              >
                <Search size={15} />
                {userSession.accountType === 'developer' ? 'Browse Employers' : 'Browse Talent'}
              </button>

              <button
                onClick={() => {
                  onViewChange('landing');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeView === 'landing'
                    ? 'text-brand-green'
                    : 'text-gray-500 hover:text-brand-midnight'
                }`}
              >
                <Home size={15} />
                Landing Page
              </button>
            </>
          ) : (
            <>
              {/* Guest Navigation */}
              <button
                onClick={() => handleLinkClick('developers-section')}
                className="text-sm font-medium text-gray-500 hover:text-brand-midnight transition-colors cursor-pointer"
              >
                Developers
              </button>
              <button
                onClick={() => handleLinkClick('projects-section')}
                className="text-sm font-medium text-gray-500 hover:text-brand-midnight transition-colors cursor-pointer"
              >
                Projects
              </button>
              <button
                onClick={() => handleLinkClick('why-section')}
                className="text-sm font-medium text-gray-500 hover:text-brand-midnight transition-colors cursor-pointer"
              >
                Why SureDev
              </button>
              <button
                onClick={() => handleLinkClick('testimonials-section')}
                className="text-sm font-medium text-gray-500 hover:text-brand-midnight transition-colors cursor-pointer"
              >
                Testimonials
              </button>
            </>
          )}
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-4">
          {userSession ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-brand-midnight truncate max-w-[120px]">
                  {userSession.email}
                </span>
                <span className="text-[10px] font-mono text-brand-green uppercase tracking-wider font-bold">
                  {userSession.accountType}
                </span>
              </div>
              <button
                onClick={onLogoutClick}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-brand-border text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-brand-midnight transition-colors cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={onJoinClick}
                className="px-5 py-2.5 rounded-[14px] bg-brand-green hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-sm hover:shadow-[0_4px_20px_rgba(15,138,95,0.2)] border border-transparent hover:border-brand-gold/20 cursor-pointer"
              >
                Join Registry
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-brand-midnight transition-colors focus:outline-none"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-brand-warm-white border-b border-brand-border/80 shadow-premium p-6 flex flex-col gap-4 z-30">
          {userSession ? (
            <>
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-midnight">{userSession.email}</p>
                  <p className="text-[10px] font-mono text-brand-green uppercase tracking-wider font-bold mt-0.5">{userSession.accountType} portal</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogoutClick();
                  }}
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg"
                >
                  <LogOut size={12} />
                  Out
                </button>
              </div>

              <button
                onClick={() => {
                  onViewChange('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-base font-semibold text-gray-700 py-1.5 flex items-center gap-2"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                onClick={() => {
                  onViewChange('directory');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-base font-semibold text-gray-700 py-1.5 flex items-center gap-2"
              >
                <Search size={16} />
                {userSession.accountType === 'developer' ? 'Browse Employers' : 'Browse Talent'}
              </button>
              <button
                onClick={() => {
                  onViewChange('landing');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-base font-semibold text-gray-700 py-1.5 flex items-center gap-2"
              >
                <Home size={16} />
                Landing Page
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleLinkClick('developers-section')}
                className="text-left text-base font-semibold text-gray-700 py-1 border-b border-gray-100"
              >
                Developers
              </button>
              <button
                onClick={() => handleLinkClick('projects-section')}
                className="text-left text-base font-semibold text-gray-700 py-1 border-b border-gray-100"
              >
                Projects
              </button>
              <button
                onClick={() => handleLinkClick('why-section')}
                className="text-left text-base font-semibold text-gray-700 py-1 border-b border-gray-100"
              >
                Why SureDev
              </button>
              <button
                onClick={() => handleLinkClick('testimonials-section')}
                className="text-left text-base font-semibold text-gray-700 py-1 border-b border-gray-100"
              >
                Testimonials
              </button>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLoginClick();
                  }}
                  className="flex-1 py-3 text-center rounded-[14px] border border-brand-border text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onJoinClick();
                  }}
                  className="flex-1 py-3 text-center rounded-[14px] bg-brand-green hover:bg-emerald-700 text-white text-sm font-medium cursor-pointer"
                >
                  Join Registry
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
