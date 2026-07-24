/**
 * SureDev Firebase Cloud Functions Triggers
 * Cloud Functions for background events and scheduled triggers using Firebase Admin SDK.
 */

import { db as adminDb } from '../firebaseAdmin';
import {
  sendWelcomeEmail,
  sendCollabRequestEmail,
  sendNewMessageEmail,
  sendAdminAnnouncement,
  sendWeeklyUpdateDigest
} from '../services/emailService';

/**
 * 1. Cloud Function Trigger: On New User Created
 */
export async function onUserCreated(user: { uid: string; email: string; displayName?: string }) {
  console.log(`[CLOUD FUNCTION: onUserCreated] Triggered for ${user.uid} (${user.email})`);
  return await sendWelcomeEmail({
    uid: user.uid,
    email: user.email,
    name: user.displayName
  });
}

/**
 * 2. Cloud Function Trigger: On Collaboration Request Created
 */
export async function onCollaborationCreated(collabData: {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
}) {
  console.log(`[CLOUD FUNCTION: onCollaborationCreated] Triggered for collab ${collabData.id}`);
  if (!adminDb) return;

  try {
    const senderDoc = await adminDb.collection('users').doc(collabData.senderId).get();
    const receiverDoc = await adminDb.collection('users').doc(collabData.receiverId).get();

    const senderName = senderDoc.exists ? (senderDoc.data()?.name || 'A Developer') : 'A Developer';
    const receiverEmail = receiverDoc.exists ? receiverDoc.data()?.email : null;

    if (receiverEmail) {
      return await sendCollabRequestEmail({
        receiverId: collabData.receiverId,
        receiverEmail,
        senderId: collabData.senderId,
        senderName,
        message: collabData.message
      });
    }
  } catch (err) {
    console.error('Error in onCollaborationCreated Cloud Function:', err);
  }
}

/**
 * 3. Cloud Function Trigger: On Private Message Created
 */
export async function onMessageCreated(msgData: {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
}) {
  console.log(`[CLOUD FUNCTION: onMessageCreated] Triggered for message ${msgData.id}`);
  if (!adminDb) return;

  try {
    const senderDoc = await adminDb.collection('users').doc(msgData.senderId).get();
    const receiverDoc = await adminDb.collection('users').doc(msgData.receiverId).get();

    const senderName = senderDoc.exists ? (senderDoc.data()?.name || 'A User') : 'A User';
    const receiverEmail = receiverDoc.exists ? receiverDoc.data()?.email : null;

    if (receiverEmail) {
      return await sendNewMessageEmail({
        receiverId: msgData.receiverId,
        receiverEmail,
        senderId: msgData.senderId,
        senderName,
        messageSnippet: msgData.text
      });
    }
  } catch (err) {
    console.error('Error in onMessageCreated Cloud Function:', err);
  }
}

/**
 * 4. Cloud Function Trigger: On Admin Announcement Created
 */
export async function onAnnouncementCreated(annData: {
  title: string;
  message: string;
  targetAudience: 'all' | 'developers' | 'employers' | 'profession';
  targetProfession?: string;
  sentBy?: string;
}) {
  console.log(`[CLOUD FUNCTION: onAnnouncementCreated] Triggered for "${annData.title}"`);
  return await sendAdminAnnouncement(annData);
}

/**
 * 5. Scheduled Cloud Function: Weekly Ecosystem Email
 */
export async function scheduledWeeklyEmail() {
  console.log('[CLOUD FUNCTION: scheduledWeeklyEmail] Triggered scheduled weekly email digest dispatch.');
  return await sendWeeklyUpdateDigest();
}
