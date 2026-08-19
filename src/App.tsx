import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DeveloperDirectory } from './components/DeveloperDirectory';
import { WhySureDev } from './components/WhySureDev';
import { Testimonials } from './components/Testimonials';
import { JoinCTA } from './components/JoinCTA';
import { Footer } from './components/Footer';
import { DeveloperProfilePage } from './components/DeveloperProfilePage';
import { TrackPage } from './components/TrackPage';
import { 
  HireDeveloperModal, 
  JoinSureDevModal, 
  LoginModal,
  ResetPasswordModal 
} from './components/Modals';
import { Developer, Employer, UserSession, CollabRequest } from './types';
import { DEVELOPERS as initialDevelopers, EMPLOYERS as initialEmployers } from './data';
import { dbService } from './lib/firebaseService';
import { auth, firebaseSignOut, applyActionCode } from './lib/firebase';
import { notificationService } from './services/notificationService';
import { EmailPreferencesModal } from './components/EmailPreferencesModal';
import { AdminEmailPanel } from './components/AdminEmailPanel';

// Account Separation & Global Auth Context Imports
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleRoleSelectorModal } from './components/GoogleRoleSelectorModal';
import { AuthMismatchModal } from './components/AuthMismatchModal';
import { MigrationReportModal } from './components/MigrationReportModal';

// Full Stack Session Role Components
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { EmployerDashboard } from './components/EmployerDashboard';
import { DeveloperDirectoryEmployer } from './components/DeveloperDirectoryEmployer';
import { EmployerDirectoryDeveloper } from './components/EmployerDirectoryDeveloper';
import { SureDevAIAssistant } from './components/SureDevAIAssistant';
import { PostProject } from './components/PostProject';
import { FindWork } from './components/FindWork';

function MainApp() {
  const { firebaseUser, userDoc, role, developerProfile, employerProfile, logout, refreshAuth, loading: authLoading } = useAuth();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isHireOpen, setIsHireOpen] = useState(false);
  const [isEmailPrefsOpen, setIsEmailPrefsOpen] = useState(false);
  const [isAdminEmailOpen, setIsAdminEmailOpen] = useState(false);
  const [isMigrationAuditOpen, setIsMigrationAuditOpen] = useState(false);
  
  // Theme Toggle State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [activeProfile, setActiveProfile] = useState<Developer | null>(null);
  const [activeTrackPage, setActiveTrackPage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Core Persistent State Pools for Dynamic Registration
  const [developers, setDevelopers] = useState<Developer[]>(() => {
    try {
      const stored = localStorage.getItem('suredev_developers');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialDevelopers;
  });
  const [employers, setEmployers] = useState<Employer[]>(() => {
    try {
      const stored = localStorage.getItem('suredev_employers');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialEmployers;
  });
  const [collabRequests, setCollabRequests] = useState<CollabRequest[]>(() => {
    try {
      const stored = localStorage.getItem('suredev_collab_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Subscribe to real-time Cloud Firestore updates
  useEffect(() => {
    const unsub = dbService.subscribeDevelopers((liveDevs) => {
      const list = liveDevs || [];
      const uniqueDevs = Array.from(new Map(list.map((d, i) => [d.id || `dev-${i}`, d])).values());
      setDevelopers(uniqueDevs);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = dbService.subscribeEmployers((liveEmps) => {
      const list = liveEmps || [];
      const uniqueEmps = Array.from(new Map(list.map((e, i) => [e.id || `emp-${i}`, e])).values());
      setEmployers(uniqueEmps);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = dbService.subscribeCollaborationRequests((liveReqs) => {
      const list = liveReqs || [];
      const uniqueReqs = Array.from(new Map(list.map((r, i) => [r.id || `req-${i}`, r])).values());
      setCollabRequests(uniqueReqs);
    });
    return unsub;
  }, []);

  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'directory' | 'post-project' | 'find-work'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/find-work') {
        return 'find-work';
      }
      if (window.location.pathname === '/post-project') {
        return 'post-project';
      }
    }
    return 'landing';
  });
  const [isChatWorkspaceOpen, setIsChatWorkspaceOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/find-work') {
        setActiveView('find-work');
      } else if (window.location.pathname === '/post-project') {
        setActiveView('post-project');
      } else if (activeView === 'post-project' || activeView === 'find-work') {
        setActiveView('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeView]);

  const handleNavigateToFindWork = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/find-work');
    }
    setActiveView('find-work');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToPostProject = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/post-project');
    }
    setActiveView('post-project');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateFromPostProject = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    setActiveView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derive Single Source of Truth User Session from AuthContext
  const userSession: UserSession | null = (role && userDoc) ? {
    email: userDoc.email,
    accountType: role,
    isOnboarded: true,
    developerProfileId: role === 'developer' ? userDoc.uid : undefined,
    employerProfileId: role === 'employer' ? userDoc.uid : undefined,
    isGoogleUser: firebaseUser?.providerData.some(p => p.providerId === 'google.com'),
    profileImageUrl: (role === 'developer' ? developerProfile?.profileImageUrl || developerProfile?.avatar : employerProfile?.profileImageUrl || employerProfile?.companyLogo) || userDoc.profileImageUrl || userDoc.photoURL || undefined,
    hasCustomProfileImage: true
  } : null;

  // Auto-switch to dashboard view when user logs in with an assigned role
  useEffect(() => {
    if (userSession && activeView === 'landing') {
      setActiveView('dashboard');
    }
  }, [userSession?.email, userSession?.accountType]);

  // Password reset authorization state from URL oobCode
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get('oobCode');
    const mode = params.get('mode');

    if (oobCode) {
      if (mode === 'resetPassword' || (!mode && params.get('apiKey'))) {
        setResetCode(oobCode);
        setIsResetPasswordOpen(true);
      } else if (mode === 'verifyEmail' || mode === 'signIn') {
        if (auth) {
          applyActionCode(auth, oobCode)
            .then(() => {
              alert("✅ Email verified successfully! You can now log in to your SureDev account.");
              window.history.replaceState({}, document.title, window.location.pathname);
              setIsLoginOpen(true);
            })
            .catch((err) => {
              console.error("Failed to verify email code:", err);
              alert("This email verification link has expired or has already been used. Please log in or request a new link.");
              window.history.replaceState({}, document.title, window.location.pathname);
            });
        }
      }
    }
  }, []);

  const handleSendCollabRequest = (senderId: string, receiverId: string, message?: string) => {
    // Check if request already exists
    const exists = collabRequests.some(
      r => (r.senderId === senderId && r.receiverId === receiverId) ||
           (r.senderId === receiverId && r.receiverId === senderId)
    );
    if (exists) return;

    dbService.sendCollabRequest(senderId, receiverId, message);

    // Trigger Collaboration Request Email + In-App Notification
    const sender = developers.find(d => d.id === senderId);
    const receiver = developers.find(d => d.id === receiverId);
    if (receiver && receiver.email) {
      notificationService.triggerCollabRequestEmail({
        receiverId,
        receiverEmail: receiver.email,
        senderId,
        senderName: sender?.name || 'A Developer',
        message: message || 'Hey! Let\'s partner up on SureDev.'
      });
    }
  };

  const handleAcceptCollabRequest = (requestId: string) => {
    const currentUserId = userSession?.developerProfileId || userSession?.employerProfileId || 'anonymous';
    dbService.updateCollabRequestStatus(requestId, 'accepted', currentUserId);
  };

  const handleDeclineCollabRequest = (requestId: string) => {
    const currentUserId = userSession?.developerProfileId || userSession?.employerProfileId || 'anonymous';
    dbService.updateCollabRequestStatus(requestId, 'declined', currentUserId);
  };

  const handleCancelCollabRequest = (requestId: string) => {
    dbService.cancelCollabRequest(requestId);
  };


  // Smooth scroll helper
  const handleSectionScroll = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Sync search entry from hero
  const handleHeroSearch = (query: string) => {
    setSearchQuery(query);
    handleSectionScroll('developers-section');
  };

  // Open details full page
  const handleViewProfile = (developer: Developer) => {
    setActiveProfile(developer);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Open hire dialog
  const handleHireDeveloper = (developer: Developer) => {
    setSelectedDeveloper(developer);
    setIsHireOpen(true);
  };

  // Trigger Google Account connection from Dashboard tabs
  const handleDashboardConnectGoogle = () => {
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
  };

  // Handle Dynamic Registration / Setup Finish Callback
  const handleJoinSuccess = (formData: any, accountType: 'developer' | 'employer') => {
    const profileId = firebaseUser?.uid || formData.id || (accountType === 'developer' ? `dev-${Date.now()}` : `emp-${Date.now()}`);
    if (accountType === 'developer') {
      const newDev: Developer = {
        id: profileId,
        name: formData.name,
        title: formData.title || 'Specialist Engineer',
        avatar: formData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
        location: formData.location || 'Aba',
        experience: parseInt(formData.experience) || 3,
        skills: formData.skills ? formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : ['React', 'TypeScript', 'Tailwind CSS'],
        availability: 'immediate',
        bio: `Vetted ${formData.title || 'Engineer'} dedicated to crafting highly performant applications and customized localized solutions based in ${formData.location || 'Aba'}, Abia State.`,
        githubUrl: formData.github || 'https://github.com',
        linkedinUrl: 'https://linkedin.com',
        twitterUrl: 'https://twitter.com',
        portfolioUrl: formData.portfolio || 'https://portfolio.ng',
        featured: false,
        projects: [],
        email: formData.email,
        gender: formData.gender || 'Male',
        coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200&h=400',
        currentWorkplace: 'Independent Consultant',
        phone: '',
        workExperience: [],
        qualification: formData.qualification
      };
      setDevelopers(prev => [newDev, ...prev]);
      dbService.saveDeveloperProfile(profileId, newDev, profileId);
      refreshAuth();
      setActiveView('dashboard');
    } else {
      const newEmp: Employer = {
        id: profileId,
        companyName: formData.companyName,
        companyLogo: formData.companyLogo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200&h=200',
        contactPerson: formData.contactPerson,
        description: formData.description || `Leading local brand based in ${formData.location || 'Aba'}, specializing in ${formData.industry || 'E-commerce & Retail'}.`,
        website: formData.website || 'https://cooperative.ng',
        phone: formData.phone || '',
        email: formData.email,
        gender: formData.gender || 'Male',
        location: formData.location || 'Aba',
        industry: formData.industry || 'E-commerce & Retail',
        desiredSkills: formData.desiredSkills ? formData.desiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : ['React', 'TypeScript', 'Tailwind CSS'],
        hiringCategories: formData.hiringCategories || [],
        hiringTypes: formData.hiringTypes || ['Full-time'],
        targetQualifications: formData.targetQualifications
      };
      setEmployers(prev => [newEmp, ...prev]);
      dbService.saveEmployerProfile(profileId, newEmp, profileId);
      refreshAuth();
      setActiveView('dashboard');
    }

    // Dispatch Welcome & Verification Emails
    if (formData.email) {
      notificationService.triggerWelcomeEmail(
        profileId,
        formData.email,
        formData.name || formData.contactPerson || 'Member',
        accountType
      );
      if (!formData.isGoogleUser) {
        notificationService.triggerVerificationEmail(
          profileId,
          formData.email,
          formData.name || formData.contactPerson || 'Member'
        );
      }
    }
  };

  // Handle Login Authentication
  const handleLoginSuccess = (
    email: string, 
    accountType?: 'developer' | 'employer', 
    isGoogleUser?: boolean,
    displayName?: string,
    avatar?: string
  ) => {
    refreshAuth();
    setActiveView('dashboard');
    setIsLoginOpen(false);

    // Trigger Security Login Alert
    if (email) {
      notificationService.triggerSecurityAlert(
        email,
        email,
        'Secure Browser Session (Abia State, NG)'
      );
    }
  };

  // Handle Logout Action
  const handleLogout = async () => {
    await logout();
    setActiveView('landing');
    setActiveProfile(null);
    setActiveTrackPage(null);
  };

  // Check if current user session is an admin (Strictly restricted to chigozieorji43@gmail.com)
  const isAdminUser = Boolean(
    userSession && userSession.email.toLowerCase().trim() === 'chigozieorji43@gmail.com'
  );

  return (
    <div className="relative min-h-screen bg-brand-warm-white selection:bg-brand-green/20 selection:text-brand-midnight">
      
      {/* 1. Global Navigation Bar */}
      {!isChatWorkspaceOpen && (
        <Navbar 
          userSession={userSession}
          activeView={activeView}
          onViewChange={(view) => {
            setActiveProfile(null);
            setActiveTrackPage(null);
            setActiveView(view);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onLoginClick={() => setIsLoginOpen(true)}
          onJoinClick={() => setIsJoinOpen(true)}
          onLogoutClick={() => {
            logout();
            setActiveView('landing');
          }}
          onSectionScroll={(sectionId) => {
            setActiveProfile(null);
            setActiveTrackPage(null);
            setActiveView('landing');
            setTimeout(() => handleSectionScroll(sectionId), 150);
          }}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onOpenEmailPrefs={() => setIsEmailPrefsOpen(true)}
          onOpenAdminEmail={isAdminUser ? () => setIsAdminEmailOpen(true) : undefined}
          onOpenMigrationAudit={isAdminUser ? () => setIsMigrationAuditOpen(true) : undefined}
          onNavigateToPostProject={handleNavigateToPostProject}
          currentUserId={userSession?.developerProfileId || userSession?.employerProfileId}
        />
      )}

      {/* RENDER SEQUENCE MATRIX */}
      {activeView === 'find-work' ? (
        <FindWork 
          userSession={userSession}
          onNavigateToPostProject={handleNavigateToPostProject}
          onNavigateToEmployers={() => {
            setActiveView('directory');
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
            }
          }}
        />
      ) : activeView === 'post-project' ? (
        <PostProject 
          onNavigateDashboard={handleNavigateFromPostProject}
          onNavigateToProjects={handleNavigateFromPostProject}
          onOpenLoginModal={() => setIsLoginOpen(true)}
        />
      ) : activeProfile ? (
        <DeveloperProfilePage 
          developer={activeProfile}
          onBack={() => {
            setActiveProfile(null);
            // If we came from a track-specific landing page, we return there
            if (!activeTrackPage) {
              setTimeout(() => handleSectionScroll('developers-section'), 100);
            }
          }}
          onHireClick={handleHireDeveloper}
          userSession={userSession}
          collabRequests={collabRequests}
          onSendCollabRequest={handleSendCollabRequest}
          onAcceptCollabRequest={handleAcceptCollabRequest}
          onDeclineCollabRequest={handleDeclineCollabRequest}
          onCancelCollabRequest={handleCancelCollabRequest}
        />
      ) : activeTrackPage ? (
        <TrackPage 
          trackName={activeTrackPage}
          onBack={() => setActiveTrackPage(null)}
          onViewDeveloperProfile={handleViewProfile}
          onHireDeveloper={handleHireDeveloper}
          developers={developers}
        />
      ) : activeView === 'dashboard' && userSession ? (
        /* RENDER SESSION DASHBOARDS */
        userSession.accountType === 'developer' ? (() => {
          const dev = developers.find(d => d.id === userSession.developerProfileId) || developers[0] || initialDevelopers[0] || {
            id: userSession.developerProfileId || 'default-dev',
            name: userSession.email ? userSession.email.split('@')[0] : 'Developer Profile',
            title: 'Full Stack Engineer',
            location: 'Aba',
            experience: 3,
            skills: ['TypeScript', 'React', 'Node.js'],
            bio: 'Vetted software engineer on SureDev platform.',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            email: userSession.email || 'developer@suredev.app',
            availability: 'immediate',
            githubUrl: 'https://github.com',
            linkedinUrl: 'https://linkedin.com',
            portfolioUrl: 'https://suredev.app',
            projects: [],
            qualifications: [],
            certifications: []
          };
          return (
            <DeveloperDashboard 
              developer={dev}
              onUpdateDeveloper={(updated) => {
                setDevelopers(prev => {
                  const exists = prev.some(d => d.id === updated.id);
                  if (exists) {
                    return prev.map(d => d.id === updated.id ? updated : d);
                  }
                  return [updated, ...prev];
                });
                dbService.saveDeveloperProfile(updated.id, updated, updated.id);
                refreshAuth();
              }}
              onPreviewProfile={() => {
                setActiveProfile(dev);
              }}
              collabRequests={collabRequests}
              developers={developers.length > 0 ? developers : initialDevelopers}
              onAcceptCollabRequest={handleAcceptCollabRequest}
              onDeclineCollabRequest={handleDeclineCollabRequest}
              onCancelCollabRequest={handleCancelCollabRequest}
              isGoogleUser={userSession.isGoogleUser}
              onConnectGoogle={handleDashboardConnectGoogle}
              onTabChange={(tab) => setIsChatWorkspaceOpen(tab === 'chat')}
            />
          );
        })() : (() => {
          const emp = employers.find(e => e.id === userSession.employerProfileId) || employers[0] || initialEmployers[0] || {
            id: userSession.employerProfileId || 'default-emp',
            companyName: userSession.email ? `${userSession.email.split('@')[0]} Enterprises` : 'Corporate Partner',
            contactPerson: userSession.email ? userSession.email.split('@')[0] : 'Talent Manager',
            description: 'Verified corporate employer on SureDev Abia platform.',
            website: 'https://suredev.app',
            phone: '+2348012345678',
            email: userSession.email || 'employer@suredev.app',
            location: 'Aba',
            industry: 'Software & Technology',
            companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=400&auto=format&fit=crop&q=80',
            desiredSkills: ['React', 'TypeScript', 'Node.js'],
            hiringCategories: ['Full Stack', 'Backend'],
            hiringTypes: ['Full-time', 'Contract'],
            targetQualifications: 'Open to all vetted talent'
          };
          return (
            <EmployerDashboard 
              employer={emp}
              onUpdateEmployer={(updated) => {
                setEmployers(prev => {
                  const exists = prev.some(e => e.id === updated.id);
                  if (exists) {
                    return prev.map(e => e.id === updated.id ? updated : e);
                  }
                  return [updated, ...prev];
                });
                dbService.saveEmployerProfile(updated.id, updated, updated.id);
                refreshAuth();
              }}
              onPreviewProfile={() => {
                // Toggle directory view to preview active hires
                setActiveView('directory');
              }}
              isGoogleUser={userSession.isGoogleUser}
              onConnectGoogle={handleDashboardConnectGoogle}
              onTabChange={(tab) => setIsChatWorkspaceOpen(tab === 'chat')}
              onNavigateToPostProject={handleNavigateToPostProject}
            />
          );
        })()
      ) : activeView === 'directory' && userSession ? (
        /* RENDER AUTH-SECURED REVERSE DIRECTORIES */
        userSession.accountType === 'developer' ? (
          <EmployerDirectoryDeveloper 
            employers={employers}
            onApplyToEmployer={(employer) => {
              alert(`Your profile application has been securely submitted to ${employer.companyName}.`);
            }}
            onViewCompany={(employer) => {
              if (employer.website) {
                window.open(employer.website, '_blank');
              } else {
                alert(`Company description: ${employer.description}`);
              }
            }}
          />
        ) : (
          <DeveloperDirectoryEmployer 
            developers={developers}
            onViewProfile={handleViewProfile}
            onHireDeveloper={handleHireDeveloper}
          />
        )
      ) : (
        /* DEFAULT GENERAL PUBLIC LANDING VIEW */
        <>
          {/* 2. Hero Presentation */}
          <Hero 
            onSearch={handleHeroSearch}
            onJoinClick={() => setIsJoinOpen(true)}
            onBrowseClick={() => handleSectionScroll('developers-section')}
          />

          {/* 4. Filterable Developer Directory & Taxonomy */}
          <DeveloperDirectory 
            initialSearchQuery={searchQuery}
            onViewProfile={handleViewProfile}
            onHireDeveloper={handleHireDeveloper}
            developers={developers}
            onTrackClick={(trackName) => {
              setActiveTrackPage(trackName);
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
          />

          {/* 5. Core Value Propositions ("Why SureDev") */}
          <WhySureDev />

          {/* 7. Client Testimonial Endorsements */}
          <Testimonials />

          {/* 8. Large Registry Call to Action */}
          <JoinCTA 
            onJoinClick={() => setIsJoinOpen(true)}
            onHireClick={() => handleSectionScroll('developers-section')}
          />
        </>
      )}

      {/* 9. Premium Midnight Footer */}
      {!isChatWorkspaceOpen && (
        <Footer 
          onSectionScroll={(sectionId) => {
            setActiveProfile(null);
            setActiveTrackPage(null);
            setActiveView('landing');
            setTimeout(() => handleSectionScroll(sectionId), 150);
          }}
        />
      )}

      {/* --- ALL OVERLAY MODALS --- */}

      {/* Client Direct Hiring / Create Project Modal */}
      <HireDeveloperModal 
        isOpen={isHireOpen}
        onClose={() => {
          setIsHireOpen(false);
          setSelectedDeveloper(null);
        }}
        developer={selectedDeveloper}
        currentUserSession={userSession}
        employerProfile={employers.find(e => e.id === userSession?.employerProfileId) || null}
      />

      {/* Developer Registry Sign up flow */}
      <JoinSureDevModal 
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoinSuccess={handleJoinSuccess}
      />

      {/* Simple credentials Portal */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onOpenJoin={() => {
          setIsLoginOpen(false);
          setIsJoinOpen(true);
        }}
      />

      {/* Email Notification Preferences Modal */}
      <EmailPreferencesModal
        isOpen={isEmailPrefsOpen}
        onClose={() => setIsEmailPrefsOpen(false)}
        currentUserId={userSession?.developerProfileId || userSession?.employerProfileId}
      />

      {/* Admin Email Analytics & Announcement Modal */}
      {isAdminEmailOpen && isAdminUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 flex justify-center items-start sm:items-center min-h-screen">
          <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden">
            {/* Top Modal Header with Cancel/Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
              <span className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Admin Email & Analytics Center
              </span>
              <button
                onClick={() => setIsAdminEmailOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                aria-label="Close Admin Panel"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6">
              <AdminEmailPanel />
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Widget */}
      <SureDevAIAssistant />

      {/* Password Reset Modal when opening reset link */}
      {isResetPasswordOpen && resetCode && (
        <ResetPasswordModal
          isOpen={isResetPasswordOpen}
          onClose={() => {
            setIsResetPasswordOpen(false);
            setResetCode(null);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
          oobCode={resetCode}
        />
      )}

      {/* Account Separation Modals */}
      <GoogleRoleSelectorModal />
      <AuthMismatchModal onSwitchPortal={() => setActiveView('dashboard')} />
      {isAdminUser && (
        <MigrationReportModal 
          isOpen={isMigrationAuditOpen} 
          onClose={() => setIsMigrationAuditOpen(false)} 
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

