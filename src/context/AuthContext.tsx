import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChanged, firebaseSignOut } from '../lib/firebase';
import { dbService } from '../lib/firebaseService';
import { notificationService } from '../services/notificationService';
import { authLogger } from '../utils/authLogger';
import { Developer, Employer } from '../types';

export interface UserDoc {
  uid: string;
  email: string;
  role: 'developer' | 'employer';
  accountType?: 'developer' | 'employer';
  name?: string;
  photoURL?: string | null;
  profileImageUrl?: string | null;
  profileCompleted?: boolean;
  createdAt?: string;
}

export interface AuthMismatchInfo {
  message: string;
  userRole: 'developer' | 'employer';
  requestedRole: 'developer' | 'employer';
}

export interface GoogleNewUserInfo {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  firebaseUser: User | null;
  userDoc: UserDoc | null;
  role: 'developer' | 'employer' | null;
  developerProfile: Developer | null;
  employerProfile: Employer | null;
  loading: boolean;
  authMismatch: AuthMismatchInfo | null;
  googleNewUserPending: GoogleNewUserInfo | null;
  completeGoogleRegistration: (selectedRole: 'developer' | 'employer') => Promise<void>;
  setAuthMismatch: (mismatch: AuthMismatchInfo | null) => void;
  clearMismatch: () => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [role, setRole] = useState<'developer' | 'employer' | null>(null);
  const [developerProfile, setDeveloperProfile] = useState<Developer | null>(null);
  const [employerProfile, setEmployerProfile] = useState<Employer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authMismatch, setAuthMismatch] = useState<AuthMismatchInfo | null>(null);
  const [googleNewUserPending, setGoogleNewUserPending] = useState<GoogleNewUserInfo | null>(null);

  const fetchAndSyncUserData = async (fUser: User) => {
    const uid = fUser.uid;
    const email = fUser.email || '';
    authLogger.info(`[AUTH FLOW Step 1] Firebase Auth Verified. UID: ${uid}, Email: ${email}`);

    authLogger.info(`[AUTH FLOW Step 2] Fetching single source of truth /users/${uid} from Firestore...`);
    const fetchedDoc = await dbService.getUserDoc(uid, email);

    if (fetchedDoc && (fetchedDoc.role || fetchedDoc.accountType)) {
      const canonicalRole: 'developer' | 'employer' = (fetchedDoc.role || fetchedDoc.accountType) as any;
      authLogger.success(`[AUTH FLOW Step 3] Firestore user document located. Stored immutable role: ${canonicalRole}`);

      setRole(canonicalRole);
      setUserDoc({
        uid,
        email,
        role: canonicalRole,
        accountType: canonicalRole,
        name: fetchedDoc.name || fUser.displayName || email.split('@')[0],
        photoURL: fetchedDoc.photoURL || fUser.photoURL || null,
        profileImageUrl: fetchedDoc.profileImageUrl || fUser.photoURL || null,
        profileCompleted: fetchedDoc.profileCompleted ?? true,
        createdAt: fetchedDoc.createdAt
      });

      // Load matching profile ONLY
      if (canonicalRole === 'developer') {
        authLogger.info(`[AUTH FLOW Step 4] Loading matching Developer profile for UID ${uid}...`);
        const devProf = await dbService.getDeveloperProfile(uid, email);
        setDeveloperProfile(devProf);
        setEmployerProfile(null);
        authLogger.success(`[AUTH FLOW Step 5] Developer Dashboard ready for ${email}`);
      } else {
        authLogger.info(`[AUTH FLOW Step 4] Loading matching Employer profile for UID ${uid}...`);
        const empProf = await dbService.getEmployerProfile(uid, email);
        setEmployerProfile(empProf);
        setDeveloperProfile(null);
        authLogger.success(`[AUTH FLOW Step 5] Employer Dashboard ready for ${email}`);
      }
      setGoogleNewUserPending(null);
    } else {
      // User document does NOT exist in /users/{uid}
      authLogger.warn(`[AUTH FLOW Notice] No /users/${uid} document found in Firestore.`);
      
      const isGoogle = fUser.providerData.some(p => p.providerId === 'google.com');
      if (isGoogle) {
        authLogger.info(`[AUTH FLOW Google Sign-In] First-time Google user detected. Triggering mandatory role selection screen.`);
        setGoogleNewUserPending({
          uid,
          email,
          displayName: fUser.displayName || '',
          photoURL: fUser.photoURL || ''
        });
      } else {
        authLogger.warn(`[AUTH FLOW Notice] Unregistered user without role in Firestore.`);
      }

      setRole(null);
      setUserDoc(null);
      setDeveloperProfile(null);
      setEmployerProfile(null);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setLoading(true);
      if (fUser) {
        setFirebaseUser(fUser);
        try {
          await fetchAndSyncUserData(fUser);
        } catch (err) {
          authLogger.error(`[AUTH FLOW Error] Failed during user data sync:`, err);
        }
      } else {
        authLogger.info(`[AUTH FLOW Logout/Unauthenticated] Clearing auth context.`);
        setFirebaseUser(null);
        setUserDoc(null);
        setRole(null);
        setDeveloperProfile(null);
        setEmployerProfile(null);
        setGoogleNewUserPending(null);
        setAuthMismatch(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const completeGoogleRegistration = async (selectedRole: 'developer' | 'employer') => {
    if (!firebaseUser && !googleNewUserPending) {
      throw new Error("No pending Google user session to register.");
    }

    const uid = googleNewUserPending?.uid || firebaseUser?.uid || '';
    const email = googleNewUserPending?.email || firebaseUser?.email || '';
    const name = googleNewUserPending?.displayName || firebaseUser?.displayName || email.split('@')[0];

    authLogger.info(`[AUTH FLOW Google Registration] Assigning permanent role: ${selectedRole} for UID ${uid}`);

    setLoading(true);
    try {
      if (selectedRole === 'developer') {
        const devProf = await dbService.createDefaultDeveloperProfile(uid, email, name);
        setDeveloperProfile(devProf);
        setEmployerProfile(null);
      } else {
        const empProf = await dbService.createDefaultEmployerProfile(uid, email, name);
        setEmployerProfile(empProf);
        setDeveloperProfile(null);
      }

      setRole(selectedRole);
      setUserDoc({
        uid,
        email,
        role: selectedRole,
        accountType: selectedRole,
        name,
        photoURL: googleNewUserPending?.photoURL || null,
        profileImageUrl: googleNewUserPending?.photoURL || null,
        profileCompleted: true,
        createdAt: new Date().toISOString()
      });

      setGoogleNewUserPending(null);

      // Trigger welcome email
      await notificationService.triggerWelcomeEmail(uid, email, name, selectedRole).catch(e => {
        authLogger.warn("Welcome email dispatch notice:", e);
      });

      authLogger.success(`[AUTH FLOW Google Registration Complete] Successfully created ${selectedRole} account for ${email}.`);
    } catch (err: any) {
      authLogger.error(`[AUTH FLOW Google Registration Failed]`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearMismatch = () => setAuthMismatch(null);

  const logout = async () => {
    authLogger.info(`[AUTH FLOW Logout] User requested logout.`);
    setLoading(true);
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      authLogger.error(`[AUTH FLOW Logout Error]`, e);
    } finally {
      setFirebaseUser(null);
      setUserDoc(null);
      setRole(null);
      setDeveloperProfile(null);
      setEmployerProfile(null);
      setGoogleNewUserPending(null);
      setAuthMismatch(null);
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    if (firebaseUser) {
      setLoading(true);
      await fetchAndSyncUserData(firebaseUser);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userDoc,
        role,
        developerProfile,
        employerProfile,
        loading,
        authMismatch,
        googleNewUserPending,
        completeGoogleRegistration,
        setAuthMismatch,
        clearMismatch,
        logout,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
