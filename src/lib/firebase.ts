import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable
} from 'firebase/storage';

import appletConfig from '../../firebase-applet-config.json';

// Define Firebase Configuration using VITE_ prefix environment variables or applet config
const firebaseConfig = {
  apiKey: appletConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: appletConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: appletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: appletConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: appletConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: appletConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: (appletConfig as Record<string, string>).firestoreDatabaseId || '(default)',
};

// Check if all essential keys are provided
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  } catch (appErr) {
    console.error("Failed to initialize Firebase App:", appErr);
  }

  if (app) {
    try {
      auth = getAuth(app);
    } catch (authErr) {
      console.warn("Failed to initialize Firebase Auth:", authErr);
    }

    try {
      const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
        ? firebaseConfig.firestoreDatabaseId
        : undefined;
      db = dbId ? getFirestore(app, dbId) : getFirestore(app);
      
      if (db) {
        enableIndexedDbPersistence(db).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open');
          } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence is not supported by this browser');
          }
        });
      }
    } catch (dbErr) {
      console.warn("Failed to initialize Firestore:", dbErr);
    }

    try {
      storage = getStorage(app);
    } catch (storageErr) {
      console.warn("Failed to initialize Firebase Storage:", storageErr);
    }

    console.log("Firebase Auth, Firestore, and Storage initialization complete.");
  }
} else {
  console.warn(
    "Firebase keys are not configured in your environment variables. " +
    "SureDev is falling back to Secure Local Client-Side Authentication and local storage."
  );
}

export { 
  auth, 
  db,
  storage,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  // Firestore
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  // Storage
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable
};
export type { FirebaseUser };

