import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, LayoutDashboard, Search, FileCode2, Sun, Moon, Settings, ShieldAlert, Database, Briefcase } from 'lucide-react';
import suredevBrandLogo from '../assets/images/suredev_brand_logo_1784065255454.jpg';
import { UserSession } from '../types';
import { UserAvatar } from './UserAvatar';
import { InAppNotificationCenter } from './InAppNotificationCenter';

interface NavbarProps {
  userSession: UserSession | null;
  activeView: 'landing' | 'dashboard' | 'directory' | 'post-project' | 'find-work';
  onViewChange: (view: 'landing' | 'dashboard' | 'directory' | 'post-project' | 'find-work') => void;
  onLoginClick: () => void;
  onJoinClick: () => void;
  onLogoutClick: () => void;
  onSectionScroll: (sectionId: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenEmailPrefs?: () => void;
  onOpenAdminEmail?: () => void;
  onOpenMigrationAudit?: () => void;
  onNavigateToPostProject?: () => void;
  currentUserId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  userSession,
  activeView,
  onViewChange,
  onLoginClick,
  onJoinClick,
  onLogoutClick,
  onSectionScroll,
  darkMode,
  onToggleDarkMode,
  onOpenEmailPrefs,
  onOpenAdminEmail,
  onOpenMigrationAudit,
  onNavigateToPostProject,
  currentUserId,
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
        <div className="hidden md:flex items-center gap-7">
          {userSession ? (
            <>
              {/* Logged In Navigation */}
              {userSession.accountType === 'developer' ? (
                <>
                  {/* Primary Developer Navigation: Find Work */}
                  <button
                    onClick={() => {
                      onViewChange('find-work');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      activeView === 'find-work'
                        ? 'text-brand-green'
                        : 'text-gray-600 dark:text-gray-300 hover:text-brand-midnight dark:hover:text-white'
                    }`}
                  >
                    <Briefcase size={15} />
                    Find Work
                  </button>

                  <button
                    onClick={() => {
                      onViewChange('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      activeView === 'dashboard'
                        ? 'text-brand-green'
                        : 'text-gray-500 hover:text-brand-midnight dark:hover:text-white'
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
                    className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                      activeView === 'directory'
                        ? 'text-brand-green'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Search size={13} />
                    Browse Employers
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onViewChange('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      activeView === 'dashboard'
                        ? 'text-brand-green'
                        : 'text-gray-500 hover:text-brand-midnight dark:hover:text-white'
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
                        : 'text-gray-500 hover:text-brand-midnight dark:hover:text-white'
                    }`}
                  >
                    <Search size={15} />
                    Browse Talent
                  </button>

                  <button
                    onClick={() => {
                      onViewChange('find-work');
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      activeView === 'find-work'
                        ? 'text-brand-green'
                        : 'text-gray-500 hover:text-brand-midnight dark:hover:text-white'
                    }`}
                  >
                    <Briefcase size={15} />
                    Find Work Feed
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigateToPostProject) {
                        onNavigateToPostProject();
                      } else {
                        onViewChange('post-project');
                      }
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      activeView === 'post-project'
                        ? 'bg-brand-green text-white shadow-sm'
                        : 'bg-brand-midnight/10 dark:bg-white/10 text-brand-midnight dark:text-white hover:bg-brand-green hover:text-white'
                    }`}
                  >
                    + Post Project
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {/* Guest Navigation */}
              <button
                onClick={() => handleLinkClick('developers-section')}
                className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-brand-midnight dark:hover:text-white transition-colors cursor-pointer"
              >
                Developers
              </button>
              <button
                onClick={() => {
                  onViewChange('find-work');
                  setMobileMenuOpen(false);
                }}
                className={`text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'find-work'
                    ? 'text-brand-green'
                    : 'text-gray-600 dark:text-gray-300 hover:text-brand-midnight dark:hover:text-white'
                }`}
              >
                <Briefcase size={14} />
                Find Work
              </button>
              <button
                onClick={() => handleLinkClick('why-section')}
                className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-brand-midnight dark:hover:text-white transition-colors cursor-pointer"
              >
                Why SureDev
              </button>
              <button
                onClick={() => handleLinkClick('testimonials-section')}
                className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-brand-midnight dark:hover:text-white transition-colors cursor-pointer"
              >
                Testimonials
              </button>
            </>
          )}
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl border border-brand-border dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-300 transition-all cursor-pointer focus:outline-none mr-1 flex items-center justify-center shadow-sm"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={17} className="text-amber-500 animate-[spin_10s_linear_infinite]" />
            ) : (
              <Moon size={17} className="text-indigo-600 dark:text-indigo-400" />
            )}
          </button>

          {userSession ? (
            <div className="flex items-center gap-3">
              <InAppNotificationCenter
                currentUserId={currentUserId || userSession.developerProfileId || userSession.employerProfileId}
                onNavigate={(v) => onViewChange(v as any)}
              />

              {onOpenEmailPrefs && (
                <button
                  onClick={onOpenEmailPrefs}
                  className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
                  title="Email Preferences"
                  aria-label="Email Preferences"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}

              {onOpenAdminEmail && (
                <button
                  onClick={onOpenAdminEmail}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Admin Email Panel"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Admin
                </button>
              )}

              {onOpenMigrationAudit && (
                <button
                  onClick={onOpenMigrationAudit}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Auth Data Audit & Migration"
                >
                  <Database className="w-3.5 h-3.5" /> Audit
                </button>
              )}

              <UserAvatar 
                email={userSession.email}
                src={userSession.profileImageUrl}
                hasCustomProfileImage={userSession.hasCustomProfileImage}
                sizeClassName="w-9 h-9"
                className="cursor-pointer border border-brand-border/60 shadow-sm hover:ring-2 hover:ring-brand-green/30 transition-all"
                onClick={() => onViewChange('dashboard')}
              />
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-brand-midnight dark:text-slate-200 truncate max-w-[120px]">
                  {userSession.email}
                </span>
                <span className="text-[10px] font-mono text-brand-green uppercase tracking-wider font-bold">
                  {userSession.accountType}
                </span>
              </div>
              <button
                onClick={onLogoutClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-brand-border dark:border-white/10 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-5 py-2.5 rounded-[14px] bg-brand-green hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow-[0_4px_20px_rgba(15,138,95,0.2)] border border-transparent hover:border-brand-gold/20 cursor-pointer"
            >
              Sign Up / Login
            </button>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl border border-brand-border dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-300 transition-all cursor-pointer focus:outline-none"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={17} className="text-amber-500" />
            ) : (
              <Moon size={17} className="text-indigo-600 dark:text-indigo-400" />
            )}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-brand-midnight dark:text-white transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-brand-warm-white border-b border-brand-border/80 shadow-premium p-6 flex flex-col gap-4 z-30">
          {userSession ? (
            <>
              <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    email={userSession.email}
                    src={userSession.profileImageUrl}
                    hasCustomProfileImage={userSession.hasCustomProfileImage}
                    sizeClassName="w-10 h-10"
                    className="border border-brand-border/60 shadow-sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-brand-midnight truncate max-w-[150px]">{userSession.email}</p>
                    <p className="text-[10px] font-mono text-brand-green uppercase tracking-wider font-bold mt-0.5">{userSession.accountType} portal</p>
                  </div>
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
                  onViewChange('find-work');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-base font-semibold text-brand-green py-1.5 flex items-center gap-2"
              >
                <Briefcase size={16} />
                Find Work Feed
              </button>
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
                onClick={() => {
                  onViewChange('find-work');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-base font-semibold text-brand-green py-1 border-b border-gray-100 flex items-center gap-2"
              >
                <Briefcase size={16} />
                Find Work
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
              
              <div className="pt-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLoginClick();
                  }}
                  className="w-full py-3 text-center rounded-[14px] bg-brand-green hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer shadow-sm"
                >
                  Sign Up / Login
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
