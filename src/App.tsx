import { useState, useEffect } from 'react';
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
  LoginModal 
} from './components/Modals';
import { Developer, Employer, UserSession, CollabRequest } from './types';
import { DEVELOPERS as initialDevelopers, EMPLOYERS as initialEmployers } from './data';
import { dbService } from './lib/firebaseService';
import { auth, firebaseSignOut, onAuthStateChanged } from './lib/firebase';

// Full Stack Session Role Components
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { EmployerDashboard } from './components/EmployerDashboard';
import { DeveloperDirectoryEmployer } from './components/DeveloperDirectoryEmployer';
import { EmployerDirectoryDeveloper } from './components/EmployerDirectoryDeveloper';
import { SureDevAIAssistant } from './components/SureDevAIAssistant';

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isHireOpen, setIsHireOpen] = useState(false);
  
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
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [collabRequests, setCollabRequests] = useState<CollabRequest[]>([]);

  // Subscribe to real-time Cloud Firestore updates (or localStorage fallbacks)
  useEffect(() => {
    const unsub = dbService.subscribeDevelopers((liveDevs) => {
      setDevelopers(liveDevs || []);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = dbService.subscribeEmployers((liveEmps) => {
      setEmployers(liveEmps || []);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = dbService.subscribeCollaborationRequests((liveReqs) => {
      setCollabRequests(liveReqs);
    });
    return unsub;
  }, []);

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'directory'>('landing');

  // Sync session and view from Firebase Authentication State changes
  useEffect(() => {
    if (!auth) {
      setLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || '';
        const uid = firebaseUser.uid;

        // If a manual signup/registration flow is in progress, do not auto-create
        // a default profile here. Let the JoinSureDevModal finish the setup.
        if (localStorage.getItem('suredev_registering') === 'true') {
          setLoadingAuth(false);
          return;
        }

        try {
          const userDoc = await dbService.getUserDoc(uid);
          
          if (userDoc && userDoc.accountType) {
            const accountType = userDoc.accountType as 'developer' | 'employer';
            
            let devId: string | undefined;
            let empId: string | undefined;

            if (accountType === 'developer') {
              const profile = await dbService.getDeveloperProfile(uid);
              if (profile) {
                devId = uid;
              } else {
                await dbService.createDefaultDeveloperProfile(uid, email, firebaseUser.displayName || '');
                devId = uid;
              }
            } else {
              const profile = await dbService.getEmployerProfile(uid);
              if (profile) {
                empId = uid;
              } else {
                await dbService.createDefaultEmployerProfile(uid, email, firebaseUser.displayName || '');
                empId = uid;
              }
            }

            setUserSession({
              email,
              accountType,
              isOnboarded: true,
              developerProfileId: devId,
              employerProfileId: empId,
              isGoogleUser: firebaseUser.providerData.some(p => p.providerId === 'google.com')
            });
            setActiveView('dashboard');
          } else {
            // New user, default to developer profile so they are immediately onboarded
            await dbService.createDefaultDeveloperProfile(uid, email, firebaseUser.displayName || '');
            
            setUserSession({
              email,
              accountType: 'developer',
              isOnboarded: true,
              developerProfileId: uid,
              isGoogleUser: firebaseUser.providerData.some(p => p.providerId === 'google.com')
            });
            setActiveView('dashboard');
          }
        } catch (error) {
          console.error("Error fetching/creating user profile on auth change:", error);
        }
      } else {
        setUserSession(null);
        setActiveView('landing');
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSendCollabRequest = (senderId: string, receiverId: string, message?: string) => {
    // Check if request already exists
    const exists = collabRequests.some(
      r => (r.senderId === senderId && r.receiverId === receiverId) ||
           (r.senderId === receiverId && r.receiverId === senderId)
    );
    if (exists) return;

    dbService.sendCollabRequest(senderId, receiverId, message);
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
    const profileId = formData.id || (accountType === 'developer' ? `dev-${Date.now()}` : `emp-${Date.now()}`);
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
        coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200&h=400',
        currentWorkplace: 'Independent Consultant',
        phone: '',
        workExperience: [],
        qualification: formData.qualification
      };
      setDevelopers(prev => [newDev, ...prev]);
      dbService.saveDeveloperProfile(profileId, newDev, profileId);
      setUserSession({
        email: formData.email,
        accountType: 'developer',
        isOnboarded: true,
        developerProfileId: profileId,
        isGoogleUser: formData.isGoogleUser
      });
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
        location: formData.location || 'Aba',
        industry: formData.industry || 'E-commerce & Retail',
        desiredSkills: formData.desiredSkills ? formData.desiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : ['React', 'TypeScript', 'Tailwind CSS'],
        hiringCategories: formData.hiringCategories || [],
        hiringTypes: formData.hiringTypes || ['Full-time'],
        targetQualifications: formData.targetQualifications
      };
      setEmployers(prev => [newEmp, ...prev]);
      dbService.saveEmployerProfile(profileId, newEmp, profileId);
      setUserSession({
        email: formData.email,
        accountType: 'employer',
        isOnboarded: true,
        employerProfileId: profileId,
        isGoogleUser: formData.isGoogleUser
      });
      setActiveView('dashboard');
    }
  };

  // Handle Login Authentication
  const handleLoginSuccess = (
    email: string, 
    accountType: 'developer' | 'employer', 
    isGoogleUser?: boolean,
    displayName?: string,
    avatar?: string
  ) => {
    const existingDev = developers.find(d => d.email?.toLowerCase() === email.toLowerCase());
    const existingEmp = employers.find(e => e.email?.toLowerCase() === email.toLowerCase());

    let devId = existingDev?.id;
    let empId = existingEmp?.id;

    if (accountType === 'developer') {
      if (!existingDev) {
        // Create a developer profile using Google info so they don't get mock data
        const newDev: Developer = {
          id: `dev-${Date.now()}`,
          name: displayName || email.split('@')[0],
          title: 'Software Developer',
          avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
          location: 'Aba',
          experience: 3,
          skills: ['React', 'TypeScript', 'Tailwind CSS'],
          availability: 'immediate',
          bio: `Vetted Developer dedicated to crafting highly performant applications and customized localized solutions based in Aba, Abia State.`,
          githubUrl: 'https://github.com',
          linkedinUrl: 'https://linkedin.com',
          twitterUrl: 'https://twitter.com',
          portfolioUrl: 'https://portfolio.ng',
          featured: false,
          projects: [],
          email: email,
          coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200&h=400',
          currentWorkplace: 'Independent Consultant',
          phone: '',
          workExperience: [],
          qualification: 'Self-Taught Industry Specialist'
        };
        setDevelopers(prev => [newDev, ...prev]);
        dbService.saveDeveloperProfile(newDev.id, newDev, newDev.id);
        devId = newDev.id;
      }
    }

    if (accountType === 'employer') {
      if (!existingEmp) {
        // Create an employer profile using Google info
        const newEmp: Employer = {
          id: `emp-${Date.now()}`,
          companyName: displayName ? `${displayName}'s Company` : `${email.split('@')[0]}'s Venture`,
          companyLogo: avatar || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200&h=200',
          contactPerson: displayName || email.split('@')[0],
          description: `Leading local brand based in Aba, Abia State.`,
          website: 'https://cooperative.ng',
          phone: '',
          email: email,
          location: 'Aba',
          industry: 'E-commerce & Retail',
          desiredSkills: ['React', 'TypeScript', 'Tailwind CSS'],
          hiringCategories: [],
          hiringTypes: ['Full-time'],
          targetQualifications: 'Vetted Coding Bootcamp Graduate'
        };
        setEmployers(prev => [newEmp, ...prev]);
        dbService.saveEmployerProfile(newEmp.id, newEmp, newEmp.id);
        empId = newEmp.id;
      }
    }

    setUserSession({
      email,
      accountType,
      isOnboarded: true,
      developerProfileId: accountType === 'developer' ? devId : undefined,
      employerProfileId: accountType === 'employer' ? empId : undefined,
      isGoogleUser: isGoogleUser
    });
    setActiveView('dashboard');
  };

  // Handle Logout Action
  const handleLogout = async () => {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error("Firebase sign out failed:", err);
      }
    }
    setUserSession(null);
    setActiveView('landing');
    setActiveProfile(null);
    setActiveTrackPage(null);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-brand-warm-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-brand-midnight">Loading your SureDev session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-brand-warm-white selection:bg-brand-green/20 selection:text-brand-midnight">
      
      {/* 1. Global Navigation Bar */}
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
        onLogoutClick={handleLogout}
        onSectionScroll={(sectionId) => {
          setActiveProfile(null);
          setActiveTrackPage(null);
          setActiveView('landing');
          setTimeout(() => handleSectionScroll(sectionId), 150);
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* RENDER SEQUENCE MATRIX */}
      {activeProfile ? (
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
        userSession.accountType === 'developer' ? (
          <DeveloperDashboard 
            developer={developers.find(d => d.id === userSession.developerProfileId) || developers[0]}
            onUpdateDeveloper={(updated) => {
              setDevelopers(prev => prev.map(d => d.id === updated.id ? updated : d));
              dbService.saveDeveloperProfile(updated.id, updated, updated.id);
              setUserSession(prev => prev ? {
                ...prev,
                profileImageUrl: updated.profileImageUrl || updated.avatar,
                hasCustomProfileImage: updated.hasCustomProfileImage
              } : null);
            }}
            onPreviewProfile={() => {
              const dev = developers.find(d => d.id === userSession.developerProfileId) || developers[0];
              setActiveProfile(dev);
            }}
            collabRequests={collabRequests}
            developers={developers}
            onAcceptCollabRequest={handleAcceptCollabRequest}
            onDeclineCollabRequest={handleDeclineCollabRequest}
            onCancelCollabRequest={handleCancelCollabRequest}
            isGoogleUser={userSession.isGoogleUser}
            onConnectGoogle={handleDashboardConnectGoogle}
          />
        ) : (
          <EmployerDashboard 
            employer={employers.find(e => e.id === userSession.employerProfileId) || employers[0]}
            onUpdateEmployer={(updated) => {
              setEmployers(prev => prev.map(e => e.id === updated.id ? updated : e));
              dbService.saveEmployerProfile(updated.id, updated, updated.id);
              setUserSession(prev => prev ? {
                ...prev,
                profileImageUrl: updated.profileImageUrl || updated.companyLogo,
                hasCustomProfileImage: updated.hasCustomProfileImage
              } : null);
            }}
            onPreviewProfile={() => {
              // Toggle directory view to preview active hires
              setActiveView('directory');
            }}
            isGoogleUser={userSession.isGoogleUser}
            onConnectGoogle={handleDashboardConnectGoogle}
          />
        )
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
      <Footer 
        onSectionScroll={(sectionId) => {
          setActiveProfile(null);
          setActiveTrackPage(null);
          setActiveView('landing');
          setTimeout(() => handleSectionScroll(sectionId), 150);
        }}
      />

      {/* --- ALL OVERLAY MODALS --- */}

      {/* Client Direct Hiring Modal */}
      <HireDeveloperModal 
        isOpen={isHireOpen}
        onClose={() => {
          setIsHireOpen(false);
          setSelectedDeveloper(null);
        }}
        developer={selectedDeveloper}
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

      {/* Floating AI Assistant Widget */}
      <SureDevAIAssistant />

    </div>
  );
}
