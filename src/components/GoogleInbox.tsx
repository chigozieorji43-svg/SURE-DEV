import React, { useState } from 'react';
import { Mail, Check, AlertCircle, RefreshCw, Send, ShieldAlert, Sparkles, Inbox, Star, StarOff, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';

interface EmailMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  date: string;
  body: string;
  isRead: boolean;
  isStarred?: boolean;
}

interface GoogleInboxProps {
  userEmail: string;
  userName: string;
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
  accountType: 'developer' | 'employer';
}

export const GoogleInbox: React.FC<GoogleInboxProps> = ({
  userEmail,
  userName,
  isGoogleConnected,
  onConnectGoogle,
  accountType,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate dynamic emails based on the user's name and type
  const welcomeEmailDev: EmailMessage = {
    id: 'msg-welcome-dev',
    senderName: 'SureDev Abia Team',
    senderEmail: 'welcome@suredev.ng',
    subject: 'Welcome to SureDev Abia - Your Gateway to Abia’s Tech Ecosystem! 🌟',
    date: 'Just Now',
    isRead: false,
    isStarred: true,
    body: `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #fff;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #047857; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #047857; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">SUREDEV ABIA</h1>
          <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 5px 0 0 0; letter-spacing: 1px;">Vetted Developer Directory</p>
        </div>

        <!-- Body -->
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Ndewo, ${userName || 'Developer'}! 👋</h2>
        
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          We are absolutely thrilled to welcome you to <strong>SureDev Abia</strong>, the premier digital directory connecting elite technology talent with verified organizations across Abia State.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          By signing up with Google, your account has been authenticated under the secure address <strong>${userEmail}</strong>. We have set up your portfolio coordinates and synchronized your initial professional profile details.
        </p>

        <!-- Highlight Box -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 14px; color: #166534; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            🚀 Your Developer Launch Blueprint:
          </h3>
          <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 13px; line-height: 1.5; color: #14532d;">
            <li><strong>Complete Your Stack:</strong> Go to the <em>My Credentials</em> tab and add your tailored skills, personal Bio, and professional WhatsApp contact number.</li>
            <li><strong>Link Your Work:</strong> Add up to 5 rich gallery projects in the <em>Portfolio Projects</em> tab with active demo links.</li>
            <li><strong>Toggle Availability:</strong> Set your active flag (Immediate, Soon, or Closed) on the sidebar so local agencies can filter correctly.</li>
            <li><strong>Activate Collaboration:</strong> Browse the public directory, partner up with peers in Aba or Umuahia, and trigger local WhatsApp discussions.</li>
          </ul>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 25px;">Connecting Traditional Commerce and Modern Software</h3>
        <p style="font-size: 13px; line-height: 1.6; color: #475569;">
          Abia is known as the commercial capital of West Africa, with rich craft and manufacturing hubs in Aba, Umuahia, and Arochukwu. SureDev’s goal is to bridge traditional trade sectors with premium local engineers to digitalize regional commerce, inventory networks, and cooperative tech tools.
        </p>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            This email was dispatched securely using OAuth Authentication directly via your authenticated Gmail connection.
          </p>
          <p style="font-size: 12px; color: #047857; font-weight: 700; margin: 5px 0 0 0;">
            SureDev Abia • Abia Digital Guild Consortium
          </p>
        </div>
      </div>
    `
  };

  const welcomeEmailEmp: EmailMessage = {
    id: 'msg-welcome-emp',
    senderName: 'SureDev Abia Team',
    senderEmail: 'welcome@suredev.ng',
    subject: 'Welcome to SureDev Abia - Powering Your Enterprise with Elite Tech Talent! 🌟',
    date: 'Just Now',
    isRead: false,
    isStarred: true,
    body: `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #fff;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #047857; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #047857; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">SUREDEV ABIA</h1>
          <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 5px 0 0 0; letter-spacing: 1px;">Employer Recruitment Suite</p>
        </div>

        <!-- Body -->
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Hello, ${userName || 'Employer Partner'}! 👋</h2>
        
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Welcome to <strong>SureDev Abia</strong>, the official digital matchmaker designed to connect local brands, production cooperatives, and digital agencies with elite software developers based right here in Abia State.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          You have successfully registered your company portal with the email <strong>${userEmail}</strong>. Our localized digital directory makes it seamless to find vetted, localized talent tailored for your operational tasks.
        </p>

        <!-- Highlight Box -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 14px; color: #166534; font-weight: 700;">
            💼 Recruiting Quick Start Guide:
          </h3>
          <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 13px; line-height: 1.5; color: #14532d;">
            <li><strong>Verify Directives:</strong> Go to the <em>Dashboard</em> to refine your tech stack needs, corporate website, and corporate logo.</li>
            <li><strong>Discover Engineers:</strong> Browse the public directory and filter candidates by Tech Stack (React, Figma, SolidWorks, Mobile) and Location (Aba, Umuahia, Ohafia).</li>
            <li><strong>Send Direct Contracts:</strong> Tap on any developer's card to read their background, click "Hire", and submit direct recruitment inquiries.</li>
            <li><strong>Accept Applications:</strong> Monitor incoming applications securely from developer partners looking to integrate into your corporate workspace.</li>
          </ul>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 25px;">Driving Local Production with High-Value Engineering</h3>
        <p style="font-size: 13px; line-height: 1.6; color: #475569;">
          From the massive commercial hubs in Aba (Ariaria Int'l Market) to agricultural networks in Bende, local businesses are scaling rapidly. Our goal is to empower you to locate tech partners directly in Abia, ensuring quick turnarounds, lower overheads, and highly productive local teams.
        </p>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            This onboarding mail was dispatched securely using OAuth Authentication directly via your authenticated Gmail connection.
          </p>
          <p style="font-size: 12px; color: #047857; font-weight: 700; margin: 5px 0 0 0;">
            SureDev Abia • Abia Digital Guild Consortium
          </p>
        </div>
      </div>
    `
  };

  const sysUpdateEmail: EmailMessage = {
    id: 'msg-sys-update',
    senderName: 'Abia Tech Guild',
    senderEmail: 'guild@abiatech.org',
    subject: '📢 Abia Digital Consortium Update - New Tech Subsidies & aba.js Meetup!',
    date: 'Yesterday',
    isRead: true,
    isStarred: false,
    body: `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #fff;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Upcoming Abia Tech Guild Updates 🚀</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          We are pleased to announce the scheduled <strong>aba.js Meetup</strong> scheduled for the final weekend of this month!
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Join us in Aba as we talk about JavaScript, industrial automation interfaces, and scaling local hardware operations to international markets. Subsidized transportation is available for all registered SureDev members from Umuahia and Ohafia.
        </p>
        <div style="margin-top: 20px; padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px;">
          📍 <strong>Location:</strong> Abia Innovation Hub, Aba Town Hall Road<br/>
          📅 <strong>Date:</strong> Saturday, 28th of this month • 10:00 AM UTC
        </div>
      </div>
    `
  };

  const [emails, setEmails] = useState<EmailMessage[]>([
    accountType === 'developer' ? welcomeEmailDev : welcomeEmailEmp,
    sysUpdateEmail,
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.filter(m => m.id !== id));
    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
    }
  };

  const filteredEmails = emails
    .filter(email => {
      if (activeTab === 'starred') return email.isStarred;
      return true;
    })
    .filter(email => {
      const query = searchQuery.toLowerCase();
      return email.subject.toLowerCase().includes(query) ||
             email.senderName.toLowerCase().includes(query) ||
             email.body.toLowerCase().includes(query);
    });

  return (
    <div className="bg-brand-warm-white/10 rounded-2xl border border-brand-border overflow-hidden min-h-[500px]">
      
      {/* Inbox Header Banner */}
      <div className="bg-brand-midnight text-white px-6 py-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
            <h3 className="font-display font-bold text-sm text-brand-gold tracking-wide uppercase">
              Authenticated Gmail Synchronization
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Synchronized with <span className="text-white font-mono font-bold">{userEmail || 'Google Account'}</span>
          </p>
        </div>
        
        {isGoogleConnected && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider border border-white/10"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Inbox'}</span>
          </button>
        )}
      </div>

      {!isGoogleConnected ? (
        <div className="p-12 text-center max-w-lg mx-auto space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-brand-green">
            <Mail size={30} className="text-brand-green" />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-base font-display font-bold text-brand-midnight">
              Google Account Sync Required
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              We automate your Welcome Pack and Platform Introductory Emails directly through official Google workspace pipelines. Connect your Google account to dispatch details and view your synchronized system mailboxes.
            </p>
          </div>

          <button
            onClick={onConnectGoogle}
            className="px-6 py-3 rounded-xl bg-brand-green hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} className="animate-pulse text-brand-gold" />
            <span>Connect with Google Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[450px]">
          
          {/* Sidebar */}
          <div className="md:col-span-3 border-r border-brand-border bg-white p-3 space-y-1.5">
            <button
              onClick={() => { setActiveTab('all'); setSelectedEmail(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'all' 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-brand-midnight'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox size={14} />
                <span>Inbox</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-brand-green/20 text-brand-green font-mono text-[9px] font-bold">
                {emails.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('starred'); setSelectedEmail(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'starred' 
                  ? 'bg-amber-500/10 text-amber-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-brand-midnight'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star size={14} />
                <span>Starred</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-mono text-[9px] font-bold">
                {emails.filter(e => e.isStarred).length}
              </span>
            </button>

            <div className="pt-6 px-3 border-t border-brand-border/60 mt-4">
              <h5 className="text-[10px] font-display font-bold uppercase tracking-wider text-gray-400">
                Workspace Status
              </h5>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-brand-green font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                <span>Active Connection</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                <span>OAuth Token Verified</span>
              </div>
            </div>
          </div>

          {/* Email List / Detail Panel */}
          <div className="md:col-span-9 bg-white flex flex-col">
            
            {selectedEmail ? (
              /* Email View Detail */
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-4 mb-4">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="flex items-center gap-1 text-gray-500 hover:text-brand-midnight text-xs font-bold uppercase tracking-wider"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Inbox</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleStar(selectedEmail.id, e)}
                      className={`p-2 rounded-lg hover:bg-gray-100 ${selectedEmail.isStarred ? 'text-amber-500' : 'text-gray-400'}`}
                    >
                      <Star size={16} fill={selectedEmail.isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(selectedEmail.id, e)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <h1 className="text-base font-display font-bold text-brand-midnight">
                    {selectedEmail.subject}
                  </h1>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-display font-bold text-xs uppercase">
                      {selectedEmail.senderName[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-midnight">
                        {selectedEmail.senderName}{' '}
                        <span className="text-gray-400 font-normal font-mono">&lt;{selectedEmail.senderEmail}&gt;</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">To: {userEmail} • {selectedEmail.date}</div>
                    </div>
                  </div>
                </div>

                {/* Email Body Frame */}
                <div 
                  className="flex-1 overflow-y-auto bg-gray-50/50 p-4 rounded-2xl border border-brand-border/60"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </div>
            ) : (
              /* Email List */
              <div className="flex-1 flex flex-col">
                <div className="p-3 border-b border-brand-border bg-gray-50/30 flex gap-2">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-brand-border text-xs focus:border-brand-green outline-none"
                  />
                </div>

                <div className="divide-y divide-brand-border/60 overflow-y-auto flex-1">
                  {filteredEmails.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                      <Mail size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-xs">No emails in this list.</p>
                    </div>
                  ) : (
                    filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => {
                          setSelectedEmail(email);
                          // Mark as read
                          setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isRead: true } : m));
                        }}
                        className={`p-4 hover:bg-brand-warm-white/20 transition-all cursor-pointer flex gap-3 items-start ${
                          !email.isRead ? 'bg-brand-green/5 border-l-2 border-l-brand-green' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleToggleStar(email.id, e)}
                            className={`p-1 rounded hover:bg-gray-100 ${email.isStarred ? 'text-amber-500' : 'text-gray-400'}`}
                          >
                            <Star size={13} fill={email.isStarred ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs ${!email.isRead ? 'font-bold text-brand-midnight' : 'text-gray-700'}`}>
                              {email.senderName}
                            </span>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              {email.date}
                            </span>
                          </div>
                          
                          <h4 className={`text-xs mt-0.5 truncate ${!email.isRead ? 'font-bold text-brand-midnight' : 'text-gray-600'}`}>
                            {email.subject}
                          </h4>

                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                            {email.body.replace(/<[^>]*>/g, '').trim()}
                          </p>
                        </div>

                        <button
                          onClick={(e) => handleDelete(email.id, e)}
                          className="p-1 rounded text-gray-300 hover:text-rose-600 hover:bg-rose-50 self-center transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
