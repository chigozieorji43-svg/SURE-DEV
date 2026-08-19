import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, MessageSquare, Handshake, ShieldAlert, Sparkles, X, Check } from 'lucide-react';
import { InAppNotification } from '../types';
import { notificationService } from '../services/notificationService';

interface InAppNotificationCenterProps {
  currentUserId?: string;
  onNavigate?: (view: string) => void;
}

export const InAppNotificationCenter: React.FC<InAppNotificationCenterProps> = ({
  currentUserId,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = async () => {
    if (!currentUserId) return;
    setLoading(true);
    const data = await notificationService.fetchUserNotifications(currentUserId);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserId) {
      loadNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUserId]);

  const handleMarkAsRead = async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    await notificationService.markNotificationAsRead(notifId);
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await notificationService.markNotificationAsRead(undefined, currentUserId);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'collab_request':
        return <Handshake className="w-4 h-4 text-emerald-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'security_alert':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'weekly_update':
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  if (!currentUserId) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="In-App Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-medium">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" /> Mark read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                <span>You're all caught up! No notifications.</span>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={notif.id ? `${notif.id}-${idx}` : idx}
                  onClick={() => {
                    if (!notif.read) handleMarkAsRead(notif.id);
                    if (notif.actionUrl && onNavigate) {
                      onNavigate(notif.actionUrl.replace('/', ''));
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                    !notif.read ? 'bg-slate-800/30' : ''
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-800 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs font-semibold truncate ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {notif.body}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
