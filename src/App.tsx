import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustedBy } from './components/TrustedBy';
import { DeveloperDirectory } from './components/DeveloperDirectory';
import { WhySureDev } from './components/WhySureDev';
import { FeaturedProjects } from './components/FeaturedProjects';
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

// Full Stack Session Role Components
import { DeveloperDashboard } from './components/DeveloperDashboard';
import { EmployerDashboard } from './components/EmployerDashboard';
import { DeveloperDirectoryEmployer } from './components/DeveloperDirectoryEmployer';
import { EmployerDirectoryDeveloper } from './components/EmployerDirectoryDeveloper';

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isHireOpen, setIsHireOpen] = useState(false);
  
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [activeProfile, setActiveProfile] = useState<Developer | null>(null);
  const [activeTrackPage, setActiveTrackPage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Core Persistent State Pools for Dynamic Registration
  const [developers, setDevelopers] = useState<Developer[]>(() => {
    const stored = localStorage.getItem('suredev_developers');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }
    return initialDevelopers;
  });

  const [employers, setEmployers] = useState<Employer[]>(() => {
    const stored = localStorage.getItem('suredev_employers');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }
    return initialEmployers;
  });

  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const stored = localStorage.getItem('suredev_user_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Also automatically set active view to dashboard if we have a valid session
        return parsed;
      } catch (e) {
        // ignore
      }
    }
    return null;
  });
  
  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'directory'>(() => {
    const stored = localStorage.getItem('suredev_user_session');
    return stored ? 'dashboard' : 'landing';
  });

  // Sync state changes to localStorage
  useEffect(() => {
    if (userSession) {
      localStorage.setItem('suredev_user_session', JSON.stringify(userSession));
    } else {
      localStorage.removeItem('suredev_user_session');
    }
  }, [userSession]);

  useEffect(() => {
    localStorage.setItem('suredev_developers', JSON.stringify(developers));
  }, [developers]);

  useEffect(() => {
    localStorage.setItem('suredev_employers', JSON.stringify(employers));
  }, [employers]);

  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        const { name, email, avatar } = event.data.user;
        if (userSession) {
          // Update the session in-place
          setUserSession(prev => prev ? {
            ...prev,
            isGoogleUser: true,
            email: email
          } : null);

          // If they are developer, update developers state
          if (userSession.accountType === 'developer' && userSession.developerProfileId) {
            setDevelopers(prev => prev.map(d => {
              if (d.id === userSession.developerProfileId) {
                return {
                  ...d,
                  name: name,
                  email: email,
                  avatar: avatar || d.avatar
                };
              }
              return d;
            }));
          } else if (userSession.accountType === 'employer' && userSession.employerProfileId) {
            setEmployers(prev => prev.map(emp => {
              if (emp.id === userSession.employerProfileId) {
                return {
                  ...emp,
                  companyName: name + ' Enterprise',
                  contactPerson: name,
                  email: email,
                  companyLogo: avatar || emp.companyLogo
                };
              }
              return emp;
            }));
          }
        }
      }
    };
    window.addEventListener('message', handleGoogleMessage);
    return () => window.removeEventListener('message', handleGoogleMessage);
  }, [userSession]);

  // Collaboration / Friend Request System State
  const [collabRequests, setCollabRequests] = useState<CollabRequest[]>(() => {
    const stored = localStorage.getItem('suredev_collab_requests');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }
    // Preload beautiful mock requests to make the system feel active right away
    return [
      {
        id: 'collab-mock-1',
        senderId: 'dev-kalu',
        receiverId: 'dev-chinedu',
        status: 'pending',
        message: 'Hey Chinedu, I loved the AbaPay Commerce Gateway! Would you like to partner on an offline logistics supply chain app?',
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      },
      {
        id: 'collab-mock-2',
        senderId: 'dev-amarachi',
        receiverId: 'dev-chinedu',
        status: 'accepted',
        message: "Hi Chinedu, let's integrate the Oru Design Tokens with your payment gateway!",
        timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      }
    ];
  });

  const saveCollabRequests = (requests: CollabRequest[]) => {
    setCollabRequests(requests);
    localStorage.setItem('suredev_collab_requests', JSON.stringify(requests));
  };

  const handleSendCollabRequest = (senderId: string, receiverId: string, message?: string) => {
    // Check if request already exists
    const exists = collabRequests.some(
      r => (r.senderId === senderId && r.receiverId === receiverId) ||
           (r.senderId === receiverId && r.receiverId === senderId)
    );
    if (exists) return;

    const newRequest: CollabRequest = {
      id: `collab-${Date.now()}`,
      senderId,
      receiverId,
      status: 'pending',
      message,
      timestamp: new Date().toISOString(),
    };
    saveCollabRequests([newRequest, ...collabRequests]);
  };

  const handleAcceptCollabRequest = (requestId: string) => {
    saveCollabRequests(
      collabRequests.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r)
    );
  };

  const handleDeclineCollabRequest = (requestId: string) => {
    saveCollabRequests(
      collabRequests.map(r => r.id === requestId ? { ...r, status: 'declined' } : r)
    );
  };

  const handleCancelCollabRequest = (requestId: string) => {
    saveCollabRequests(
      collabRequests.filter(r => r.id !== requestId)
    );
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
    if (accountType === 'developer') {
      const newDev: Developer = {
        id: `dev-${Date.now()}`,
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
      setUserSession({
        email: formData.email,
        accountType: 'developer',
        isOnboarded: true,
        developerProfileId: newDev.id,
        isGoogleUser: formData.isGoogleUser
      });
      setActiveView('dashboard');
    } else {
      const newEmp: Employer = {
        id: `emp-${Date.now()}`,
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
      setUserSession({
        email: formData.email,
        accountType: 'employer',
        isOnboarded: true,
        employerProfileId: newEmp.id,
        isGoogleUser: formData.isGoogleUser
      });
      setActiveView('dashboard');
    }
  };

  // Handle Login Authentication
  const handleLoginSuccess = (email: string, accountType: 'developer' | 'employer', isGoogleUser?: boolean) => {
    const existingDev = developers.find(d => d.email?.toLowerCase() === email.toLowerCase());
    const existingEmp = employers.find(e => e.email?.toLowerCase() === email.toLowerCase());

    setUserSession({
      email,
      accountType,
      isOnboarded: true,
      developerProfileId: existingDev ? existingDev.id : (accountType === 'developer' ? developers[0]?.id : undefined),
      employerProfileId: existingEmp ? existingEmp.id : (accountType === 'employer' ? employers[0]?.id : undefined),
      isGoogleUser: isGoogleUser
    });
    setActiveView('dashboard');
  };

  // Handle Logout Action
  const handleLogout = () => {
    setUserSession(null);
    setActiveView('landing');
    setActiveProfile(null);
    setActiveTrackPage(null);
  };

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

          {/* 3. Social Validation Grid */}
          <TrustedBy />

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

          {/* 6. Dynamic Project Showcase */}
          <FeaturedProjects 
            onViewDeveloper={handleViewProfile}
            developers={developers}
          />

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

    </div>
  );
}
