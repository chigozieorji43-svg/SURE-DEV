/**
 * SureDev Email Service (Resend Integration & Firestore Notification Center)
 * Implements idempotent, preference-aware email dispatches and in-app notifications.
 */

import { Resend } from 'resend';
import { db as adminDb } from '../firebaseAdmin';
import {
  welcomeEmailTemplate,
  verificationEmailTemplate,
  passwordResetTemplate,
  collabRequestTemplate,
  newMessageTemplate,
  weeklyUpdateTemplate,
  announcementTemplate,
  securityAlertTemplate
} from '../emails/templates';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      resendClient = new Resend(apiKey);
    }
  }
  return resendClient;
}

// In-memory throttle map for message emails (5-minute throttle per recipient)
const messageEmailThrottles = new Map<string, number>();

// In-memory fallback stores (for when Firestore Admin SDK database is unprovisioned or unavailable)
const inMemoryNotifications: any[] = [];
const inMemoryEmailLogs: any[] = [];
const inMemoryPreferences = new Map<string, any>();

/**
 * Creates an in-app notification document in Firestore `notifications` collection and in-memory fallback.
 */
export async function createInAppNotification(params: {
  receiverId: string;
  senderId?: string;
  senderName?: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
}) {
  if (!params.receiverId) return;

  const notifId = 'notif_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const notifData = {
    id: notifId,
    receiverId: params.receiverId,
    senderId: params.senderId || 'system',
    senderName: params.senderName || 'SureDev System',
    type: params.type,
    title: params.title,
    body: params.body,
    read: false,
    createdAt: new Date().toISOString(),
    ...(params.actionUrl ? { actionUrl: params.actionUrl } : {})
  };

  // Always append to in-memory store
  inMemoryNotifications.unshift(notifData);

  if (adminDb) {
    try {
      const notifRef = adminDb.collection('notifications').doc(notifId);
      await notifRef.set(notifData);
    } catch {
      // Quiet fallback to in-memory
    }
  }
}

/**
 * Logs email dispatch result in Firestore `emailLogs` collection and in-memory fallback.
 */
async function logEmailDispatch(params: {
  recipientEmail: string;
  recipientId?: string;
  emailType: string;
  subject: string;
  status: 'sent' | 'failed' | 'simulated';
  error?: string;
}) {
  const logData = {
    id: 'log_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
    recipientEmail: params.recipientEmail,
    recipientId: params.recipientId || null,
    emailType: params.emailType,
    subject: params.subject,
    status: params.status,
    error: params.error || null,
    sentAt: new Date().toISOString()
  };

  // Always append to in-memory store
  inMemoryEmailLogs.unshift(logData);

  if (adminDb) {
    try {
      const logRef = adminDb.collection('emailLogs').doc(logData.id);
      await logRef.set(logData);
    } catch {
      // Quiet fallback to in-memory
    }
  }
}

/**
 * Checks if user has opted in for specific email category in Firestore or in-memory.
 */
async function isUserOptedIn(uid: string | undefined, category: 'weeklyEmails' | 'securityAlerts' | 'collaborationEmails' | 'marketingEmails'): Promise<boolean> {
  if (!uid) return true;
  if (inMemoryPreferences.has(uid)) {
    const prefs = inMemoryPreferences.get(uid);
    if (prefs && typeof prefs[category] === 'boolean') {
      return prefs[category];
    }
  }
  if (adminDb) {
    try {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        const prefs = data?.emailPreferences;
        if (prefs && typeof prefs[category] === 'boolean') {
          return prefs[category];
        }
      }
    } catch {
      // Fallback default
    }
  }
  return true;
}

/**
 * Get user notifications from Firestore or in-memory store.
 */
export async function getUserNotifications(uid: string): Promise<any[]> {
  if (!uid) return [];
  if (adminDb) {
    try {
      const snap = await adminDb.collection('notifications')
        .where('receiverId', '==', uid)
        .get();
      if (!snap.empty) {
        const docs = snap.docs.map(doc => doc.data());
        docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return docs;
      }
    } catch {
      // Fallback to in-memory store
    }
  }
  return inMemoryNotifications
    .filter(n => n.receiverId === uid)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Mark notifications as read.
 */
export async function markUserNotificationsRead(notifId?: string, uid?: string): Promise<void> {
  if (notifId) {
    const target = inMemoryNotifications.find(n => n.id === notifId);
    if (target) target.read = true;
  } else if (uid) {
    inMemoryNotifications.forEach(n => {
      if (n.receiverId === uid) n.read = true;
    });
  }

  if (adminDb) {
    try {
      if (notifId) {
        await adminDb.collection('notifications').doc(notifId).update({ read: true });
      } else if (uid) {
        const snap = await adminDb.collection('notifications').where('receiverId', '==', uid).get();
        const batch = adminDb.batch();
        snap.docs.forEach(doc => batch.update(doc.ref, { read: true }));
        await batch.commit();
      }
    } catch {
      // Quiet fallback
    }
  }
}

/**
 * Get aggregated email analytics.
 */
export async function getEmailAnalytics(): Promise<any> {
  let logs = [...inMemoryEmailLogs];
  if (adminDb) {
    try {
      const snap = await adminDb.collection('emailLogs').get();
      if (!snap.empty) {
        const dbLogs = snap.docs.map(doc => doc.data());
        // Merge without duplicates
        const logIds = new Set(logs.map(l => l.id));
        dbLogs.forEach(d => {
          if (!logIds.has(d.id)) logs.push(d);
        });
      }
    } catch {
      // Fallback to in-memory logs
    }
  }

  let sentCount = 0;
  let failedCount = 0;
  let weeklyCount = 0;

  logs.forEach(data => {
    if (data.status === 'sent' || data.status === 'simulated') {
      sentCount++;
    } else if (data.status === 'failed') {
      failedCount++;
    }
    if (data.emailType === 'weekly_digest') {
      weeklyCount++;
    }
  });

  logs.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());

  return {
    emailsSent: sentCount,
    emailsFailed: failedCount,
    weeklySends: weeklyCount,
    openRatePlaceholder: '98.4%',
    recentLogs: logs.slice(0, 100)
  };
}

/**
 * Get user email preferences.
 */
export async function getUserPreferences(uid: string): Promise<any> {
  const defaultPrefs = {
    weeklyEmails: true,
    securityAlerts: true,
    collaborationEmails: true,
    marketingEmails: true
  };
  if (!uid) return defaultPrefs;

  if (inMemoryPreferences.has(uid)) {
    return { ...defaultPrefs, ...inMemoryPreferences.get(uid) };
  }

  if (adminDb) {
    try {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (userDoc.exists && userDoc.data()?.emailPreferences) {
        const saved = userDoc.data()?.emailPreferences;
        inMemoryPreferences.set(uid, saved);
        return { ...defaultPrefs, ...saved };
      }
    } catch {
      // Fallback
    }
  }

  return defaultPrefs;
}

/**
 * Save user email preferences.
 */
export async function saveUserPreferences(uid: string, preferences: any): Promise<void> {
  if (!uid) return;
  inMemoryPreferences.set(uid, preferences);

  if (adminDb) {
    try {
      await adminDb.collection('users').doc(uid).set({
        emailPreferences: preferences,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch {
      // Quiet fallback
    }
  }
}

/**
 * Core send mail helper using Resend or fallback simulation mode.
 */
async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
  emailType: string;
  recipientId?: string;
}): Promise<{ success: boolean; mode: 'resend' | 'simulated'; error?: string }> {
  const client = getResendClient();
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'SureDev Notifications <notifications@suredev.ng>';

  if (client) {
    try {
      const result = await client.emails.send({
        from: fromAddress,
        to: [params.to],
        subject: params.subject,
        html: params.html
      });

      if (result.error) {
        console.error('[RESEND ERROR]', result.error);
        await logEmailDispatch({
          recipientEmail: params.to,
          recipientId: params.recipientId,
          emailType: params.emailType,
          subject: params.subject,
          status: 'failed',
          error: result.error.message
        });
        return { success: false, mode: 'resend', error: result.error.message };
      }

      console.log(`[RESEND SUCCESS] Sent ${params.emailType} email to ${params.to}`);
      await logEmailDispatch({
        recipientEmail: params.to,
        recipientId: params.recipientId,
        emailType: params.emailType,
        subject: params.subject,
        status: 'sent'
      });
      return { success: true, mode: 'resend' };
    } catch (err: any) {
      console.error('[RESEND EXCEPTION]', err);
      await logEmailDispatch({
        recipientEmail: params.to,
        recipientId: params.recipientId,
        emailType: params.emailType,
        subject: params.subject,
        status: 'failed',
        error: err.message
      });
      return { success: false, mode: 'resend', error: err.message };
    }
  } else {
    // Simulation mode when RESEND_API_KEY is not supplied
    console.log(`[EMAIL SERVICE SIMULATION] Dispatched ${params.emailType} to ${params.to} | Subject: "${params.subject}"`);
    await logEmailDispatch({
      recipientEmail: params.to,
      recipientId: params.recipientId,
      emailType: params.emailType,
      subject: params.subject,
      status: 'simulated'
    });
    return { success: true, mode: 'simulated' };
  }
}

// ==========================================
// SPECIFIC EMAIL IMPLEMENTATIONS
// ==========================================

/**
 * 1. WELCOME EMAIL
 * Sent strictly ONCE after a new user registers.
 */
export async function sendWelcomeEmail(params: {
  uid: string;
  email: string;
  name?: string;
  userType?: 'developer' | 'employer';
}) {
  if (!params.email || !params.uid) return { success: false, error: 'Missing uid or email' };

  // Check if welcome email was already sent
  if (adminDb) {
    try {
      const userRef = adminDb.collection('users').doc(params.uid);
      const docSnap = await userRef.get();
      if (docSnap.exists && docSnap.data()?.welcomeEmailSent === true) {
        console.log(`[WELCOME EMAIL SKIPPED] User ${params.uid} already received welcome email.`);
        return { success: true, skipped: true, message: 'Welcome email already sent.' };
      }
    } catch (err) {
      console.warn('Error checking welcomeEmailSent flag:', err);
    }
  }

  const subject = 'Welcome to SureDev 🚀';
  const html = welcomeEmailTemplate(params.name || '', params.userType || 'developer');

  const dispatchResult = await dispatchEmail({
    to: params.email,
    subject,
    html,
    emailType: 'welcome',
    recipientId: params.uid
  });

  // Mark welcomeEmailSent = true in Firestore
  if (adminDb) {
    try {
      await adminDb.collection('users').doc(params.uid).set({
        welcomeEmailSent: true,
        welcomeEmailSentAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Failed to mark welcomeEmailSent flag in Firestore:', err);
    }
  }

  // Create In-App Notification
  await createInAppNotification({
    receiverId: params.uid,
    type: 'welcome',
    title: 'Welcome to SureDev! 🚀',
    body: 'Complete your profile under My Credentials to start showcasing your skills to the ecosystem.',
    actionUrl: '/dashboard'
  });

  return dispatchResult;
}

/**
 * 2. EMAIL VERIFICATION
 */
export async function sendVerificationEmail(params: {
  uid: string;
  email: string;
  name?: string;
  actionUrl?: string;
}) {
  const subject = 'Verify Your SureDev Account ✉️';
  const html = verificationEmailTemplate(params.name || '', params.actionUrl || '');

  const result = await dispatchEmail({
    to: params.email,
    subject,
    html,
    emailType: 'verification',
    recipientId: params.uid
  });

  await createInAppNotification({
    receiverId: params.uid,
    type: 'verification',
    title: 'Email Verification Sent',
    body: 'Please check your email inbox to complete account verification.',
    actionUrl: '/settings'
  });

  return result;
}

/**
 * 3. PASSWORD RESET EMAIL
 */
export async function sendPasswordResetNotification(params: {
  uid?: string;
  email: string;
  name?: string;
  resetUrl: string;
}) {
  const subject = 'Reset Your SureDev Password 🔐';
  const html = passwordResetTemplate(params.name || '', params.resetUrl);

  return await dispatchEmail({
    to: params.email,
    subject,
    html,
    emailType: 'password_reset',
    recipientId: params.uid
  });
}

/**
 * 4. COLLABORATION REQUEST EMAIL
 */
export async function sendCollabRequestEmail(params: {
  receiverId: string;
  receiverEmail: string;
  senderId: string;
  senderName: string;
  projectTitle?: string;
  message?: string;
  actionUrl?: string;
}) {
  // Check preference
  const optedIn = await isUserOptedIn(params.receiverId, 'collaborationEmails');
  
  // Create In-App Notification regardless
  await createInAppNotification({
    receiverId: params.receiverId,
    senderId: params.senderId,
    senderName: params.senderName,
    type: 'collab_request',
    title: 'New Collaboration Request 🤝',
    body: `${params.senderName} sent you a collaboration request: "${params.message || 'Let\'s partner up on SureDev!'}"`,
    actionUrl: params.actionUrl || '/dashboard'
  });

  if (!optedIn) {
    console.log(`[COLLAB EMAIL SKIPPED] User ${params.receiverId} opted out of collaboration emails.`);
    return { success: true, skipped: true };
  }

  const subject = 'You have a new collaboration request 🤝';
  const html = collabRequestTemplate({
    senderName: params.senderName,
    projectTitle: params.projectTitle,
    message: params.message,
    actionUrl: params.actionUrl
  });

  return await dispatchEmail({
    to: params.receiverEmail,
    subject,
    html,
    emailType: 'collab_request',
    recipientId: params.receiverId
  });
}

/**
 * 5. NEW MESSAGE EMAIL (5-Minute Throttle)
 */
export async function sendNewMessageEmail(params: {
  receiverId: string;
  receiverEmail: string;
  senderId: string;
  senderName: string;
  messageSnippet: string;
  actionUrl?: string;
}) {
  // Always create In-App Notification
  await createInAppNotification({
    receiverId: params.receiverId,
    senderId: params.senderId,
    senderName: params.senderName,
    type: 'message',
    title: `Message from ${params.senderName} 💬`,
    body: params.messageSnippet,
    actionUrl: params.actionUrl || '/dashboard'
  });

  // Throttle check: max 1 email per 5 minutes per receiver
  const now = Date.now();
  const lastSent = messageEmailThrottles.get(params.receiverId) || 0;
  if (now - lastSent < 5 * 60 * 1000) {
    console.log(`[MESSAGE EMAIL THROTTLED] Suppressed email for ${params.receiverId} (last email sent < 5m ago).`);
    return { success: true, throttled: true, message: 'Email notification throttled to prevent spam.' };
  }

  // Check user preference
  const optedIn = await isUserOptedIn(params.receiverId, 'collaborationEmails');
  if (!optedIn) {
    return { success: true, skipped: true };
  }

  messageEmailThrottles.set(params.receiverId, now);

  const subject = `New message from ${params.senderName} 💬`;
  const html = newMessageTemplate({
    senderName: params.senderName,
    messageSnippet: params.messageSnippet,
    actionUrl: params.actionUrl
  });

  return await dispatchEmail({
    to: params.receiverEmail,
    subject,
    html,
    emailType: 'new_message',
    recipientId: params.receiverId
  });
}

/**
 * 6. WEEKLY UPDATE DIGEST (Scheduled)
 */
export async function sendWeeklyUpdateDigest() {
  if (!adminDb) return { success: false, error: 'Database uninitialized' };

  try {
    const usersSnap = await adminDb.collection('users').get();
    let sentCount = 0;

    const html = weeklyUpdateTemplate({});

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      if (user.email) {
        const optedIn = await isUserOptedIn(doc.id, 'weeklyEmails');
        if (optedIn) {
          await dispatchEmail({
            to: user.email,
            subject: 'SureDev Weekly Ecosystem Digest ⚡',
            html,
            emailType: 'weekly_digest',
            recipientId: doc.id
          });

          await createInAppNotification({
            receiverId: doc.id,
            type: 'weekly_update',
            title: 'SureDev Weekly Update Released ⚡',
            body: 'Check out the featured developers and trending skills across Abia State this week.',
            actionUrl: '/directory'
          });

          sentCount++;
        }
      }
    }

    return { success: true, recipientCount: sentCount };
  } catch (err: any) {
    console.error('Error dispatching weekly update digest:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 7. ADMIN ANNOUNCEMENT
 */
export async function sendAdminAnnouncement(params: {
  title: string;
  message: string;
  targetAudience: 'all' | 'developers' | 'employers' | 'profession';
  targetProfession?: string;
  sentBy?: string;
}) {
  if (!adminDb) return { success: false, error: 'Database uninitialized' };

  try {
    const usersSnap = await adminDb.collection('users').get();
    let recipientCount = 0;

    const html = announcementTemplate({
      title: params.title,
      message: params.message,
      senderName: params.sentBy || 'SureDev Administration'
    });

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      const accountType = user.accountType || 'developer';

      let shouldSend = false;
      if (params.targetAudience === 'all') {
        shouldSend = true;
      } else if (params.targetAudience === 'developers' && accountType === 'developer') {
        shouldSend = true;
      } else if (params.targetAudience === 'employers' && accountType === 'employer') {
        shouldSend = true;
      } else if (params.targetAudience === 'profession' && params.targetProfession) {
        // Check developer profile profession/title
        const devDoc = await adminDb.collection('developers').doc(doc.id).get();
        if (devDoc.exists) {
          const devTitle = (devDoc.data()?.title || '').toLowerCase();
          if (devTitle.includes(params.targetProfession.toLowerCase())) {
            shouldSend = true;
          }
        }
      }

      if (shouldSend && user.email) {
        const optedIn = await isUserOptedIn(doc.id, 'marketingEmails');
        if (optedIn) {
          await dispatchEmail({
            to: user.email,
            subject: `📢 ${params.title}`,
            html,
            emailType: 'announcement',
            recipientId: doc.id
          });

          await createInAppNotification({
            receiverId: doc.id,
            type: 'announcement',
            title: `📢 ${params.title}`,
            body: params.message.substring(0, 120) + (params.message.length > 120 ? '...' : ''),
            actionUrl: '/dashboard'
          });

          recipientCount++;
        }
      }
    }

    // Record announcement in Firestore collection `announcements`
    const annRef = adminDb.collection('announcements').doc();
    await annRef.set({
      id: annRef.id,
      title: params.title,
      message: params.message,
      targetAudience: params.targetAudience,
      targetProfession: params.targetProfession || null,
      sentBy: params.sentBy || 'SureDev Administration',
      createdAt: new Date().toISOString(),
      recipientCount
    });

    return { success: true, recipientCount };
  } catch (err: any) {
    console.error('Error dispatching admin announcement:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 8. SECURITY ALERT EMAIL
 */
export async function sendSecurityAlertEmail(params: {
  uid: string;
  email: string;
  time: string;
  browser: string;
  location?: string;
  ip?: string;
}) {
  const optedIn = await isUserOptedIn(params.uid, 'securityAlerts');

  await createInAppNotification({
    receiverId: params.uid,
    type: 'security_alert',
    title: '🛡️ New Login Detected',
    body: `A new login occurred on ${params.browser} at ${params.time}.`,
    actionUrl: '/settings'
  });

  if (!optedIn) {
    return { success: true, skipped: true };
  }

  const subject = '🛡️ New Login Detected on SureDev';
  const html = securityAlertTemplate({
    time: params.time,
    browser: params.browser,
    location: params.location,
    ip: params.ip
  });

  return await dispatchEmail({
    to: params.email,
    subject,
    html,
    emailType: 'security_alert',
    recipientId: params.uid
  });
}
