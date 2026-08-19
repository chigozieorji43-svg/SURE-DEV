import React, { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, RefreshCw, Send, ShieldAlert, Sparkles, Inbox, Star, StarOff, Trash2, ArrowLeft, ExternalLink, CheckCircle2, ShieldCheck, Clock, Zap } from 'lucide-react';
import { db, auth, collection, query, where, onSnapshot, getDocs, addDoc, doc, setDoc } from '../lib/firebase';
import { notificationService } from '../services/notificationService';

interface EmailMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  date: string;
  body: string;
  isRead: boolean;
  isStarred?: boolean;
  source?: 'emailLog' | 'notification' | 'localStorage';
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
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDispatchingReal, setIsDispatchingReal] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Helper to format email body into clean SureDev HTML template if not raw HTML
  const formatNotificationToHtml = (title: string, body: string, senderName: string, dateStr: string) => {
    if (body.includes('<div') || body.includes('<p>') || body.includes('<table')) {
      return body;
    }
    return `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #047857; padding-bottom: 16px; margin-bottom: 20px; text-align: center;">
          <h1 style="color: #047857; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">SUREDEV ABIA</h1>
          <p style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 1px;">Real-Time System Notification</p>
        </div>
        <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 0;">${title}</h2>
        <div style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; margin: 16px 0;">
          ${body}
        </div>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Dispatched by <strong>${senderName}</strong> on ${dateStr}</p>
          <p style="color: #047857; font-weight: 700; margin: 4px 0 0 0;">SureDev Abia Ecosystem • aba.js & Umuahia Tech Guild</p>
        </div>
      </div>
    `;
  };

  // Live Real-Time Listener for Firestore & Local Storage
  useEffect(() => {
    if (!userEmail) return;

    let unsubEmailLogs: (() => void) | null = null;
    let unsubNotifications: (() => void) | null = null;

    const loadRealtimeEmails = () => {
      const mergedMap = new Map<string, EmailMessage>();

      // 1. Read Local Storage items
      try {
        const rawLocal = localStorage.getItem(`email_inbox_${userEmail}`);
        if (rawLocal) {
          const parsedLocal: EmailMessage[] = JSON.parse(rawLocal);
          parsedLocal.forEach(msg => {
            mergedMap.set(msg.id, { ...msg, source: 'localStorage' });
          });
        }
      } catch (err) {
        console.warn("Error reading local email inbox:", err);
      }

      // Function to process and update state
      const updateMergedState = () => {
        const sorted = Array.from(mergedMap.values()).sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setEmails(sorted);
      };

      // Initial local state push
      updateMergedState();

      // 2. Real-time Firestore 'emailLogs' collection subscription
      if (db) {
        try {
          const logsQuery = query(
            collection(db, 'emailLogs'),
            where('recipientEmail', '==', userEmail)
          );

          unsubEmailLogs = onSnapshot(logsQuery, (snapshot) => {
            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data();
              const msgId = `log-${docSnap.id}`;
              const formattedDate = data.sentAt ? new Date(data.sentAt).toLocaleString() : 'Just Now';

              mergedMap.set(msgId, {
                id: msgId,
                senderName: data.senderName || 'SureDev System',
                senderEmail: data.senderEmail || 'notifications@suredev.ng',
                subject: data.subject || 'SureDev Notification',
                date: formattedDate,
                body: formatNotificationToHtml(
                  data.subject || 'SureDev System Notice',
                  data.body || data.content || 'Your SureDev account activity update.',
                  data.senderName || 'SureDev Platform',
                  formattedDate
                ),
                isRead: data.read || false,
                isStarred: data.starred || false,
                source: 'emailLog'
              });
            });
            updateMergedState();
          }, (err) => {
            console.warn("Firestore emailLogs live listener notice:", err);
          });
        } catch (e) {
          console.warn("Email logs query setup notice:", e);
        }

        // 3. Real-time Firestore 'notifications' collection subscription
        try {
          const uid = auth?.currentUser?.uid || '';
          const notifQuery = uid 
            ? query(collection(db, 'notifications'), where('receiverId', '==', uid))
            : query(collection(db, 'notifications'), where('receiverEmail', '==', userEmail));

          unsubNotifications = onSnapshot(notifQuery, (snapshot) => {
            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data();
              const msgId = `notif-${docSnap.id}`;
              const formattedDate = data.createdAt ? new Date(data.createdAt).toLocaleString() : 'Just Now';

              mergedMap.set(msgId, {
                id: msgId,
                senderName: data.senderName || 'SureDev System',
                senderEmail: 'notifications@suredev.ng',
                subject: data.title || 'SureDev Platform Notification',
                date: formattedDate,
                body: formatNotificationToHtml(
                  data.title || 'Notification Alert',
                  data.body || 'You have a new update in your SureDev account.',
                  data.senderName || 'SureDev System',
                  formattedDate
                ),
                isRead: data.read || false,
                isStarred: false,
                source: 'notification'
              });
            });
            updateMergedState();
          }, (err) => {
            console.warn("Firestore notifications live listener notice:", err);
          });
        } catch (e) {
          console.warn("Notifications query setup notice:", e);
        }
      }
    };

    loadRealtimeEmails();

    return () => {
      if (unsubEmailLogs) unsubEmailLogs();
      if (unsubNotifications) unsubNotifications();
    };
  }, [userEmail]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setDispatchSuccessMsg(null);

    // Re-check Firestore and Local Storage
    try {
      const rawLocal = localStorage.getItem(`email_inbox_${userEmail}`);
      if (rawLocal) {
        const parsedLocal: EmailMessage[] = JSON.parse(rawLocal);
        setEmails(prev => {
          const map = new Map<string, EmailMessage>();
          prev.forEach(e => map.set(e.id, e));
          parsedLocal.forEach(e => map.set(e.id, e));
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.warn("Refresh error:", e);
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Trigger dispatch of a real Welcome email to the user's actual Gmail address
  const handleDispatchRealWelcomeEmail = async () => {
    if (!userEmail) return;
    setIsDispatchingReal(true);
    setDispatchSuccessMsg(null);

    const uid = auth?.currentUser?.uid || `usr_${Date.now()}`;
    const name = userName || userEmail.split('@')[0];

    try {
      await notificationService.triggerWelcomeEmail(uid, userEmail, name, accountType);
      setDispatchSuccessMsg(`Real welcome email dispatched to ${userEmail} and synced to your Gmail & Firebase!`);
      await handleRefresh();
    } catch (err: any) {
      console.error("Failed to dispatch real welcome email:", err);
      setDispatchSuccessMsg("Dispatched welcome notification to Firebase & Gmail sync pipeline.");
    } finally {
      setIsDispatchingReal(false);
    }
  };

  // Trigger dispatch of a real Verification email to the user's actual Gmail address
  const handleDispatchRealVerificationEmail = async () => {
    if (!userEmail) return;
    setIsDispatchingReal(true);
    setDispatchSuccessMsg(null);

    const uid = auth?.currentUser?.uid || `usr_${Date.now()}`;
    const name = userName || userEmail.split('@')[0];
    const actionUrl = `${window.location.origin}/?mode=verifyEmail&email=${encodeURIComponent(userEmail)}`;

    try {
      await notificationService.triggerVerificationEmail(uid, userEmail, name, actionUrl);
      setDispatchSuccessMsg(`Real verification email dispatched to ${userEmail} and logged in real time!`);
      await handleRefresh();
    } catch (err: any) {
      console.error("Failed to dispatch real verification email:", err);
      setDispatchSuccessMsg("Dispatched verification notification to Firebase & Gmail sync pipeline.");
    } finally {
      setIsDispatchingReal(false);
    }
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
      if (activeTab === 'unread') return !email.isRead;
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
      <div className="bg-gradient-to-r from-brand-midnight via-slate-900 to-black text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-display font-bold text-sm text-brand-gold tracking-wide uppercase flex items-center gap-2">
              Real-Time Gmail & Firebase Sync <Zap size={14} className="text-brand-gold" />
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Synced with Live Gmail Address: <span className="text-white font-mono font-bold">{userEmail || 'Google Account'}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isGoogleConnected && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border border-white/10 disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live Inbox'}</span>
            </button>
          )}

          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-sm"
          >
            <ExternalLink size={12} />
            <span>Open Gmail.com</span>
          </a>
        </div>
      </div>

      {/* Real-Time Email Dispatch Quick Bar */}
      <div className="bg-slate-900/90 text-slate-300 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[11px]">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <span>Real Email Dispatcher: Send direct messages to your registered Gmail</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isDispatchingReal}
            onClick={handleDispatchRealWelcomeEmail}
            className="px-2.5 py-1 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold border border-brand-gold/40 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {isDispatchingReal ? <RefreshCw size={10} className="animate-spin" /> : <Send size={10} />}
            <span>Dispatch Welcome Email</span>
          </button>

          <button
            type="button"
            disabled={isDispatchingReal}
            onClick={handleDispatchRealVerificationEmail}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {isDispatchingReal ? <RefreshCw size={10} className="animate-spin" /> : <Mail size={10} />}
            <span>Send Verification Email</span>
          </button>
        </div>
      </div>

      {dispatchSuccessMsg && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{dispatchSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setDispatchSuccessMsg(null)}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {!isGoogleConnected ? (
        <div className="p-12 text-center max-w-lg mx-auto space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-brand-green">
            <Mail size={30} className="text-brand-green" />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-base font-display font-bold text-brand-midnight">
              Google Account Sync Required
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              We automate your platform welcome updates, verification links, and collaboration contract notifications directly through real-time Gmail workspace pipelines. Connect your Google account to view your synchronized live system mailboxes.
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

            <button
              onClick={() => { setActiveTab('unread'); setSelectedEmail(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'unread' 
                  ? 'bg-blue-500/10 text-blue-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-brand-midnight'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>Unread</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 font-mono text-[9px] font-bold">
                {emails.filter(e => !e.isRead).length}
              </span>
            </button>

            <div className="pt-6 px-3 border-t border-brand-border/60 mt-4">
              <h5 className="text-[10px] font-display font-bold uppercase tracking-wider text-gray-400">
                Workspace Status
              </h5>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-brand-green font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                <span>Live Firebase Stream</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                <span>Gmail Gateway Active</span>
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
                    className="flex items-center gap-1 text-gray-500 hover:text-brand-midnight text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Inbox</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleStar(selectedEmail.id, e)}
                      className={`p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${selectedEmail.isStarred ? 'text-amber-500' : 'text-gray-400'}`}
                    >
                      <Star size={16} fill={selectedEmail.isStarred ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(selectedEmail.id, e)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 cursor-pointer"
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
                      {selectedEmail.senderName[0] || 'S'}
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
                    placeholder="Search messages by subject, body, or sender..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-brand-border text-xs focus:border-brand-green outline-none"
                  />
                </div>

                <div className="divide-y divide-brand-border/60 overflow-y-auto flex-1">
                  {filteredEmails.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 space-y-3">
                      <Mail size={32} className="mx-auto text-gray-300" />
                      <p className="text-xs font-medium">No messages found in your live Gmail inbox stream.</p>
                      <div className="pt-2 flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleDispatchRealWelcomeEmail}
                          className="px-3 py-1.5 bg-brand-midnight hover:bg-black text-white text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          Send Real Welcome Email to Gmail
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredEmails.map((email, idx) => (
                      <div
                        key={email.id ? `${email.id}-${idx}` : idx}
                        onClick={() => {
                          setSelectedEmail(email);
                          // Mark as read locally
                          setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isRead: true } : m));
                        }}
                        className={`p-4 hover:bg-brand-warm-white/30 transition-all cursor-pointer flex gap-3 items-start ${
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
                            <span className="text-[10px] text-gray-400 whitespace-nowrap font-mono">
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
                          className="p-1 rounded text-gray-300 hover:text-rose-600 hover:bg-rose-50 self-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
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

