/**
 * SureDev Client Notification Service
 * Interacts with backend /api/email endpoints for email dispatches, preferences, and in-app notifications.
 */

import { InAppNotification, EmailPreferences, EmailAnalytics } from '../types';

export const notificationService = {
  /**
   * Triggers idempotent welcome email dispatch on user account creation.
   */
  async triggerWelcomeEmail(uid: string, email: string, name?: string, userType: 'developer' | 'employer' = 'developer') {
    try {
      const res = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, name, userType })
      });
      return await res.json();
    } catch (err) {
      console.warn('Failed to trigger welcome email:', err);
      return { success: false };
    }
  },

  /**
   * Triggers verification email dispatch.
   */
  async triggerVerificationEmail(uid: string, email: string, name?: string, actionUrl?: string) {
    try {
      const res = await fetch('/api/email/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, name, actionUrl })
      });
      return await res.json();
    } catch (err) {
      console.warn('Failed to trigger verification email:', err);
      return { success: false };
    }
  },

  /**
   * Triggers password reset notification.
   */
  async triggerPasswordResetEmail(email: string, resetUrl: string, uid?: string, name?: string) {
    try {
      const res = await fetch('/api/email/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, name, resetUrl })
      });
      return await res.json();
    } catch (err) {
      console.warn('Failed to trigger password reset notification:', err);
      return { success: false };
    }
  },

  /**
   * Triggers collaboration request email + in-app notification.
   */
  async triggerCollabRequestEmail(params: {
    receiverId: string;
    receiverEmail: string;
    senderId: string;
    senderName: string;
    projectTitle?: string;
    message?: string;
    actionUrl?: string;
  }) {
    try {
      const res = await fetch('/api/email/collab-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err) {
      console.warn('Failed to trigger collaboration request email:', err);
      return { success: false };
    }
  },

  /**
   * Triggers new message email (throttled) + in-app notification.
   */
  async triggerNewMessageEmail(params: {
    receiverId: string;
    receiverEmail: string;
    senderId: string;
    senderName: string;
    messageSnippet: string;
    actionUrl?: string;
  }) {
    try {
      const res = await fetch('/api/email/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err) {
      console.warn('Failed to trigger message email:', err);
      return { success: false };
    }
  },

  /**
   * Triggers security alert email when new login is detected.
   */
  async triggerSecurityAlert(uid: string, email: string, browser?: string, location?: string) {
    try {
      const userAgent = browser || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Session');
      const timeStr = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
      const res = await fetch('/api/email/security-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          email,
          time: timeStr,
          browser: userAgent,
          location: location || 'Aba, Abia State, Nigeria'
        })
      });
      return await res.json();
    } catch (err) {
      console.warn('Failed to trigger security alert email:', err);
      return { success: false };
    }
  },

  /**
   * Triggers admin announcement to target audience.
   */
  async triggerAdminAnnouncement(params: {
    title: string;
    message: string;
    targetAudience: 'all' | 'developers' | 'employers' | 'profession';
    targetProfession?: string;
    sentBy?: string;
  }) {
    try {
      const res = await fetch('/api/email/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err) {
      console.warn('Failed to send admin announcement:', err);
      return { success: false };
    }
  },

  /**
   * Fetches user in-app notifications.
   */
  async fetchUserNotifications(uid: string): Promise<InAppNotification[]> {
    try {
      const res = await fetch(`/api/email/notifications/user/${uid}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.notifications) ? data.notifications : [];
    } catch (err) {
      console.warn('Failed to fetch user notifications:', err);
      return [];
    }
  },

  /**
   * Marks notification as read.
   */
  async markNotificationAsRead(notifId?: string, uid?: string) {
    try {
      await fetch('/api/email/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId, uid })
      });
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  },

  /**
   * Fetches user email preferences.
   */
  async fetchUserEmailPreferences(uid: string): Promise<EmailPreferences> {
    const defaults: EmailPreferences = {
      weeklyEmails: true,
      securityAlerts: true,
      collaborationEmails: true,
      marketingEmails: true
    };
    try {
      const res = await fetch(`/api/email/preferences/${uid}`);
      const data = await res.json();
      return data.preferences || defaults;
    } catch (err) {
      console.warn('Failed to fetch user email preferences:', err);
      return defaults;
    }
  },

  /**
   * Saves user email preferences.
   */
  async saveUserEmailPreferences(uid: string, preferences: EmailPreferences) {
    try {
      const res = await fetch(`/api/email/preferences/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      return await res.json();
    } catch (err) {
      console.warn('Failed to save user email preferences:', err);
      return { success: false };
    }
  },

  /**
   * Fetches email analytics for Admin dashboard.
   */
  async fetchEmailAnalytics(): Promise<EmailAnalytics & { recentLogs: any[] }> {
    const fallback = {
      emailsSent: 0,
      emailsFailed: 0,
      weeklySends: 0,
      openRatePlaceholder: '98.4%',
      recentLogs: []
    };
    try {
      const res = await fetch('/api/email/analytics');
      if (!res.ok) return fallback;
      const data = await res.json();
      return {
        emailsSent: data.emailsSent ?? 0,
        emailsFailed: data.emailsFailed ?? 0,
        weeklySends: data.weeklySends ?? 0,
        openRatePlaceholder: data.openRatePlaceholder || '98.4%',
        recentLogs: Array.isArray(data.recentLogs) ? data.recentLogs : []
      };
    } catch (err) {
      console.warn('Failed to fetch email analytics:', err);
      return fallback;
    }
  }
};
