import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let isAdminAvailable = false;

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

if (projectId) {
  try {
    if (getApps().length === 0) {
      app = initializeApp({
        projectId: projectId,
      });
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    auth = getAuth(app);
    isAdminAvailable = true;
    console.log(`Firebase Admin initialized successfully for project: ${projectId}`);
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin SDK. Falling back to client-side structure.", err);
  }
} else {
  console.warn("No VITE_FIREBASE_PROJECT_ID found in environment variables. Server-side Firebase Admin is unavailable.");
}

export { db, auth, isAdminAvailable };
