import {
  auth,
  db,
  storage,
  isFirebaseConfigured,
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
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from './firebase';
import { 
  Developer, Employer, CollabRequest, Project, ManagedProject, ProjectStatus, 
  ProjectTimelineEvent, Review, Complaint, ComplaintReason, ComplaintStatus, 
  TimelineEventType, ContractMessage, ContractFile, ContractMilestone, 
  ContractDeliverable, KanbanTask, ContractMeeting, ContractChangeRequest, 
  ContractDispute, ExtendedReview, WorkspacePresence, PresenceStatus, ActiveActionType,
  WorkspaceBookmark, WorkspaceFavorite, RecentItem, AutosaveDraft, WorkspaceAccessLog,
  ProjectPost, ProjectApplication, ApplicationStatus
} from '../types';
import { DEVELOPERS, EMPLOYERS } from '../data';

export function handleFirestoreError(error: any, operationName: string): string {
  console.error(`Firestore error during ${operationName}:`, error);
  if (error?.code === 'permission-denied') {
    return 'Permission denied: Only authenticated employers can post projects.';
  }
  if (error?.code === 'unauthenticated') {
    return 'Authentication required: Please log in as an employer to post a project.';
  }
  return error?.message || `Failed to ${operationName}. Please try again.`;
}

// ==========================================
// 1. IMAGE COMPRESSION UTILITY & HELPER TIMEOUTS
// ==========================================
function uploadWithTimeout<T>(promise: Promise<T>, timeoutMs = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Storage operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(file);
    }, 2500);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        clearTimeout(timer);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(file);
      };
    };
    reader.onerror = () => {
      clearTimeout(timer);
      resolve(file);
    };
  });
}

// Helper function to convert blob to base64 Data URL
async function blobToBase64(blob: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ==========================================
// 2. STORAGE MANAGEMENT
// ==========================================
export async function uploadFileToStorage(
  file: File,
  path: string,
  _oldFileUrl?: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (onProgress) onProgress(15);
  let uploadData: Blob | File = file;
  if (file.type.startsWith('image/')) {
    try {
      uploadData = await compressImage(file, 1200, 1200, 0.82);
      if (onProgress) onProgress(45);
    } catch (e) {
      console.warn('Image compression failed, using original file', e);
    }
  }

  if (storage) {
    try {
      const uniqueName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fileRef = ref(storage, `${path}/${uniqueName}`);
      if (onProgress) onProgress(75);
      await uploadWithTimeout(uploadBytes(fileRef, uploadData), 3500);
      const downloadUrl = await uploadWithTimeout(getDownloadURL(fileRef), 3500);
      if (onProgress) onProgress(100);
      return downloadUrl;
    } catch (err) {
      console.warn('Firebase Storage upload timed out or failed, falling back to compressed Data URL in Firestore:', err);
    }
  }

  if (onProgress) onProgress(100);
  // Fallback: Convert to Base64 Data URL to save directly in Firestore
  return blobToBase64(uploadData);
}

async function syncProfileImageData(
  uid: string,
  downloadUrl: string,
  accountType: 'developer' | 'employer'
) {
  // Update Firebase Auth currentUser photoURL (source of truth for Auth)
  if (auth && auth.currentUser && auth.currentUser.uid === uid) {
    try {
      await updateProfile(auth.currentUser, { photoURL: downloadUrl });
      console.log("Updated Firebase Auth currentUser photoURL successfully.");
    } catch (authErr) {
      console.warn("Failed to update Firebase Auth profile photoURL:", authErr);
    }
  }

  // Update Firestore database collections
  if (db) {
    try {
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        ownerId: uid,
        photoURL: downloadUrl,
        profileImageUrl: downloadUrl,
        hasCustomProfileImage: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (accountType === 'developer') {
        const devDocRef = doc(db, 'developers', uid);
        await setDoc(devDocRef, {
          ownerId: uid,
          avatar: downloadUrl,
          profileImageUrl: downloadUrl,
          photoURL: downloadUrl,
          hasCustomProfileImage: true,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        const empDocRef = doc(db, 'employers', uid);
        await setDoc(empDocRef, {
          ownerId: uid,
          companyLogo: downloadUrl,
          profileImageUrl: downloadUrl,
          photoURL: downloadUrl,
          hasCustomProfileImage: true,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      try {
        const targetCol = accountType === 'developer' ? 'developers' : 'employers';
        const docSnap = await getDoc(doc(db, targetCol, uid));
        if (docSnap.exists()) {
          console.log(`Exact Firestore document (${targetCol}/${uid}) after update:`, docSnap.data());
        }
      } catch (logErr) {
        console.warn("Could not read back Firestore document for logging:", logErr);
      }
    } catch (dbErr) {
      console.warn("Firestore sync failed for profile image:", dbErr);
    }
  }

  // Update local memory state & caches for immediate non-refresh UI update
  if (accountType === 'developer') {
    const profile = safeLoad(`developer_profile_${uid}`, null);
    if (profile) {
      profile.avatar = downloadUrl;
      profile.profileImageUrl = downloadUrl;
      profile.photoURL = downloadUrl;
      profile.hasCustomProfileImage = true;
      safeSave(`developer_profile_${uid}`, profile);
    }
    const devs = safeLoad('suredev_developers', DEVELOPERS);
    const index = devs.findIndex((d: any) => d.id === uid);
    if (index !== -1) {
      devs[index] = { 
        ...devs[index], 
        avatar: downloadUrl, 
        profileImageUrl: downloadUrl, 
        photoURL: downloadUrl, 
        hasCustomProfileImage: true 
      };
      safeSave('suredev_developers', devs);
    }
  } else {
    const profile = safeLoad(`employer_profile_${uid}`, null);
    if (profile) {
      profile.companyLogo = downloadUrl;
      profile.profileImageUrl = downloadUrl;
      profile.photoURL = downloadUrl;
      profile.hasCustomProfileImage = true;
      safeSave(`employer_profile_${uid}`, profile);
    }
    const emps = safeLoad('suredev_employers', EMPLOYERS);
    const index = emps.findIndex((e: any) => e.id === uid);
    if (index !== -1) {
      emps[index] = { 
        ...emps[index], 
        companyLogo: downloadUrl, 
        profileImageUrl: downloadUrl, 
        photoURL: downloadUrl, 
        hasCustomProfileImage: true 
      };
      safeSave('suredev_employers', emps);
    }
  }

  const userDoc = safeLoad(`user_doc_${uid}`, null) || {};
  userDoc.photoURL = downloadUrl;
  userDoc.profileImageUrl = downloadUrl;
  userDoc.hasCustomProfileImage = true;
  userDoc.updatedAt = new Date().toISOString();
  safeSave(`user_doc_${uid}`, userDoc);
}

export async function uploadProfileImage(
  uid: string,
  file: File,
  accountType: 'developer' | 'employer',
  onProgress?: (progress: number) => void
): Promise<string> {
  // 1. Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Only JPG, JPEG, PNG, and WebP images are allowed.');
  }

  // 2. Validate maximum size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds the 5MB limit.');
  }

  // 3. Compress image before upload
  let uploadData: Blob | File = file;
  try {
    uploadData = await compressImage(file, 800, 800, 0.85);
  } catch (e) {
    console.warn('Image compression failed, using original file:', e);
  }

  // 4. Save image URL via Firebase Storage or compressed Data URL directly in Firestore
  try {
    let imageUrl: string = '';

    if (storage) {
      try {
        if (onProgress) onProgress(30);
        const fileName = `${uid}_${Date.now()}.jpg`;
        const imageRef = ref(storage, `profiles/${accountType}s/${fileName}`);
        
        if (onProgress) onProgress(60);
        await uploadWithTimeout(uploadBytes(imageRef, uploadData), 3500);
        imageUrl = await uploadWithTimeout(getDownloadURL(imageRef), 3500);
        if (onProgress) onProgress(90);
      } catch (storageErr) {
        console.warn('Firebase Storage upload failed, falling back to Firestore Data URL storage:', storageErr);
      }
    }

    if (!imageUrl) {
      if (onProgress) onProgress(50);
      imageUrl = await blobToBase64(uploadData);
      if (onProgress) onProgress(90);
    }

    console.log("Profile Image URL saved to Firestore/Firebase:", imageUrl.substring(0, 80) + "...");

    // 5. Save returned URL to Firestore, Auth profile photoURL, and local stores
    await syncProfileImageData(uid, imageUrl, accountType);
    if (onProgress) onProgress(100);

    return imageUrl;
  } catch (error: any) {
    console.error('Profile Image Upload Error:', error);
    throw new Error(error?.message || 'Failed to upload and save profile image to Firestore.');
  }
}

// Helper to create metadata structure required for every document
const withMetadata = (data: any, ownerId: string) => {
  return {
    ...data,
    ownerId,
    visibility: data.visibility || 'public',
    status: data.status || 'active',
    createdAt: data.createdAt || (db ? serverTimestamp() : new Date().toISOString()),
    updatedAt: db ? serverTimestamp() : new Date().toISOString(),
  };
};

const safeLoad = <T = any>(key: string, defaultVal: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const safeSave = (key: string, val: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    // ignore
  }
};

export function cleanPayload<T = any>(obj: T): T {
  if (obj === null || obj === undefined) return obj as any;
  if (Array.isArray(obj)) {
    return obj.map(cleanPayload).filter(item => item !== undefined) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanPayload(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// ==========================================
// 3. FIRESTORE DATABASE MUTATIONS & REALTIME QUERIES
// ==========================================

export const dbService = {
  // --- USER DOCS FOR ACCOUNT TYPES ---
  async getUserDoc(uid: string, providedEmail?: string) {
    let userDocData: any = null;
    const userEmail = (providedEmail || (auth?.currentUser?.uid === uid ? auth.currentUser.email : '') || '').trim().toLowerCase();

    if (db) {
      try {
        // 1. Direct UID Lookup on /users/{uid}
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          userDocData = snap.data();
          if (userDocData.role) {
            userDocData.accountType = userDocData.role;
          } else if (userDocData.accountType) {
            userDocData.role = userDocData.accountType;
          }
          if (userDocData.role || userDocData.accountType) {
            safeSave(`user_doc_${uid}`, userDocData);
            return userDocData;
          }
        }

        const targetEmail = userEmail || (userDocData?.email ? userDocData.email.toLowerCase().trim() : '');

        // 2. Comprehensive Email-based Matching across Firestore Collections
        if (targetEmail) {
          // Check employers collection by email
          const empQuery = query(collection(db, 'employers'), where('email', '==', targetEmail));
          const empSnap = await getDocs(empQuery);
          
          // Check developers collection by email
          const devQuery = query(collection(db, 'developers'), where('email', '==', targetEmail));
          const devSnap = await getDocs(devQuery);

          // Check users collection by email
          const usersQuery = query(collection(db, 'users'), where('email', '==', targetEmail));
          const usersSnap = await getDocs(usersQuery);

          // Priority A: Existing Employer profile match
          if (!empSnap.empty || (userDocData?.role === 'employer' && devSnap.empty)) {
            const empData = !empSnap.empty ? empSnap.docs[0].data() : null;
            const canonicalEmail = targetEmail || empData?.email || userDocData?.email || '';

            userDocData = {
              uid,
              role: 'employer',
              accountType: 'employer',
              email: canonicalEmail,
              name: empData?.contactPerson || empData?.companyName || userDocData?.name || (auth?.currentUser?.uid === uid ? auth.currentUser.displayName : '') || 'Employer',
              photoURL: empData?.companyLogo || empData?.profileImageUrl || userDocData?.photoURL || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null),
              profileImageUrl: empData?.profileImageUrl || empData?.companyLogo || userDocData?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null),
              createdAt: userDocData?.createdAt || empData?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Self-heal /users/{uid} in Firestore
            await setDoc(docRef, userDocData, { merge: true }).catch(() => {});
            // Self-heal /employers/{uid} in Firestore with original employer record
            if (empData) {
              await setDoc(doc(db, 'employers', uid), { ...empData, id: uid, email: canonicalEmail }, { merge: true }).catch(() => {});
            }
            // Safely delete any accidental developer doc created by previous bug
            await deleteDoc(doc(db, 'developers', uid)).catch(() => {});

            safeSave(`user_doc_${uid}`, userDocData);
            return userDocData;
          }

          // Priority B: Existing Developer profile match
          if (!devSnap.empty || (userDocData?.role === 'developer' && empSnap.empty)) {
            const devData = !devSnap.empty ? devSnap.docs[0].data() : null;
            const canonicalEmail = targetEmail || devData?.email || userDocData?.email || '';

            userDocData = {
              uid,
              role: 'developer',
              accountType: 'developer',
              email: canonicalEmail,
              name: devData?.name || userDocData?.name || (auth?.currentUser?.uid === uid ? auth.currentUser.displayName : '') || 'Developer',
              photoURL: devData?.avatar || devData?.profileImageUrl || userDocData?.photoURL || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null),
              profileImageUrl: devData?.profileImageUrl || devData?.avatar || userDocData?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null),
              createdAt: userDocData?.createdAt || devData?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Self-heal /users/{uid} in Firestore
            await setDoc(docRef, userDocData, { merge: true }).catch(() => {});
            // Self-heal /developers/{uid} in Firestore with original developer record
            if (devData) {
              await setDoc(doc(db, 'developers', uid), { ...devData, id: uid, email: canonicalEmail }, { merge: true }).catch(() => {});
            }
            // Safely delete any accidental employer doc created by previous bug
            await deleteDoc(doc(db, 'employers', uid)).catch(() => {});

            safeSave(`user_doc_${uid}`, userDocData);
            return userDocData;
          }

          // Priority C: Existing User Doc match
          if (!usersSnap.empty) {
            const existingUser = usersSnap.docs[0].data();
            const canonicalRole = existingUser.role || existingUser.accountType;
            if (canonicalRole) {
              userDocData = {
                ...existingUser,
                uid,
                role: canonicalRole,
                accountType: canonicalRole,
                email: targetEmail
              };
              await setDoc(docRef, userDocData, { merge: true }).catch(() => {});
              safeSave(`user_doc_${uid}`, userDocData);
              return userDocData;
            }
          }
        }

        // 3. Fallback Direct Lookup A: Check /employers/{uid}
        const empSnap = await getDoc(doc(db, 'employers', uid));
        if (empSnap.exists()) {
          const empData = empSnap.data();
          userDocData = {
            uid,
            role: 'employer',
            accountType: 'employer',
            email: empData.email || targetEmail || '',
            name: empData.contactPerson || empData.companyName || 'Employer',
            photoURL: empData.companyLogo || empData.profileImageUrl || null,
            profileImageUrl: empData.profileImageUrl || empData.companyLogo || null,
            createdAt: empData.createdAt || new Date().toISOString()
          };
          await setDoc(docRef, userDocData, { merge: true }).catch(() => {});
          safeSave(`user_doc_${uid}`, userDocData);
          return userDocData;
        }

        // 4. Fallback Direct Lookup B: Check /developers/{uid}
        const devSnap = await getDoc(doc(db, 'developers', uid));
        if (devSnap.exists()) {
          const devData = devSnap.data();
          userDocData = {
            uid,
            role: 'developer',
            accountType: 'developer',
            email: devData.email || targetEmail || '',
            name: devData.name || 'Developer',
            photoURL: devData.avatar || devData.profileImageUrl || null,
            profileImageUrl: devData.profileImageUrl || devData.avatar || null,
            createdAt: devData.createdAt || new Date().toISOString()
          };
          await setDoc(docRef, userDocData, { merge: true }).catch(() => {});
          safeSave(`user_doc_${uid}`, userDocData);
          return userDocData;
        }

        if (userDocData && (userDocData.role || userDocData.accountType)) {
          safeSave(`user_doc_${uid}`, userDocData);
          return userDocData;
        }

      } catch (error) {
        console.warn("Firestore getUserDoc failed:", error);
      }
    }

    // 5. Offline / Local Cache Fallback by Email
    if (userEmail) {
      const localEmployers = safeLoad('suredev_employers', EMPLOYERS);
      const matchedLocalEmp = localEmployers.find((e: any) => e.email?.toLowerCase().trim() === userEmail);
      if (matchedLocalEmp) {
        userDocData = {
          uid,
          role: 'employer',
          accountType: 'employer',
          email: userEmail,
          name: matchedLocalEmp.contactPerson || matchedLocalEmp.companyName || 'Employer',
          photoURL: matchedLocalEmp.companyLogo || null,
          profileImageUrl: matchedLocalEmp.companyLogo || null,
          createdAt: new Date().toISOString()
        };
        safeSave(`user_doc_${uid}`, userDocData);
        return userDocData;
      }

      const localDevs = safeLoad('suredev_developers', DEVELOPERS);
      const matchedLocalDev = localDevs.find((d: any) => d.email?.toLowerCase().trim() === userEmail);
      if (matchedLocalDev) {
        userDocData = {
          uid,
          role: 'developer',
          accountType: 'developer',
          email: userEmail,
          name: matchedLocalDev.name || 'Developer',
          photoURL: matchedLocalDev.avatar || null,
          profileImageUrl: matchedLocalDev.avatar || null,
          createdAt: new Date().toISOString()
        };
        safeSave(`user_doc_${uid}`, userDocData);
        return userDocData;
      }
    }

    const cached = safeLoad(`user_doc_${uid}`, null);
    if (cached && (cached.uid === uid || (userEmail && cached.email?.toLowerCase().trim() === userEmail))) {
      userDocData = cached;
      return userDocData;
    }

    return null;
  },

  async getDeveloperProfile(uid: string, providedEmail?: string) {
    let profileData: Developer | null = null;
    const targetEmail = (providedEmail || (auth?.currentUser?.uid === uid ? auth.currentUser.email : '') || '').trim().toLowerCase();

    if (db) {
      try {
        const docRef = doc(db, 'developers', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          profileData = snap.data() as Developer;
        } else if (targetEmail) {
          const q = query(collection(db, 'developers'), where('email', '==', targetEmail));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            profileData = qSnap.docs[0].data() as Developer;
            profileData.id = uid;
            await setDoc(docRef, profileData, { merge: true }).catch(() => {});
          }
        }
      } catch (error) {
        console.warn("Firestore getDeveloperProfile failed:", error);
      }
    }

    if (!profileData) {
      profileData = safeLoad(`developer_profile_${uid}`, null);
      if (!profileData && targetEmail) {
        const devs = safeLoad('suredev_developers', DEVELOPERS);
        profileData = devs.find((d: any) => d.email?.toLowerCase().trim() === targetEmail) || null;
      }
    }

    const localUserDoc = safeLoad(`user_doc_${uid}`, null);
    const bestPhotoUrl = profileData?.profileImageUrl || profileData?.avatar || localUserDoc?.photoURL || localUserDoc?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null);

    if (profileData) {
      if (bestPhotoUrl) {
        profileData.avatar = bestPhotoUrl;
        profileData.profileImageUrl = bestPhotoUrl;
        profileData.hasCustomProfileImage = true;
      }
      safeSave(`developer_profile_${uid}`, profileData);
      const devs = safeLoad('suredev_developers', DEVELOPERS);
      const index = devs.findIndex((d: any) => d.id === uid || (targetEmail && d.email?.toLowerCase().trim() === targetEmail));
      if (index !== -1) {
        devs[index] = { ...devs[index], ...profileData, id: uid };
      } else {
        devs.unshift({ ...profileData, id: uid });
      }
      safeSave('suredev_developers', devs);
    }

    return profileData;
  },

  async getEmployerProfile(uid: string, providedEmail?: string) {
    let profileData: Employer | null = null;
    const targetEmail = (providedEmail || (auth?.currentUser?.uid === uid ? auth.currentUser.email : '') || '').trim().toLowerCase();

    if (db) {
      try {
        const docRef = doc(db, 'employers', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          profileData = snap.data() as Employer;
        } else if (targetEmail) {
          const q = query(collection(db, 'employers'), where('email', '==', targetEmail));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            profileData = qSnap.docs[0].data() as Employer;
            profileData.id = uid;
            await setDoc(docRef, profileData, { merge: true }).catch(() => {});
          }
        }
      } catch (error) {
        console.warn("Firestore getEmployerProfile failed:", error);
      }
    }

    if (!profileData) {
      profileData = safeLoad(`employer_profile_${uid}`, null);
      if (!profileData && targetEmail) {
        const emps = safeLoad('suredev_employers', EMPLOYERS);
        profileData = emps.find((e: any) => e.email?.toLowerCase().trim() === targetEmail) || null;
      }
    }

    const localUserDoc = safeLoad(`user_doc_${uid}`, null);
    const bestPhotoUrl = profileData?.profileImageUrl || profileData?.companyLogo || localUserDoc?.photoURL || localUserDoc?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null);

    if (profileData) {
      if (bestPhotoUrl) {
        profileData.companyLogo = bestPhotoUrl;
        profileData.profileImageUrl = bestPhotoUrl;
        profileData.hasCustomProfileImage = true;
      }
      safeSave(`employer_profile_${uid}`, profileData);
      const emps = safeLoad('suredev_employers', EMPLOYERS);
      const index = emps.findIndex((e: any) => e.id === uid || (targetEmail && e.email?.toLowerCase().trim() === targetEmail));
      if (index !== -1) {
        emps[index] = { ...emps[index], ...profileData, id: uid };
      } else {
        emps.unshift({ ...profileData, id: uid });
      }
      safeSave('suredev_employers', emps);
    }

    return profileData;
  },

  async createDefaultDeveloperProfile(uid: string, email: string, name: string) {
    // 1. Existing Account Role Check - Never overwrite an existing user's role or wipe existing developer data!
    const existingUserDoc = await this.getUserDoc(uid, email);
    if (existingUserDoc && (existingUserDoc.role === 'employer' || existingUserDoc.accountType === 'employer')) {
      throw new Error("This account is permanently registered as an Employer. Swapping or recreating as a Developer is prohibited.");
    }

    if (existingUserDoc && (existingUserDoc.role === 'developer' || existingUserDoc.accountType === 'developer')) {
      const existingDev = await this.getDeveloperProfile(uid, email);
      if (existingDev) return existingDev;
    }

    const existingPhoto = existingUserDoc?.photoURL || existingUserDoc?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null);

    const newDev: Developer = {
      id: uid,
      name: name || (auth?.currentUser?.displayName) || email.split('@')[0],
      title: 'Software Developer',
      avatar: existingPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
      profileImageUrl: existingPhoto || undefined,
      hasCustomProfileImage: !!existingPhoto,
      location: 'Aba',
      experience: 3,
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      availability: 'immediate',
      bio: `Vetted Developer dedicated to crafting highly performant applications and customized localized solutions based in Aba, Abia State.`,
      githubUrl: 'https://github.com',
      linkedinUrl: 'https://linkedin.com',
      twitterUrl: 'https://twitter.com',
      portfolioUrl: 'https://portfolio.ng',
      featured: false,
      projects: [],
      email: email,
      coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200&h=400',
      currentWorkplace: 'Independent Consultant',
      phone: '',
      workExperience: [],
      qualification: 'Self-Taught Industry Specialist'
    };

    safeSave(`developer_profile_${uid}`, newDev);
    const devs = safeLoad('suredev_developers', DEVELOPERS);
    if (!devs.some((d: any) => d.id === uid)) {
      devs.unshift(newDev);
      safeSave('suredev_developers', devs);
    }

    const updatedUserDoc = {
      uid,
      role: 'developer' as const,
      accountType: 'developer' as const,
      email,
      name: newDev.name,
      photoURL: existingPhoto || null,
      profileImageUrl: existingPhoto || null,
      hasCustomProfileImage: !!existingPhoto,
      profileCompleted: true,
      createdAt: existingUserDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    safeSave(`user_doc_${uid}`, updatedUserDoc);

    if (db) {
      try {
        await setDoc(doc(db, 'users', uid), updatedUserDoc, { merge: true });
        await this.saveDeveloperProfile(uid, newDev, uid);
        await deleteDoc(doc(db, 'employers', uid)).catch(() => {});
      } catch (err) {
        console.warn("Firestore failed to save default developer profile:", err);
      }
    }
    return newDev;
  },

  async createDefaultEmployerProfile(uid: string, email: string, name: string) {
    // 1. Existing Account Role Check - Never overwrite an existing user's role or wipe existing employer data!
    const existingUserDoc = await this.getUserDoc(uid, email);
    if (existingUserDoc && (existingUserDoc.role === 'developer' || existingUserDoc.accountType === 'developer')) {
      throw new Error("This account is permanently registered as a Developer. Swapping or recreating as an Employer is prohibited.");
    }

    if (existingUserDoc && (existingUserDoc.role === 'employer' || existingUserDoc.accountType === 'employer')) {
      const existingEmp = await this.getEmployerProfile(uid, email);
      if (existingEmp) return existingEmp;
    }

    const existingPhoto = existingUserDoc?.photoURL || existingUserDoc?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null);

    const newEmp: Employer = {
      id: uid,
      companyName: name ? `${name}'s Company` : `${email.split('@')[0]}'s Venture`,
      companyLogo: existingPhoto || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200&h=200',
      profileImageUrl: existingPhoto || undefined,
      hasCustomProfileImage: !!existingPhoto,
      contactPerson: name || (auth?.currentUser?.displayName) || email.split('@')[0],
      description: `Leading local brand based in Aba, Abia State.`,
      website: 'https://cooperative.ng',
      phone: '',
      email: email,
      location: 'Aba',
      industry: 'E-commerce & Retail',
      desiredSkills: ['React', 'TypeScript', 'Tailwind CSS'],
      hiringCategories: [],
      hiringTypes: ['Full-time'],
      targetQualifications: 'Vetted Coding Bootcamp Graduate'
    };

    safeSave(`employer_profile_${uid}`, newEmp);
    const emps = safeLoad('suredev_employers', EMPLOYERS);
    if (!emps.some((e: any) => e.id === uid)) {
      emps.unshift(newEmp);
      safeSave('suredev_employers', emps);
    }

    const updatedUserDoc = {
      uid,
      role: 'employer' as const,
      accountType: 'employer' as const,
      email,
      name: newEmp.contactPerson,
      photoURL: existingPhoto || null,
      profileImageUrl: existingPhoto || null,
      hasCustomProfileImage: !!existingPhoto,
      profileCompleted: true,
      createdAt: existingUserDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    safeSave(`user_doc_${uid}`, updatedUserDoc);

    if (db) {
      try {
        await setDoc(doc(db, 'users', uid), updatedUserDoc, { merge: true });
        await this.saveEmployerProfile(uid, newEmp, uid);
        await deleteDoc(doc(db, 'developers', uid)).catch(() => {});
      } catch (err) {
        console.warn("Firestore failed to save default employer profile:", err);
      }
    }
    return newEmp;
  },

  // --- REAL-TIME DEVELOPERS ---
  subscribeDevelopers(callback: (developers: Developer[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad('suredev_developers', DEVELOPERS);
      callback(stored);
    };

    // Always emit cached local state immediately for instant 0ms UI load
    syncLocal();

    if (!db) {
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(collection(db, 'developers'), orderBy('createdAt', 'desc'));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const developersList: Developer[] = [];
        snapshot.forEach((doc) => {
          developersList.push({ id: doc.id, ...doc.data() } as Developer);
        });
        if (developersList.length === 0) {
          const stored = safeLoad('suredev_developers', DEVELOPERS);
          callback(stored);
        } else {
          safeSave('suredev_developers', developersList);
          callback(developersList);
        }
      }, (error) => {
        console.warn("Firestore developers live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore developers subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async saveDeveloperProfile(devId: string, data: Partial<Developer>, ownerId: string) {
    const existing = safeLoad(`developer_profile_${devId}`, null) || {};
    const photo = data.profileImageUrl || data.avatar || existing.profileImageUrl || existing.avatar;
    const hasCustom = photo && !photo.includes('unsplash.com');

    const updatedDev = { 
      ...existing, 
      ...data, 
      id: devId,
      ...(photo ? { avatar: photo, profileImageUrl: photo, photoURL: photo, hasCustomProfileImage: hasCustom } : {})
    };
    safeSave(`developer_profile_${devId}`, updatedDev);

    const devs = safeLoad('suredev_developers', DEVELOPERS);
    const index = devs.findIndex((d: any) => d.id === devId);
    if (index !== -1) {
      devs[index] = { ...devs[index], ...updatedDev };
    } else {
      devs.unshift(updatedDev);
    }
    safeSave('suredev_developers', devs);

    // Safety check: fetch user doc first to ensure we don't accidentally overwrite an Employer role
    const existingUserDoc = await this.getUserDoc(ownerId);
    if (existingUserDoc && (existingUserDoc.role === 'employer' || existingUserDoc.accountType === 'employer')) {
      console.warn(`[SAFETY CHECK] Prevented overwriting Employer role for UID ${ownerId}`);
      return;
    }

    const updatedUser = {
      ...existingUserDoc,
      uid: ownerId,
      role: 'developer' as const,
      accountType: 'developer' as const,
      email: data.email || existingUserDoc?.email,
      name: data.name || existingUserDoc?.name,
      ...(photo ? { photoURL: photo, profileImageUrl: photo, hasCustomProfileImage: hasCustom } : {}),
      updatedAt: new Date().toISOString()
    };
    safeSave(`user_doc_${ownerId}`, updatedUser);

    if (auth && auth.currentUser && auth.currentUser.uid === ownerId && photo && photo !== auth.currentUser.photoURL) {
      try {
        await updateProfile(auth.currentUser, { photoURL: photo });
      } catch (err) {
        console.warn("Failed to sync photoURL to auth in saveDeveloperProfile:", err);
      }
    }

    if (db) {
      try {
        const docRef = doc(db, 'developers', devId);
        await setDoc(docRef, withMetadata(updatedDev, ownerId), { merge: true });
        
        const userDocRef = doc(db, 'users', ownerId);
        await setDoc(userDocRef, {
          uid: ownerId,
          role: 'developer',
          accountType: 'developer',
          email: data.email || existingUserDoc?.email,
          name: data.name || existingUserDoc?.name,
          ...(photo ? { photoURL: photo, profileImageUrl: photo, hasCustomProfileImage: hasCustom } : {}),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore saveDeveloperProfile failed:", err);
      }
    }
  },

  // --- REAL-TIME EMPLOYERS ---
  subscribeEmployers(callback: (employers: Employer[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad('suredev_employers', EMPLOYERS);
      callback(stored);
    };

    // Always emit cached local state immediately for instant 0ms UI load
    syncLocal();

    if (!db) {
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(collection(db, 'employers'), orderBy('createdAt', 'desc'));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const employersList: Employer[] = [];
        snapshot.forEach((doc) => {
          employersList.push({ id: doc.id, ...doc.data() } as Employer);
        });
        if (employersList.length === 0) {
          const stored = safeLoad('suredev_employers', EMPLOYERS);
          callback(stored);
        } else {
          safeSave('suredev_employers', employersList);
          callback(employersList);
        }
      }, (error) => {
        console.warn("Firestore employers live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore employers subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async saveEmployerProfile(empId: string, data: Partial<Employer>, ownerId: string) {
    const existing = safeLoad(`employer_profile_${empId}`, null) || {};
    const photo = data.profileImageUrl || data.companyLogo || existing.profileImageUrl || existing.companyLogo;
    const hasCustom = photo && !photo.includes('unsplash.com');

    const updatedEmp = { 
      ...existing, 
      ...data, 
      id: empId,
      ...(photo ? { companyLogo: photo, profileImageUrl: photo, photoURL: photo, hasCustomProfileImage: hasCustom } : {})
    };
    safeSave(`employer_profile_${empId}`, updatedEmp);

    const emps = safeLoad('suredev_employers', EMPLOYERS);
    const index = emps.findIndex((e: any) => e.id === empId);
    if (index !== -1) {
      emps[index] = { ...emps[index], ...updatedEmp };
    } else {
      emps.unshift(updatedEmp);
    }
    safeSave('suredev_employers', emps);

    // Safety check: fetch user doc first to ensure we don't accidentally overwrite a Developer role
    const existingUserDoc = await this.getUserDoc(ownerId);
    if (existingUserDoc && (existingUserDoc.role === 'developer' || existingUserDoc.accountType === 'developer')) {
      console.warn(`[SAFETY CHECK] Prevented overwriting Developer role for UID ${ownerId}`);
      return;
    }

    const updatedUser = {
      ...existingUserDoc,
      uid: ownerId,
      role: 'employer' as const,
      accountType: 'employer' as const,
      email: data.email || existingUserDoc?.email,
      name: data.contactPerson || existingUserDoc?.name,
      ...(photo ? { photoURL: photo, profileImageUrl: photo, hasCustomProfileImage: hasCustom } : {}),
      updatedAt: new Date().toISOString()
    };
    safeSave(`user_doc_${ownerId}`, updatedUser);

    if (auth && auth.currentUser && auth.currentUser.uid === ownerId && photo && photo !== auth.currentUser.photoURL) {
      try {
        await updateProfile(auth.currentUser, { photoURL: photo });
      } catch (err) {
        console.warn("Failed to sync photoURL to auth in saveEmployerProfile:", err);
      }
    }

    if (db) {
      try {
        const docRef = doc(db, 'employers', empId);
        await setDoc(docRef, withMetadata(updatedEmp, ownerId), { merge: true });

        const userDocRef = doc(db, 'users', ownerId);
        await setDoc(userDocRef, {
          uid: ownerId,
          role: 'employer',
          accountType: 'employer',
          email: data.email || existingUserDoc?.email,
          name: data.contactPerson || existingUserDoc?.name,
          ...(photo ? { photoURL: photo, profileImageUrl: photo, hasCustomProfileImage: hasCustom } : {}),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore saveEmployerProfile failed:", err);
      }
    }
  },

  // --- COLLABORATION REQUESTS ---
  async getUserInfoForEmail(userId: string): Promise<{ email: string; name: string }> {
    const devs = safeLoad('suredev_developers', DEVELOPERS);
    const dev = devs.find((d: any) => d.id === userId);
    if (dev && dev.email) return { email: dev.email, name: dev.name };

    const emps = safeLoad('suredev_employers', EMPLOYERS);
    const emp = emps.find((e: any) => e.id === userId);
    if (emp && emp.email) return { email: emp.email, name: emp.contactPerson || emp.companyName };

    const localUserDoc = safeLoad(`user_doc_${userId}`, null);
    if (localUserDoc && localUserDoc.email) {
      return { email: localUserDoc.email, name: localUserDoc.name || localUserDoc.email.split('@')[0] };
    }

    if (db) {
      try {
        const devDoc = await getDoc(doc(db, 'developers', userId));
        if (devDoc.exists() && devDoc.data().email) {
          return { email: devDoc.data().email, name: devDoc.data().name };
        }
        const empDoc = await getDoc(doc(db, 'employers', userId));
        if (empDoc.exists() && empDoc.data().email) {
          return { email: empDoc.data().email, name: empDoc.data().contactPerson || empDoc.data().companyName };
        }
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists() && userDoc.data().email) {
          return { email: userDoc.data().email, name: userDoc.data().name || userDoc.data().email.split('@')[0] };
        }
      } catch (err) {
        console.warn("Error fetching user info for email dispatch:", err);
      }
    }

    return { email: '', name: 'SureDev Specialist' };
  },

  async sendEmailNotification(params: {
    toEmail: string;
    recipientName: string;
    subject: string;
    body: string;
    type: 'collab_request' | 'collab_accepted' | 'collab_declined';
    senderName?: string;
    senderEmail?: string;
  }) {
    const { toEmail, recipientName, subject, body, type, senderName, senderEmail } = params;
    if (!toEmail) {
      console.warn("sendEmailNotification: Recipient email address missing.");
      return;
    }

    const payload = {
      to: toEmail,
      recipientName,
      subject,
      body,
      type,
      senderName: senderName || 'SureDev System',
      senderEmail: senderEmail || 'no-reply@suredev.ng',
      status: 'triggered',
      createdAt: new Date().toISOString()
    };

    // 1. Write email trigger document to Firestore 'email_notifications' collection
    if (db) {
      try {
        await addDoc(collection(db, 'email_notifications'), withMetadata({
          ...payload,
          status: 'queued',
          timestamp: serverTimestamp()
        }, 'system'));
        console.log(`[FIREBASE EMAIL TRIGGER] Trigger document created in 'email_notifications' for ${toEmail}`);
      } catch (err) {
        console.warn("Firestore email_notifications document creation failed:", err);
      }
    }

    // 2. Queue into user's local Google Inbox store so it's instantly visible in the app
    const emailInboxList = safeLoad(`email_inbox_${toEmail}`, []);
    emailInboxList.unshift({
      id: `email-${Date.now()}`,
      senderName: senderName || 'SureDev System',
      senderEmail: senderEmail || 'notifications@suredev.ng',
      subject,
      date: 'Just Now',
      body,
      isRead: false,
      isStarred: true
    });
    safeSave(`email_inbox_${toEmail}`, emailInboxList);

    // 3. Post to backend Express server API endpoint /api/notifications/email
    try {
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Failed to reach /api/notifications/email server endpoint:", err);
    }
  },

  subscribeCollaborationRequests(callback: (requests: CollabRequest[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad('suredev_collab_requests', []);
      callback(stored);
    };

    // Always emit cached local state immediately for instant 0ms UI load
    syncLocal();

    if (!db) {
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(collection(db, 'collaboration_requests'), orderBy('createdAt', 'desc'));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: CollabRequest[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CollabRequest);
        });
        safeSave('suredev_collab_requests', list);
        callback(list);
      }, (error) => {
        console.warn("Firestore collab requests live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore collab requests subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async sendCollabRequest(senderId: string, receiverId: string, message?: string) {
    const id = `collab-${Date.now()}`;
    const payload: CollabRequest = {
      id,
      senderId,
      receiverId,
      status: 'pending',
      message,
      timestamp: new Date().toISOString(),
    };

    const list = safeLoad('suredev_collab_requests', []);
    list.unshift(payload);
    safeSave('suredev_collab_requests', list);

    await this.logActivity(senderId, 'Collab request sent', `Sent collaboration proposal to another specialist.`);
    await this.createNotification(receiverId, 'collab_request', 'New Hire/Collab Request', `You have received a new collaboration request.`, senderId);

    if (db) {
      try {
        const docRef = doc(db, 'collaboration_requests', id);
        await setDoc(docRef, withMetadata(payload, senderId));
      } catch (err) {
        console.warn("Firestore sendCollabRequest failed:", err);
      }
    }

    // Trigger Email Notification to Receiver
    try {
      const senderInfo = await this.getUserInfoForEmail(senderId);
      const receiverInfo = await this.getUserInfoForEmail(receiverId);

      if (receiverInfo.email) {
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; border-bottom: 2px solid #047857; padding-bottom: 15px; margin-bottom: 20px;">
              <h2 style="color: #047857; margin: 0;">SureDev Ecosystem</h2>
              <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Collaboration Hub Notification</p>
            </div>
            <h3 style="color: #0f172a;">Hello ${receiverInfo.name || 'Developer'},</h3>
            <p style="color: #334155; line-height: 1.6;">
              <strong>${senderInfo.name}</strong> (${senderInfo.email || 'SureDev Specialist'}) has sent you a new collaboration proposal!
            </p>
            ${message ? `
              <div style="background-color: #f8fafc; border-left: 4px solid #047857; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                <p style="margin: 0; font-style: italic; color: #475569;">"${message}"</p>
              </div>
            ` : ''}
            <p style="color: #334155; line-height: 1.6;">
              Log in to your <strong>SureDev Developer Dashboard &rarr; 🤝 Collaboration Hub</strong> to view details and respond to this request.
            </p>
            <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
              SureDev • Automated Email Notification System
            </div>
          </div>
        `;

        await this.sendEmailNotification({
          toEmail: receiverInfo.email,
          recipientName: receiverInfo.name,
          subject: `🤝 New Collaboration Request from ${senderInfo.name} on SureDev`,
          body: emailBody,
          type: 'collab_request',
          senderName: senderInfo.name,
          senderEmail: senderInfo.email
        });
      }
    } catch (emailErr) {
      console.warn("Failed to dispatch collaboration request email trigger:", emailErr);
    }
  },

  async updateCollabRequestStatus(requestId: string, status: 'accepted' | 'declined', userId: string) {
    const list = safeLoad('suredev_collab_requests', []);
    const request = list.find((r: any) => r.id === requestId);
    if (request) {
      request.status = status;
      safeSave('suredev_collab_requests', list);

      const notifierId = status === 'accepted' ? 'Collaboration accepted' : 'Collaboration declined';
      await this.logActivity(userId, notifierId, `Responded to collab request.`);
      await this.createNotification(request.senderId, 'collab_accepted', 'Collaboration Update', `Your collaboration request was ${status}.`, userId);

      // Trigger Email Notification when request status is updated (e.g. accepted)
      try {
        const acceptorInfo = await this.getUserInfoForEmail(userId);
        const senderInfo = await this.getUserInfoForEmail(request.senderId);

        if (senderInfo.email) {
          const isAccepted = status === 'accepted';
          const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; border-bottom: 2px solid ${isAccepted ? '#047857' : '#dc2626'}; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: ${isAccepted ? '#047857' : '#dc2626'}; margin: 0;">SureDev Ecosystem</h2>
                <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Collaboration Status Update</p>
              </div>
              <h3 style="color: #0f172a;">Hello ${senderInfo.name || 'Developer'},</h3>
              <p style="color: #334155; line-height: 1.6;">
                ${isAccepted 
                  ? `🎉 <strong>${acceptorInfo.name}</strong> has <strong>ACCEPTED</strong> your collaboration request on SureDev!`
                  : `<strong>${acceptorInfo.name}</strong> has updated the status of your collaboration request to: <em>${status}</em>.`
                }
              </p>
              <p style="color: #334155; line-height: 1.6;">
                ${isAccepted 
                  ? `You can now start coordinating, sharing project resources, and building together! Log in to your <strong>SureDev Developer Dashboard &rarr; 🤝 Collaboration Hub</strong> to connect directly with ${acceptorInfo.name} (${acceptorInfo.email || 'email registered'}).`
                  : 'Log in to your SureDev Dashboard to explore other specialists and opportunities.'
                }
              </p>
              <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                SureDev • Automated Email Notification System
              </div>
            </div>
          `;

          await this.sendEmailNotification({
            toEmail: senderInfo.email,
            recipientName: senderInfo.name,
            subject: isAccepted 
              ? `🎉 Collaboration Request Accepted by ${acceptorInfo.name}!` 
              : `Collaboration Request Status Updated on SureDev`,
            body: emailBody,
            type: isAccepted ? 'collab_accepted' : 'collab_declined',
            senderName: acceptorInfo.name,
            senderEmail: acceptorInfo.email
          });
        }
      } catch (emailErr) {
        console.warn("Failed to dispatch collaboration status update email trigger:", emailErr);
      }
    }

    if (db) {
      try {
        const docRef = doc(db, 'collaboration_requests', requestId);
        await updateDoc(docRef, { 
          status,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore updateCollabRequestStatus failed:", err);
      }
    }
  },

  async cancelCollabRequest(requestId: string) {
    let list = safeLoad('suredev_collab_requests', []);
    list = list.filter((r: any) => r.id !== requestId);
    safeSave('suredev_collab_requests', list);

    if (db) {
      try {
        const docRef = doc(db, 'collaboration_requests', requestId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn("Firestore cancelCollabRequest failed:", err);
      }
    }
  },

  // --- MESSAGING & CONVERSATIONS ---
  subscribeMessages(conversationId: string, callback: (messages: any[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad(`messages_${conversationId}`, []);
      callback(stored);
    };

    if (!db) {
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
      );
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        safeSave(`messages_${conversationId}`, list);
        callback(list);
      }, (error) => {
        console.warn("Firestore messages live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore messages subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async sendMessage(conversationId: string, senderId: string, text: string, mediaUrl?: string) {
    const payload = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      text,
      mediaUrl: mediaUrl || null,
      read: false,
      createdAt: new Date().toISOString()
    };

    const list = safeLoad(`messages_${conversationId}`, []);
    list.push(payload);
    safeSave(`messages_${conversationId}`, list);

    if (db) {
      try {
        await addDoc(collection(db, 'messages'), withMetadata({
          conversationId,
          senderId,
          text,
          mediaUrl: mediaUrl || null,
          read: false,
        }, senderId));
      } catch (err) {
        console.warn("Firestore sendMessage failed:", err);
      }
    }
  },

  // --- NOTIFICATIONS ---
  subscribeNotifications(userId: string, callback: (notifications: any[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad(`notifications_${userId}`, []);
      callback(stored);
    };

    if (!db) {
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(
        collection(db, 'notifications'),
        where('receiverId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        safeSave(`notifications_${userId}`, list);
        callback(list);
      }, (error) => {
        console.warn("Firestore notifications live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore notifications subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async createNotification(receiverId: string, type: string, title: string, text: string, senderId: string, projectId?: string) {
    const payload = {
      id: `notif-${Date.now()}`,
      receiverId,
      type,
      title,
      text,
      senderId,
      projectId: projectId || undefined,
      actionUrl: projectId ? `/workspace/${projectId}` : undefined,
      read: false,
      createdAt: new Date().toISOString()
    };

    const list = safeLoad(`notifications_${receiverId}`, []);
    list.unshift(payload);
    safeSave(`notifications_${receiverId}`, list);

    if (db) {
      try {
        await addDoc(collection(db, 'notifications'), withMetadata({
          receiverId,
          type,
          title,
          text,
          senderId,
          projectId: projectId || null,
          actionUrl: projectId ? `/workspace/${projectId}` : null,
          read: false,
        }, senderId));
      } catch (err) {
        console.warn("Firestore createNotification failed:", err);
      }
    }
  },

  async markNotificationRead(notificationId: string) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notifications_')) {
          const list = safeLoad(key, []);
          const index = list.findIndex((n: any) => n.id === notificationId);
          if (index !== -1) {
            list[index].read = true;
            safeSave(key, list);
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (db) {
      try {
        const docRef = doc(db, 'notifications', notificationId);
        await updateDoc(docRef, { read: true, updatedAt: serverTimestamp() });
      } catch (err) {
        console.warn("Firestore markNotificationRead failed:", err);
      }
    }
  },

  // --- ACTIVITY LOGS ---
  subscribeActivityLogs(userId: string, callback: (logs: any[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad(`activity_logs_${userId}`, []);
      callback(stored);
    };

    if (!db) {
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(
        collection(db, 'activity_logs'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(25)
      );
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        safeSave(`activity_logs_${userId}`, list);
        callback(list);
      }, (error) => {
        console.warn("Firestore activity logs live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore activity logs subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async logActivity(userId: string, action: string, details: string) {
    const payload = {
      id: `act-${Date.now()}`,
      ownerId: userId,
      action,
      details,
      createdAt: new Date().toISOString()
    };

    const list = safeLoad(`activity_logs_${userId}`, []);
    list.unshift(payload);
    if (list.length > 25) list.pop();
    safeSave(`activity_logs_${userId}`, list);

    if (db) {
      try {
        await addDoc(collection(db, 'activity_logs'), withMetadata({
          action,
          details,
        }, userId));
      } catch (err) {
        console.warn("Firestore logActivity failed:", err);
      }
    }
  },

  // --- REVIEWS / ENDORSEMENTS ---
  subscribeReviews(developerId: string, callback: (reviews: any[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad(`reviews_${developerId}`, []);
      callback(stored);
    };

    if (!db) {
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(
        collection(db, 'reviews'),
        where('developerId', '==', developerId),
        orderBy('createdAt', 'desc')
      );
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        safeSave(`reviews_${developerId}`, list);
        callback(list);
      }, (error) => {
        console.warn("Firestore reviews live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore reviews subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async addReview(developerId: string, authorId: string, authorName: string, authorLogo: string, rating: number, text: string) {
    const payload = {
      id: `rev-${Date.now()}`,
      developerId,
      authorName,
      authorLogo,
      rating,
      text,
      createdAt: new Date().toISOString()
    };

    const list = safeLoad(`reviews_${developerId}`, []);
    list.unshift(payload);
    safeSave(`reviews_${developerId}`, list);

    await this.createNotification(developerId, 'project_liked', 'New Endorsement!', `${authorName} left you a review.`, authorId);

    if (db) {
      try {
        await addDoc(collection(db, 'reviews'), withMetadata({
          developerId,
          authorName,
          authorLogo,
          rating,
          text,
        }, authorId));
      } catch (err) {
        console.warn("Firestore addReview failed:", err);
      }
    }
  },

  // ==========================================
  // PROJECTS (MVP CONTRACTS & WORKFLOW)
  // ==========================================
  async createManagedProject(data: Omit<ManagedProject, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: ProjectStatus }): Promise<ManagedProject> {
    const id = `proj-${Date.now()}`;
    const now = new Date().toISOString();
    const initialStatus: ProjectStatus = data.status || 'Active';
    const newProject: ManagedProject = {
      ...data,
      id,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    };

    // Save locally
    const stored = safeLoad<ManagedProject[]>('suredev_managed_projects', []);
    stored.unshift(newProject);
    safeSave('suredev_managed_projects', stored);

    // Save to Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'projects', id), withMetadata(newProject, data.employerId));
      } catch (err) {
        console.warn("Firestore createManagedProject failed:", err);
      }
    }

    // Add Timeline Event
    await this.addProjectTimelineEvent({
      projectId: id,
      eventType: initialStatus === 'Active' || initialStatus === 'Accepted' ? 'Developer Accepted' : 'Project Created',
      description: initialStatus === 'Active'
        ? `Project "${data.title}" was approved by ${data.employerName} and status is now Active.`
        : `Project "${data.title}" was created by ${data.employerName}.`,
      actorId: data.employerId,
      actorName: data.employerName,
      actorRole: 'employer'
    });

    // If Active, automatically create Contract Accepted System Card Message in the chat
    if (initialStatus === 'Active' || initialStatus === 'Accepted') {
      const msgsKey = `suredev_messages_${id}`;
      const msgs = safeLoad<ContractMessage[]>(msgsKey, []);
      const hasAcceptedCard = msgs.some(m => m.isSystemMessage && m.text.includes('CONTRACT ACCEPTED'));
      if (!hasAcceptedCard) {
        const acceptedMsg: ContractMessage = {
          id: `msg_accepted_${id}`,
          projectId: id,
          senderId: 'system',
          senderName: 'SureDev Escrow System',
          senderRole: 'system',
          text: `🎉 CONTRACT ACCEPTED & ACTIVATED\n\nJob proposal for "${data.title}" has been approved by the employer. The project is now Active across the platform with escrow, milestones, and real-time collaboration enabled.`,
          createdAt: now,
          isSystemMessage: true,
          contractCard: {
            title: data.title,
            budget: data.budget,
            employerName: data.employerName,
            developerName: data.developerName,
            status: 'Active',
            acceptedAt: now
          }
        };
        msgs.push(acceptedMsg);
        safeSave(msgsKey, msgs);
        if (db) {
          try {
            await setDoc(doc(db, 'contract_messages', `msg_accepted_${id}`), acceptedMsg, { merge: true });
          } catch (err) {
            console.warn("Firestore accepted contract message error:", err);
          }
        }
      }
    }

    // Notify Developer
    const notifTitle = (initialStatus === 'Active' || initialStatus === 'Accepted')
      ? 'Job Proposal Approved 🎉'
      : 'New Project Proposal 💼';
    const notifMsg = (initialStatus === 'Active' || initialStatus === 'Accepted')
      ? `${data.employerName} approved your proposal for "${data.title}". The project status is now Active!`
      : `${data.employerName} proposed a project: "${data.title}". Review and accept inside your dashboard.`;

    await this.createNotification(
      data.developerId,
      (initialStatus === 'Active' || initialStatus === 'Accepted') ? 'project_accepted' : 'general',
      notifTitle,
      notifMsg,
      data.employerId,
      id
    );

    // Increment projectsPosted on Employer profile
    try {
      const emp = await this.getEmployerProfile(data.employerId);
      if (emp) {
        const posted = (emp.projectsPosted || 0) + 1;
        await this.saveEmployerProfile(data.employerId, { projectsPosted: posted }, data.employerId);
      }
    } catch (e) {
      console.warn("Could not increment employer projectsPosted:", e);
    }

    return newProject;
  },

  subscribeManagedProjects(callback: (projects: ManagedProject[]) => void) {
    let unsubFirestore = () => {};
    let isSnapshotFired = false;

    const syncLocal = () => {
      const stored = safeLoad('suredev_managed_projects', []);
      callback(stored);
    };

    if (!db) {
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    try {
      const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: ManagedProject[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as ManagedProject);
        });
        safeSave('suredev_managed_projects', list);
        callback(list);
      }, (error) => {
        console.warn("Firestore projects live sync failed:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore projects subscription error:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async updateProjectStatus(projectId: string, newStatus: ProjectStatus, actorId: string, actorName: string, actorRole: 'employer' | 'developer') {
    const now = new Date().toISOString();
    
    // Update Local
    const stored = safeLoad<ManagedProject[]>('suredev_managed_projects', []);
    let targetProject: ManagedProject | undefined;
    const updatedList = stored.map(p => {
      if (p.id === projectId) {
        targetProject = { ...p, status: newStatus, updatedAt: now };
        return targetProject;
      }
      return p;
    });
    safeSave('suredev_managed_projects', updatedList);

    // Update Firestore
    if (db) {
      try {
        await updateDoc(doc(db, 'projects', projectId), {
          status: newStatus,
          updatedAt: now
        });
        if (!targetProject) {
          const snap = await getDoc(doc(db, 'projects', projectId));
          if (snap.exists()) {
            targetProject = { id: snap.id, ...snap.data() } as ManagedProject;
          }
        }
      } catch (err) {
        console.warn("Firestore updateProjectStatus failed:", err);
      }
    }

    if (!targetProject) return;

    // Timeline event map
    let eventType: TimelineEventType = 'Project Created';
    let timelineDesc = `Project status changed to ${newStatus} by ${actorName}.`;
    if (newStatus === 'Accepted' || newStatus === 'Active') {
      eventType = 'Developer Accepted';
      timelineDesc = `${actorName} accepted and activated the project contract.`;

      // Automatically create Contract Accepted System Card Message (Idempotent)
      const msgsKey = `suredev_messages_${projectId}`;
      const msgs = safeLoad<ContractMessage[]>(msgsKey, []);
      const hasAcceptedCard = msgs.some(m => m.isSystemMessage && m.text.includes('CONTRACT ACCEPTED'));
      if (!hasAcceptedCard) {
        const acceptedMsg: ContractMessage = {
          id: `msg_accepted_${projectId}`,
          projectId,
          senderId: 'system',
          senderName: 'SureDev Escrow System',
          senderRole: 'system',
          text: `🎉 CONTRACT ACCEPTED & ACTIVATED\n\nContract "${targetProject.title}" has been officially accepted and is now Active. Escrow funds, deliverables tracker, Kanban board, and real-time workspace collaboration tools are now live.`,
          createdAt: now,
          isSystemMessage: true,
          contractCard: {
            title: targetProject.title,
            budget: targetProject.budget,
            employerName: targetProject.employerName,
            developerName: targetProject.developerName,
            status: 'Active',
            acceptedAt: now
          }
        };
        msgs.push(acceptedMsg);
        safeSave(msgsKey, msgs);
        if (db) {
          try {
            await setDoc(doc(db, 'contract_messages', `msg_accepted_${projectId}`), acceptedMsg, { merge: true });
          } catch (err) {
            console.warn("Firestore accepted contract message error:", err);
          }
        }
      }
    } else if (newStatus === 'Declined') {
      eventType = 'Developer Declined';
      timelineDesc = `${actorName} declined the project proposal.`;
    } else if (newStatus === 'Cancelled') {
      eventType = 'Employer Cancelled';
      timelineDesc = `${actorName} cancelled the project contract.`;
    } else if (newStatus === 'Completed') {
      eventType = 'Project Completed';
      timelineDesc = `${actorName} marked the project as successfully completed 🎉.`;
    }

    await this.addProjectTimelineEvent({
      projectId,
      eventType,
      description: timelineDesc,
      actorId,
      actorName,
      actorRole
    });

    // Send notifications
    const targetUserId = actorRole === 'employer' ? targetProject.developerId : targetProject.employerId;
    let notifTitle = `Project Update: ${newStatus}`;
    let notifType: any = 'general';
    if (newStatus === 'Accepted' || newStatus === 'Active') {
      notifTitle = 'Project Active 🎉';
      notifType = 'project_accepted';
    } else if (newStatus === 'Declined') {
      notifTitle = 'Project Declined';
      notifType = 'project_declined';
    } else if (newStatus === 'Cancelled') {
      notifTitle = 'Project Cancelled';
      notifType = 'project_cancelled';
    } else if (newStatus === 'Completed') {
      notifTitle = 'Project Completed 🌟';
      notifType = 'project_completed';
    }

    await this.createNotification(
      targetUserId,
      notifType,
      notifTitle,
      `"${targetProject.title}" has been updated to status ${newStatus} by ${actorName}.`,
      actorId,
      projectId
    );

    // If completed, update projectsCompleted count on developer & employer profile
    if (newStatus === 'Completed') {
      try {
        const dev = await this.getDeveloperProfile(targetProject.developerId);
        if (dev) {
          const completed = (dev.projectsCompleted || 0) + 1;
          await this.saveDeveloperProfile(targetProject.developerId, { projectsCompleted: completed }, targetProject.developerId);
        }
      } catch (e) {
        console.warn("Could not update dev projectsCompleted:", e);
      }

      try {
        const emp = await this.getEmployerProfile(targetProject.employerId);
        if (emp) {
          const completed = (emp.projectsCompleted || 0) + 1;
          await this.saveEmployerProfile(targetProject.employerId, { projectsCompleted: completed }, targetProject.employerId);
        }
      } catch (e) {
        console.warn("Could not update emp projectsCompleted:", e);
      }
    }
  },

  // ==========================================
  // PROJECT TIMELINE
  // ==========================================
  async addProjectTimelineEvent(data: Omit<ProjectTimelineEvent, 'id' | 'createdAt'>): Promise<ProjectTimelineEvent> {
    const id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const eventObj: ProjectTimelineEvent = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };

    const storedKey = `suredev_timeline_${data.projectId}`;
    const stored = safeLoad<ProjectTimelineEvent[]>(storedKey, []);
    stored.push(eventObj);
    safeSave(storedKey, stored);

    if (db) {
      try {
        await addDoc(collection(db, 'projectTimeline'), withMetadata(eventObj, data.actorId));
      } catch (err) {
        console.warn("Firestore addProjectTimelineEvent failed:", err);
      }
    }

    return eventObj;
  },

  subscribeProjectTimeline(projectId: string, callback: (events: ProjectTimelineEvent[]) => void) {
    let unsubFirestore = () => {};
    let isSnapshotFired = false;
    const storedKey = `suredev_timeline_${projectId}`;

    const syncLocal = () => {
      const stored = safeLoad<ProjectTimelineEvent[]>(storedKey, []);
      callback(stored);
    };

    if (!db) {
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    try {
      const q = query(collection(db, 'projectTimeline'), where('projectId', '==', projectId), orderBy('createdAt', 'asc'));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: ProjectTimelineEvent[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as ProjectTimelineEvent);
        });
        safeSave(storedKey, list);
        callback(list);
      }, (error) => {
        console.warn("Firestore project timeline live sync failed:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore timeline subscription error:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  // ==========================================
  // REVIEWS & RATINGS SYSTEM
  // ==========================================
  async createProjectReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const id = `rev-${Date.now()}`;
    const reviewObj: Review = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };

    // Save local
    const stored = safeLoad<Review[]>('suredev_project_reviews', []);
    stored.unshift(reviewObj);
    safeSave('suredev_project_reviews', stored);

    // Save Firestore
    if (db) {
      try {
        await addDoc(collection(db, 'reviews'), withMetadata(reviewObj, data.reviewerId));
      } catch (err) {
        console.warn("Firestore createProjectReview failed:", err);
      }
    }

    // Add Timeline Event
    await this.addProjectTimelineEvent({
      projectId: data.projectId,
      eventType: 'Review Submitted',
      description: `${data.reviewerName} submitted a ${data.rating}★ review: "${data.title}"`,
      actorId: data.reviewerId,
      actorName: data.reviewerName,
      actorRole: data.reviewerRole
    });

    // Notify Target User
    await this.createNotification(
      data.targetUserId,
      'new_review' as any,
      `New ${data.rating}★ Review Received! ⭐`,
      `${data.reviewerName} rated your work on "${data.projectTitle}": "${data.title}".`,
      data.reviewerId,
      data.projectId
    );

    // Recalculate Average Rating and Review Count for Target User
    this.recalculateUserRatings(data.targetUserId, data.targetUserRole);

    return reviewObj;
  },

  async recalculateUserRatings(userId: string, userRole: 'developer' | 'employer') {
    const allReviews = safeLoad<Review[]>('suredev_project_reviews', []);
    const userReviews = allReviews.filter(r => r.targetUserId === userId);
    
    if (userReviews.length === 0) return;

    const total = userReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = parseFloat((total / userReviews.length).toFixed(1));
    const count = userReviews.length;

    if (userRole === 'developer') {
      await this.saveDeveloperProfile(userId, { averageRating: avg, reviewCount: count }, userId);
    } else {
      const reliabilityScore = Math.min(100, Math.round(75 + avg * 5));
      await this.saveEmployerProfile(userId, { averageRating: avg, reviewCount: count, reliabilityScore }, userId);
    }
  },

  subscribeProjectReviews(callback: (reviews: Review[]) => void) {
    let unsubFirestore = () => {};
    let isSnapshotFired = false;

    const syncLocal = () => {
      const stored = safeLoad<Review[]>('suredev_project_reviews', []);
      callback(stored);
    };

    if (!db) {
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: Review[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Review);
        });
        safeSave('suredev_project_reviews', list);
        callback(list);
      }, (error) => {
        console.warn("Firestore reviews subscription failed:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore reviews error:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  // ==========================================
  // COMPLAINT SYSTEM
  // ==========================================
  async createComplaint(data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Complaint> {
    const id = `cmp-${Date.now()}`;
    const now = new Date().toISOString();
    const complaintObj: Complaint = {
      ...data,
      id,
      status: 'Open',
      createdAt: now,
      updatedAt: now
    };

    // Local
    const stored = safeLoad<Complaint[]>('suredev_complaints', []);
    stored.unshift(complaintObj);
    safeSave('suredev_complaints', stored);

    // Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'complaints', id), withMetadata(complaintObj, data.complainantId));
      } catch (err) {
        console.warn("Firestore createComplaint failed:", err);
      }
    }

    // Add Timeline Event
    await this.addProjectTimelineEvent({
      projectId: data.projectId,
      eventType: 'Complaint Submitted',
      description: `Issue reported by ${data.complainantName}: Reason - ${data.reason}`,
      actorId: data.complainantId,
      actorName: data.complainantName,
      actorRole: data.complainantRole
    });

    // Notify Respondent
    await this.createNotification(
      data.respondentId,
      'complaint_submitted' as any,
      `Issue Reported on "${data.projectTitle}" ⚠️`,
      `${data.complainantName} filed an issue regarding: ${data.reason}. Our support team will review this.`,
      data.complainantId,
      data.projectId
    );

    return complaintObj;
  },

  subscribeComplaints(callback: (complaints: Complaint[]) => void) {
    let unsubFirestore = () => {};
    let isSnapshotFired = false;

    const syncLocal = () => {
      const stored = safeLoad<Complaint[]>('suredev_complaints', []);
      callback(stored);
    };

    if (!db) {
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    try {
      const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: Complaint[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Complaint);
        });
        safeSave('suredev_complaints', list);
        callback(list);
      }, (error) => {
        console.warn("Firestore complaints subscription failed:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore complaints error:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async updateComplaintStatus(complaintId: string, newStatus: ComplaintStatus, resolutionNotes?: string) {
    const now = new Date().toISOString();
    const stored = safeLoad<Complaint[]>('suredev_complaints', []);
    let target: Complaint | undefined;

    const updatedList = stored.map(c => {
      if (c.id === complaintId) {
        target = { ...c, status: newStatus, resolutionNotes: resolutionNotes || c.resolutionNotes, updatedAt: now };
        return target;
      }
      return c;
    });
    safeSave('suredev_complaints', updatedList);

    if (db) {
      try {
        await updateDoc(doc(db, 'complaints', complaintId), {
          status: newStatus,
          resolutionNotes: resolutionNotes || '',
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore updateComplaintStatus failed:", err);
      }
    }

    if (target) {
      await this.createNotification(
        target.complainantId,
        'complaint_updated' as any,
        `Complaint ${newStatus} 📋`,
        `Your reported issue for "${target.projectTitle}" is now marked as ${newStatus}.`,
        'system',
        target.projectId
      );
    }
  },

  // ==========================================
  // CONTRACT WORKSPACE REAL-TIME SUBSCRIPTIONS & CRUD
  // ==========================================

  // 1. Messages
  subscribeContractMessages(projectId: string, callback: (msgs: ContractMessage[]) => void) {
    const storageKey = `suredev_messages_${projectId}`;
    const syncLocal = () => {
      const stored = safeLoad<ContractMessage[]>(storageKey, []);
      callback(stored);
    };

    if (!db) {
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    try {
      const q = query(
        collection(db, 'contract_messages'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'asc')
      );
      return onSnapshot(q, (snapshot) => {
        const firestoreList: ContractMessage[] = [];
        snapshot.forEach(docSnap => {
          firestoreList.push({ id: docSnap.id, ...docSnap.data() } as ContractMessage);
        });

        // Merge with local optimistic messages that haven't appeared in Firestore snapshot yet
        const localStored = safeLoad<ContractMessage[]>(storageKey, []);
        const unsyncedLocal = localStored.filter(
          m => m.id.startsWith('msg_') && !firestoreList.some(
            f => f.id === m.id || (f.text === m.text && f.senderId === m.senderId && Math.abs(new Date(f.createdAt).getTime() - new Date(m.createdAt).getTime()) < 30000)
          )
        );

        // Map deduplication by ID
        const uniqueMap = new Map<string, ContractMessage>();
        [...firestoreList, ...unsyncedLocal].forEach((msgItem) => {
          if (msgItem && msgItem.id && !uniqueMap.has(msgItem.id)) {
            uniqueMap.set(msgItem.id, msgItem);
          }
        });

        const merged = Array.from(uniqueMap.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        safeSave(storageKey, merged);
        callback(merged);
      }, (err) => {
        console.warn("Firestore message sync warning:", err);
        syncLocal();
      });
    } catch (err) {
      console.warn("Firestore message subscription failed:", err);
      syncLocal();
      return () => {};
    }
  },

  async sendContractMessage(msg: Omit<ContractMessage, 'id' | 'createdAt'>) {
    const now = new Date().toISOString();
    const storageKey = `suredev_messages_${msg.projectId}`;
    const stored = safeLoad<ContractMessage[]>(storageKey, []);
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const newMsg: ContractMessage = cleanPayload({
      ...msg,
      id: msgId,
      createdAt: now
    });

    stored.push(newMsg);
    safeSave(storageKey, stored);

    if (db) {
      try {
        const payload = cleanPayload({
          ...msg,
          id: msgId,
          createdAt: now,
          ownerId: msg.senderId
        });
        await setDoc(doc(db, 'contract_messages', msgId), payload);
      } catch (err) {
        console.warn("Firestore sendContractMessage failed:", err);
      }
    }

    // Log timeline
    try {
      await this.addTimelineEvent(
        msg.projectId,
        'Message Sent',
        `${msg.senderName} sent a message in workspace chat.`,
        msg.senderId,
        msg.senderName,
        msg.senderRole
      );
    } catch (e) {
      // non-blocking
    }

    return newMsg;
  },

  async toggleMessageReaction(messageId: string, projectId: string, emoji: string, userId: string) {
    const storageKey = `suredev_messages_${projectId}`;
    const stored = safeLoad<ContractMessage[]>(storageKey, []);
    const updated = stored.map(m => {
      if (m.id === messageId) {
        const rx = { ...(m.reactions || {}) };
        const list = rx[emoji] || [];
        if (list.includes(userId)) {
          rx[emoji] = list.filter(id => id !== userId);
          if (rx[emoji].length === 0) delete rx[emoji];
        } else {
          rx[emoji] = [...list, userId];
        }
        return { ...m, reactions: rx };
      }
      return m;
    });
    safeSave(storageKey, updated);

    if (db && !messageId.startsWith('msg_')) {
      try {
        const target = updated.find(m => m.id === messageId);
        if (target) {
          await updateDoc(doc(db, 'contract_messages', messageId), {
            reactions: target.reactions || {}
          });
        }
      } catch (err) {
        console.warn("Firestore toggleMessageReaction failed:", err);
      }
    }
  },

  async pinContractMessage(messageId: string, projectId: string, isPinned: boolean) {
    const storageKey = `suredev_messages_${projectId}`;
    const stored = safeLoad<ContractMessage[]>(storageKey, []);
    const updated = stored.map(m => m.id === messageId ? { ...m, isPinned } : m);
    safeSave(storageKey, updated);

    if (db && !messageId.startsWith('msg_')) {
      try {
        await updateDoc(doc(db, 'contract_messages', messageId), { isPinned });
      } catch (err) {
        console.warn("Firestore pinContractMessage failed:", err);
      }
    }
  },

  async deleteContractMessage(messageId: string, projectId: string) {
    const storageKey = `suredev_messages_${projectId}`;
    const stored = safeLoad<ContractMessage[]>(storageKey, []);
    const updated = stored.filter(m => m.id !== messageId);
    safeSave(storageKey, updated);

    if (db && !messageId.startsWith('msg_')) {
      try {
        await deleteDoc(doc(db, 'contract_messages', messageId));
      } catch (err) {
        console.warn("Firestore deleteContractMessage failed:", err);
      }
    }
  },

  // 2. Files
  subscribeContractFiles(projectId: string, callback: (files: ContractFile[]) => void) {
    const storageKey = `suredev_files_${projectId}`;
    const syncLocal = () => callback(safeLoad<ContractFile[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'contract_files'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: ContractFile[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ContractFile);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async addContractFile(fileData: Omit<ContractFile, 'id' | 'createdAt'>) {
    const now = new Date().toISOString();
    const storageKey = `suredev_files_${fileData.projectId}`;
    const stored = safeLoad<ContractFile[]>(storageKey, []);
    const newFile: ContractFile = {
      ...fileData,
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now
    };

    stored.unshift(newFile);
    safeSave(storageKey, stored);

    if (db) {
      try {
        await addDoc(collection(db, 'contract_files'), {
          ...fileData,
          createdAt: now
        });
      } catch (err) {
        console.warn("Firestore addContractFile failed:", err);
      }
    }

    await this.addTimelineEvent(
      fileData.projectId,
      'File Uploaded',
      `${fileData.uploadedByName} uploaded asset "${fileData.name}".`,
      fileData.uploadedBy,
      fileData.uploadedByName,
      fileData.uploadedByRole
    );

    return newFile;
  },

  async deleteContractFile(fileId: string, projectId: string) {
    const storageKey = `suredev_files_${projectId}`;
    const stored = safeLoad<ContractFile[]>(storageKey, []);
    const updated = stored.filter(f => f.id !== fileId);
    safeSave(storageKey, updated);

    if (db && !fileId.startsWith('file_')) {
      try {
        await deleteDoc(doc(db, 'contract_files', fileId));
      } catch (err) {
        console.warn("Firestore deleteContractFile failed:", err);
      }
    }
  },

  async addContractFileComment(fileId: string, projectId: string, author: string, text: string) {
    const storageKey = `suredev_files_${projectId}`;
    const stored = safeLoad<ContractFile[]>(storageKey, []);
    const commentObj = { id: `c_${Date.now()}`, author, text, createdAt: new Date().toISOString() };
    const updated = stored.map(f => {
      if (f.id === fileId) {
        return { ...f, comments: [...(f.comments || []), commentObj] };
      }
      return f;
    });
    safeSave(storageKey, updated);

    if (db && !fileId.startsWith('file_')) {
      try {
        const target = updated.find(f => f.id === fileId);
        if (target) {
          await updateDoc(doc(db, 'contract_files', fileId), {
            comments: target.comments
          });
        }
      } catch (err) {
        console.warn("Firestore addContractFileComment failed:", err);
      }
    }
  },

  // 3. Milestones
  subscribeContractMilestones(projectId: string, callback: (ms: ContractMilestone[]) => void) {
    const storageKey = `suredev_milestones_${projectId}`;
    const syncLocal = () => callback(safeLoad<ContractMilestone[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'contract_milestones'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'asc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: ContractMilestone[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ContractMilestone);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async createContractMilestone(m: Omit<ContractMilestone, 'id' | 'createdAt' | 'updatedAt'>, actorId: string, actorName: string, actorRole: 'employer' | 'developer') {
    const now = new Date().toISOString();
    const storageKey = `suredev_milestones_${m.projectId}`;
    const stored = safeLoad<ContractMilestone[]>(storageKey, []);
    const newMs: ContractMilestone = {
      ...m,
      id: `ms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now,
      updatedAt: now
    };

    stored.push(newMs);
    safeSave(storageKey, stored);

    if (db) {
      try {
        await addDoc(collection(db, 'contract_milestones'), {
          ...m,
          createdAt: now,
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore createContractMilestone failed:", err);
      }
    }

    await this.addTimelineEvent(
      m.projectId,
      'Milestone Created',
      `Milestone "${m.title}" was created by ${actorName}.`,
      actorId,
      actorName,
      actorRole
    );

    return newMs;
  },

  async updateContractMilestone(milestoneId: string, projectId: string, updates: Partial<ContractMilestone>, actorId: string, actorName: string, actorRole: 'employer' | 'developer') {
    const now = new Date().toISOString();
    const storageKey = `suredev_milestones_${projectId}`;
    const stored = safeLoad<ContractMilestone[]>(storageKey, []);
    const updated = stored.map(m => m.id === milestoneId ? { ...m, ...updates, updatedAt: now } : m);
    safeSave(storageKey, updated);

    if (db && !milestoneId.startsWith('ms_')) {
      try {
        await updateDoc(doc(db, 'contract_milestones', milestoneId), {
          ...updates,
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore updateContractMilestone failed:", err);
      }
    }

    if (updates.status === 'Approved') {
      await this.addTimelineEvent(
        projectId,
        'Milestone Completed',
        `Milestone status set to Approved by ${actorName}.`,
        actorId,
        actorName,
        actorRole
      );
    } else if (updates.status === 'Revision Requested') {
      await this.addTimelineEvent(
        projectId,
        'Revision Requested',
        `Revision requested for milestone by ${actorName}.`,
        actorId,
        actorName,
        actorRole
      );
    }
  },

  // 4. Deliverables
  subscribeContractDeliverables(projectId: string, callback: (delivs: ContractDeliverable[]) => void) {
    const storageKey = `suredev_deliverables_${projectId}`;
    const syncLocal = () => callback(safeLoad<ContractDeliverable[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'contract_deliverables'),
        where('projectId', '==', projectId),
        orderBy('submittedAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: ContractDeliverable[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ContractDeliverable);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async submitContractDeliverable(dData: Omit<ContractDeliverable, 'id' | 'submittedAt'>, actorId: string, actorName: string) {
    const now = new Date().toISOString();
    const storageKey = `suredev_deliverables_${dData.projectId}`;
    const stored = safeLoad<ContractDeliverable[]>(storageKey, []);
    const newDeliv: ContractDeliverable = {
      ...dData,
      id: `deliv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      submittedAt: now
    };

    stored.unshift(newDeliv);
    safeSave(storageKey, stored);

    if (db) {
      try {
        await addDoc(collection(db, 'contract_deliverables'), {
          ...dData,
          submittedAt: now
        });
      } catch (err) {
        console.warn("Firestore submitContractDeliverable failed:", err);
      }
    }

    await this.addTimelineEvent(
      dData.projectId,
      'Deliverable Submitted',
      `${actorName} submitted project deliverable "${dData.title}".`,
      actorId,
      actorName,
      'developer'
    );

    return newDeliv;
  },

  async reviewContractDeliverable(deliverableId: string, projectId: string, status: 'Approved' | 'Revision Requested' | 'Rejected', feedback: string, actorId: string, actorName: string) {
    const now = new Date().toISOString();
    const storageKey = `suredev_deliverables_${projectId}`;
    const stored = safeLoad<ContractDeliverable[]>(storageKey, []);
    const updated = stored.map(d => d.id === deliverableId ? { ...d, status, feedback, reviewedAt: now } : d);
    safeSave(storageKey, updated);

    if (db && !deliverableId.startsWith('deliv_')) {
      try {
        await updateDoc(doc(db, 'contract_deliverables', deliverableId), {
          status,
          feedback,
          reviewedAt: now
        });
      } catch (err) {
        console.warn("Firestore reviewContractDeliverable failed:", err);
      }
    }

    await this.addTimelineEvent(
      projectId,
      status === 'Approved' ? 'Project Completed' : 'Revision Requested',
      `Employer ${actorName} reviewed deliverable: ${status}. Feedback: "${feedback || 'None'}".`,
      actorId,
      actorName,
      'employer'
    );
  },

  // 5. Tasks (Kanban)
  subscribeContractTasks(projectId: string, callback: (tasks: KanbanTask[]) => void) {
    const storageKey = `suredev_tasks_${projectId}`;
    const syncLocal = () => callback(safeLoad<KanbanTask[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'contract_tasks'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'asc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: KanbanTask[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as KanbanTask);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async createContractTask(task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>, actorId: string, actorName: string, actorRole: 'employer' | 'developer') {
    const now = new Date().toISOString();
    const storageKey = `suredev_tasks_${task.projectId}`;
    const stored = safeLoad<KanbanTask[]>(storageKey, []);
    const newTask: KanbanTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now,
      updatedAt: now
    };

    stored.push(newTask);
    safeSave(storageKey, stored);

    if (db) {
      try {
        await addDoc(collection(db, 'contract_tasks'), {
          ...task,
          createdAt: now,
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore createContractTask failed:", err);
      }
    }

    await this.addTimelineEvent(
      task.projectId,
      'Task Updated',
      `New task "${task.title}" created in ${task.column.replace('_', ' ').toUpperCase()} by ${actorName}.`,
      actorId,
      actorName,
      actorRole
    );

    return newTask;
  },

  async updateContractTask(taskId: string, projectId: string, updates: Partial<KanbanTask>, actorId: string, actorName: string, actorRole: 'employer' | 'developer') {
    const now = new Date().toISOString();
    const storageKey = `suredev_tasks_${projectId}`;
    const stored = safeLoad<KanbanTask[]>(storageKey, []);
    const updated = stored.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: now } : t);
    safeSave(storageKey, updated);

    if (db && !taskId.startsWith('task_')) {
      try {
        await updateDoc(doc(db, 'contract_tasks', taskId), {
          ...updates,
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore updateContractTask failed:", err);
      }
    }

    if (updates.column) {
      await this.addTimelineEvent(
        projectId,
        'Task Updated',
        `Task moved to ${updates.column.replace('_', ' ').toUpperCase()} by ${actorName}.`,
        actorId,
        actorName,
        actorRole
      );
    }
  },

  async deleteContractTask(taskId: string, projectId: string) {
    const storageKey = `suredev_tasks_${projectId}`;
    const stored = safeLoad<KanbanTask[]>(storageKey, []);
    const updated = stored.filter(t => t.id !== taskId);
    safeSave(storageKey, updated);

    if (db && !taskId.startsWith('task_')) {
      try {
        await deleteDoc(doc(db, 'contract_tasks', taskId));
      } catch (err) {
        console.warn("Firestore deleteContractTask failed:", err);
      }
    }
  },

  // 6. Meetings
  subscribeContractMeetings(projectId: string, callback: (meetings: ContractMeeting[]) => void) {
    const storageKey = `suredev_meetings_${projectId}`;
    const syncLocal = () => callback(safeLoad<ContractMeeting[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'contract_meetings'),
        where('projectId', '==', projectId),
        orderBy('scheduledAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: ContractMeeting[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ContractMeeting);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async scheduleContractMeeting(meeting: Omit<ContractMeeting, 'id' | 'createdAt'>, actorRole: 'employer' | 'developer') {
    const now = new Date().toISOString();
    const storageKey = `suredev_meetings_${meeting.projectId}`;
    const stored = safeLoad<ContractMeeting[]>(storageKey, []);
    const newMeeting: ContractMeeting = {
      ...meeting,
      id: `mtg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now
    };

    stored.unshift(newMeeting);
    safeSave(storageKey, stored);

    if (db) {
      try {
        await addDoc(collection(db, 'contract_meetings'), {
          ...meeting,
          createdAt: now
        });
      } catch (err) {
        console.warn("Firestore scheduleContractMeeting failed:", err);
      }
    }

    await this.addTimelineEvent(
      meeting.projectId,
      'Meeting Started',
      `${meeting.type.toUpperCase()} Meeting "${meeting.title}" scheduled by ${meeting.hostName}.`,
      meeting.hostId,
      meeting.hostName,
      actorRole
    );

    return newMeeting;
  },

  async updateMeetingStatus(meetingId: string, projectId: string, status: ContractMeeting['status'], actorId: string, actorName: string, actorRole: 'employer' | 'developer') {
    const storageKey = `suredev_meetings_${projectId}`;
    const stored = safeLoad<ContractMeeting[]>(storageKey, []);
    const updated = stored.map(m => m.id === meetingId ? { ...m, status } : m);
    safeSave(storageKey, updated);

    if (db && !meetingId.startsWith('mtg_')) {
      try {
        await updateDoc(doc(db, 'contract_meetings', meetingId), { status });
      } catch (err) {
        console.warn("Firestore updateMeetingStatus failed:", err);
      }
    }

    if (status === 'live') {
      await this.addTimelineEvent(
        projectId,
        'Meeting Started',
        `Live call session commenced by ${actorName}.`,
        actorId,
        actorName,
        actorRole
      );
    } else if (status === 'ended') {
      await this.addTimelineEvent(
        projectId,
        'Meeting Ended',
        `Call session concluded by ${actorName}.`,
        actorId,
        actorName,
        actorRole
      );
    }
  },

  // 7. Change Requests
  subscribeContractChangeRequests(projectId: string, callback: (reqs: ContractChangeRequest[]) => void) {
    const storageKey = `suredev_change_requests_${projectId}`;
    const syncLocal = () => callback(safeLoad<ContractChangeRequest[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'contract_change_requests'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: ContractChangeRequest[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ContractChangeRequest);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async createContractChangeRequest(req: Omit<ContractChangeRequest, 'id' | 'createdAt'>) {
    const now = new Date().toISOString();
    const storageKey = `suredev_change_requests_${req.projectId}`;
    const stored = safeLoad<ContractChangeRequest[]>(storageKey, []);
    const newReq: ContractChangeRequest = {
      ...req,
      id: `cr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now
    };

    stored.unshift(newReq);
    safeSave(storageKey, stored);

    if (db) {
      try {
        await addDoc(collection(db, 'contract_change_requests'), {
          ...req,
          createdAt: now
        });
      } catch (err) {
        console.warn("Firestore createContractChangeRequest failed:", err);
      }
    }

    await this.addTimelineEvent(
      req.projectId,
      'Amendment Requested',
      `${req.requestedByName} requested a contract amendment: "${req.reason}".`,
      req.requestedBy,
      req.requestedByName,
      req.requestedByRole
    );

    return newReq;
  },

  async respondToChangeRequest(requestId: string, projectId: string, newStatus: 'approved' | 'rejected', actorId: string, actorName: string, actorRole: 'employer' | 'developer') {
    const now = new Date().toISOString();
    const storageKey = `suredev_change_requests_${projectId}`;
    const stored = safeLoad<ContractChangeRequest[]>(storageKey, []);
    let targetReq: ContractChangeRequest | undefined;
    const updated = stored.map(r => {
      if (r.id === requestId) {
        targetReq = { ...r, status: newStatus, resolvedAt: now };
        return targetReq;
      }
      return r;
    });
    safeSave(storageKey, updated);

    if (db && !requestId.startsWith('cr_')) {
      try {
        await updateDoc(doc(db, 'contract_change_requests', requestId), {
          status: newStatus,
          resolvedAt: now
        });
      } catch (err) {
        console.warn("Firestore respondToChangeRequest failed:", err);
      }
    }

    // If approved, apply deadline / budget / scope updates to the project
    if (newStatus === 'approved' && targetReq) {
      const projStored = safeLoad<ManagedProject[]>('suredev_managed_projects', []);
      const updatedProjects = projStored.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            deadline: targetReq?.newDeadline || p.deadline,
            budget: targetReq?.newBudget || p.budget,
            scopeOfWork: targetReq?.newScope || p.scopeOfWork,
            updatedAt: now
          };
        }
        return p;
      });
      safeSave('suredev_managed_projects', updatedProjects);

      if (db) {
        try {
          await updateDoc(doc(db, 'projects', projectId), {
            deadline: targetReq.newDeadline || undefined,
            budget: targetReq.newBudget || undefined,
            scopeOfWork: targetReq.newScope || undefined,
            updatedAt: now
          });
        } catch (err) {
          console.warn("Firestore contract update from change request failed:", err);
        }
      }
    }

    await this.addTimelineEvent(
      projectId,
      'Contract Updated',
      `Contract Amendment Request was ${newStatus} by ${actorName}.`,
      actorId,
      actorName,
      actorRole
    );
  },

  // 8. Disputes
  subscribeContractDisputes(projectId: string, callback: (disputes: ContractDispute[]) => void) {
    const storageKey = `suredev_disputes_${projectId}`;
    const syncLocal = () => callback(safeLoad<ContractDispute[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'contract_disputes'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: ContractDispute[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ContractDispute);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async createContractDispute(disputeData: Omit<ContractDispute, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.openContractDispute(disputeData);
  },

  async openContractDispute(disputeData: Omit<ContractDispute, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const storageKey = `suredev_disputes_${disputeData.projectId}`;
    const stored = safeLoad<ContractDispute[]>(storageKey, []);
    const newDispute: ContractDispute = {
      ...disputeData,
      id: `disp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now,
      updatedAt: now
    };

    stored.unshift(newDispute);
    safeSave(storageKey, stored);

    if (db) {
      try {
        await addDoc(collection(db, 'contract_disputes'), {
          ...disputeData,
          createdAt: now,
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore openContractDispute failed:", err);
      }
    }

    await this.addTimelineEvent(
      disputeData.projectId,
      'Dispute Opened',
      `${disputeData.complainantName} opened a formal dispute (${disputeData.category}).`,
      disputeData.complainantId,
      disputeData.complainantName,
      disputeData.complainantRole
    );

    return newDispute;
  },

  // 9. Contract Completion Workflow
  async requestContractCompletion(projectId: string, actorRole: 'employer' | 'developer', actorName: string, actorId: string) {
    const now = new Date().toISOString();
    const stored = safeLoad<ManagedProject[]>('suredev_managed_projects', []);
    let updatedStatus: ProjectStatus = 'In Review';
    
    const updatedList = stored.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          status: updatedStatus,
          completionRequestedBy: actorRole,
          updatedAt: now
        };
      }
      return p;
    });
    safeSave('suredev_managed_projects', updatedList);

    if (db) {
      try {
        await updateDoc(doc(db, 'projects', projectId), {
          status: updatedStatus,
          completionRequestedBy: actorRole,
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore requestContractCompletion failed:", err);
      }
    }

    await this.addTimelineEvent(
      projectId,
      'Deliverable Submitted',
      `${actorName} (${actorRole}) submitted final project completion request.`,
      actorId,
      actorName,
      actorRole
    );
  },

  async confirmContractCompletion(projectId: string, actorName: string, actorId: string, actorRole: 'employer' | 'developer') {
    const now = new Date().toISOString();
    const stored = safeLoad<ManagedProject[]>('suredev_managed_projects', []);
    
    const updatedList = stored.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          status: 'Completed' as ProjectStatus,
          updatedAt: now
        };
      }
      return p;
    });
    safeSave('suredev_managed_projects', updatedList);

    if (db) {
      try {
        await updateDoc(doc(db, 'projects', projectId), {
          status: 'Completed',
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore confirmContractCompletion failed:", err);
      }
    }

    await this.addTimelineEvent(
      projectId,
      'Project Completed',
      `Contract officially marked as Completed and confirmed by ${actorName}. Workspace switched to Read-Only mode.`,
      actorId,
      actorName,
      actorRole
    );
  },

  // 10. Extended Reviews
  subscribeContractReviews(projectId: string, callback: (reviews: ExtendedReview[]) => void) {
    const storageKey = `suredev_reviews_${projectId}`;
    const syncLocal = () => callback(safeLoad<ExtendedReview[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'contract_reviews'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snapshot) => {
        const list: ExtendedReview[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ExtendedReview);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async submitExtendedContractReview(reviewData: Omit<ExtendedReview, 'id' | 'createdAt'>) {
    const now = new Date().toISOString();
    const storageKey = `suredev_reviews_${reviewData.projectId}`;
    const stored = safeLoad<ExtendedReview[]>(storageKey, []);
    const newReview: ExtendedReview = {
      ...reviewData,
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now
    };

    stored.unshift(newReview);
    safeSave(storageKey, stored);

    if (db) {
      try {
        await addDoc(collection(db, 'contract_reviews'), {
          ...reviewData,
          createdAt: now
        });
      } catch (err) {
        console.warn("Firestore submitExtendedContractReview failed:", err);
      }
    }

    await this.addTimelineEvent(
      reviewData.projectId,
      'Milestone Completed',
      `${reviewData.reviewerName} submitted a formal contract evaluation rating (${reviewData.rating || reviewData.overallRating}/5 stars).`,
      reviewData.reviewerId,
      reviewData.reviewerName,
      reviewData.reviewerRole
    );

    return newReview;
  },

  // 11. Real-time Presence Engine
  subscribeWorkspacePresence(projectId: string, callback: (presences: WorkspacePresence[]) => void) {
    const storageKey = `suredev_presence_${projectId}`;
    const syncLocal = () => callback(safeLoad<WorkspacePresence[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'workspace_presence'),
        where('projectId', '==', projectId)
      );
      return onSnapshot(q, (snapshot) => {
        const list: WorkspacePresence[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as any);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async updateUserPresence(
    projectId: string, 
    userId: string, 
    userName: string, 
    userRole: 'employer' | 'developer' | 'admin',
    status: PresenceStatus, 
    activity: ActiveActionType = 'idle',
    details?: string,
    activeTabId?: string
  ) {
    const now = new Date().toISOString();
    const docId = `${projectId}_${userId}`;
    const presenceData: WorkspacePresence & { projectId: string } = {
      projectId,
      userId,
      userName,
      userRole,
      status,
      currentActivity: activity,
      activityDetails: details,
      lastSeen: now,
      activeTabId,
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.platform} - ${navigator.userAgent.slice(0, 30)}` : 'Web Client'
    };

    const storageKey = `suredev_presence_${projectId}`;
    const list = safeLoad<WorkspacePresence[]>(storageKey, []);
    const idx = list.findIndex(p => p.userId === userId);
    if (idx >= 0) {
      list[idx] = presenceData;
    } else {
      list.push(presenceData);
    }
    safeSave(storageKey, list);

    if (db) {
      try {
        await setDoc(doc(db, 'workspace_presence', docId), presenceData, { merge: true });
      } catch (err) {
        console.warn("Firestore updateUserPresence failed:", err);
      }
    }
  },

  // 12. Bookmarks
  subscribeWorkspaceBookmarks(projectId: string, userId: string, callback: (bookmarks: WorkspaceBookmark[]) => void) {
    const storageKey = `suredev_bookmarks_${projectId}_${userId}`;
    const syncLocal = () => callback(safeLoad<WorkspaceBookmark[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'workspace_bookmarks'),
        where('projectId', '==', projectId),
        where('userId', '==', userId)
      );
      return onSnapshot(q, (snapshot) => {
        const list: WorkspaceBookmark[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as WorkspaceBookmark);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async toggleBookmark(bookmark: Omit<WorkspaceBookmark, 'id' | 'createdAt'>) {
    const now = new Date().toISOString();
    const storageKey = `suredev_bookmarks_${bookmark.projectId}_${bookmark.userId}`;
    const list = safeLoad<WorkspaceBookmark[]>(storageKey, []);
    const existingIdx = list.findIndex(b => b.itemId === bookmark.itemId && b.itemType === bookmark.itemType);

    if (existingIdx >= 0) {
      const removed = list.splice(existingIdx, 1)[0];
      safeSave(storageKey, list);
      if (db && removed.id) {
        try {
          await deleteDoc(doc(db, 'workspace_bookmarks', removed.id));
        } catch (err) { console.warn("Firestore delete bookmark failed:", err); }
      }
      return false; // Removed
    } else {
      const id = `bm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newBookmark: WorkspaceBookmark = { ...bookmark, id, createdAt: now };
      list.unshift(newBookmark);
      safeSave(storageKey, list);

      if (db) {
        try {
          await setDoc(doc(db, 'workspace_bookmarks', id), newBookmark);
        } catch (err) { console.warn("Firestore create bookmark failed:", err); }
      }
      return true; // Added
    }
  },

  // 13. Favorites
  subscribeWorkspaceFavorites(projectId: string, userId: string, callback: (favorites: WorkspaceFavorite[]) => void) {
    const storageKey = `suredev_favorites_${projectId}_${userId}`;
    const syncLocal = () => callback(safeLoad<WorkspaceFavorite[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'workspace_favorites'),
        where('projectId', '==', projectId),
        where('userId', '==', userId)
      );
      return onSnapshot(q, (snapshot) => {
        const list: WorkspaceFavorite[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as WorkspaceFavorite);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async toggleFavorite(favorite: Omit<WorkspaceFavorite, 'id' | 'createdAt'>) {
    const now = new Date().toISOString();
    const storageKey = `suredev_favorites_${favorite.projectId}_${favorite.userId}`;
    const list = safeLoad<WorkspaceFavorite[]>(storageKey, []);
    const existingIdx = list.findIndex(f => f.itemId === favorite.itemId && f.itemType === favorite.itemType);

    if (existingIdx >= 0) {
      const removed = list.splice(existingIdx, 1)[0];
      safeSave(storageKey, list);
      if (db && removed.id) {
        try { await deleteDoc(doc(db, 'workspace_favorites', removed.id)); } catch (err) { console.warn(err); }
      }
      return false;
    } else {
      const id = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newFav: WorkspaceFavorite = { ...favorite, id, createdAt: now };
      list.unshift(newFav);
      safeSave(storageKey, list);

      if (db) {
        try { await setDoc(doc(db, 'workspace_favorites', id), newFav); } catch (err) { console.warn(err); }
      }
      return true;
    }
  },

  // 14. Recent Items
  subscribeRecentItems(projectId: string, userId: string, callback: (items: RecentItem[]) => void) {
    const storageKey = `suredev_recents_${projectId}_${userId}`;
    const syncLocal = () => callback(safeLoad<RecentItem[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'recent_items'),
        where('projectId', '==', projectId),
        where('userId', '==', userId),
        orderBy('viewedAt', 'desc'),
        limit(20)
      );
      return onSnapshot(q, (snapshot) => {
        const list: RecentItem[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as RecentItem);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  async recordRecentItem(item: Omit<RecentItem, 'id' | 'viewedAt'>) {
    const now = new Date().toISOString();
    const storageKey = `suredev_recents_${item.projectId}_${item.userId}`;
    let list = safeLoad<RecentItem[]>(storageKey, []);
    
    // Deduplicate
    list = list.filter(i => !(i.itemId === item.itemId && i.itemType === item.itemType));
    const newItem: RecentItem = {
      ...item,
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      viewedAt: now
    };
    list.unshift(newItem);
    if (list.length > 20) list = list.slice(0, 20);
    safeSave(storageKey, list);

    if (db) {
      try {
        await setDoc(doc(db, 'recent_items', newItem.id), newItem);
      } catch (err) {
        console.warn("Firestore recordRecentItem failed:", err);
      }
    }
  },

  // 15. Autosave Engine
  async saveDraft(projectId: string, userId: string, fieldKey: string, content: any) {
    const now = new Date().toISOString();
    const storageKey = `suredev_draft_${projectId}_${userId}_${fieldKey}`;
    const draft: AutosaveDraft = {
      id: `${projectId}_${userId}_${fieldKey}`,
      projectId,
      userId,
      fieldKey,
      content,
      updatedAt: now
    };
    safeSave(storageKey, draft);

    if (db) {
      try {
        await setDoc(doc(db, 'workspace_drafts', draft.id), draft, { merge: true });
      } catch (err) {
        console.warn("Firestore saveDraft failed:", err);
      }
    }
    return draft;
  },

  getDraft(projectId: string, userId: string, fieldKey: string): AutosaveDraft | null {
    const storageKey = `suredev_draft_${projectId}_${userId}_${fieldKey}`;
    return safeLoad<AutosaveDraft | null>(storageKey, null);
  },

  async clearDraft(projectId: string, userId: string, fieldKey: string) {
    const storageKey = `suredev_draft_${projectId}_${userId}_${fieldKey}`;
    safeSave(storageKey, null);
    if (db) {
      try {
        await deleteDoc(doc(db, 'workspace_drafts', `${projectId}_${userId}_${fieldKey}`));
      } catch (err) { console.warn("Firestore clearDraft failed:", err); }
    }
  },

  // 16. Access Logs & Security Audit
  async logWorkspaceAccess(logData: Omit<WorkspaceAccessLog, 'id' | 'timestamp'>) {
    const now = new Date().toISOString();
    const storageKey = `suredev_access_logs_${logData.projectId}`;
    const list = safeLoad<WorkspaceAccessLog[]>(storageKey, []);
    const newLog: WorkspaceAccessLog = {
      ...logData,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: now
    };
    list.unshift(newLog);
    if (list.length > 100) list.pop();
    safeSave(storageKey, list);

    if (db) {
      try {
        await addDoc(collection(db, 'workspace_access_logs'), newLog);
      } catch (err) {
        console.warn("Firestore logWorkspaceAccess failed:", err);
      }
    }
  },

  subscribeWorkspaceAccessLogs(projectId: string, callback: (logs: WorkspaceAccessLog[]) => void) {
    const storageKey = `suredev_access_logs_${projectId}`;
    const syncLocal = () => callback(safeLoad<WorkspaceAccessLog[]>(storageKey, []));

    if (!db) {
      syncLocal();
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'workspace_access_logs'),
        where('projectId', '==', projectId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      return onSnapshot(q, (snapshot) => {
        const list: WorkspaceAccessLog[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() } as WorkspaceAccessLog);
        });
        safeSave(storageKey, list);
        callback(list);
      }, () => syncLocal());
    } catch (err) {
      syncLocal();
      return () => {};
    }
  },

  // 17. Archiving & Restoring
  async archiveWorkspace(projectId: string, actorId: string, actorName: string, actorRole: string) {
    const now = new Date().toISOString();
    if (db) {
      try {
        await updateDoc(doc(db, 'projects', projectId), {
          status: 'Cancelled',
          isArchived: true,
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore archiveWorkspace failed:", err);
      }
    }

    await this.addTimelineEvent(
      projectId,
      'Contract Updated',
      `Workspace officially archived by ${actorName} (${actorRole}). All assets converted to read-only mode.`,
      actorId,
      actorName,
      actorRole
    );
  },

  async restoreWorkspace(projectId: string, actorId: string, actorName: string, actorRole: string) {
    const now = new Date().toISOString();
    if (db) {
      try {
        await updateDoc(doc(db, 'projects', projectId), {
          status: 'In Progress',
          isArchived: false,
          updatedAt: now
        });
      } catch (err) {
        console.warn("Firestore restoreWorkspace failed:", err);
      }
    }

    await this.addTimelineEvent(
      projectId,
      'Contract Updated',
      `Workspace restored and reactivated by ${actorName} (${actorRole}).`,
      actorId,
      actorName,
      actorRole
    );
  },

  // --- EMPLOYER PROJECT POSTS (PHASE 1) ---
  async createProjectPost(postData: Partial<ProjectPost>, ownerId: string): Promise<ProjectPost> {
    const id = `post-${Date.now()}`;
    const now = new Date().toISOString();
    const fullPost: ProjectPost = {
      id,
      postId: id,
      employerId: ownerId,
      employerName: postData.employerName || 'Employer',
      employerProfileImage: postData.employerProfileImage || undefined,
      title: postData.title || '',
      description: postData.description || '',
      imageUrl: postData.imageUrl || null,
      skills: postData.skills || [],
      budget: postData.budget || '',
      deadline: postData.deadline || '',
      status: postData.status || 'active',
      createdAt: now,
      updatedAt: now,
    };

    // Save to local storage cache for instant UI feedback
    const posts = safeLoad('suredev_project_posts', []);
    posts.unshift(fullPost);
    safeSave('suredev_project_posts', posts);

    if (db) {
      try {
        const docRef = doc(db, 'projectPosts', id);
        await setDoc(docRef, withMetadata(cleanPayload(fullPost), ownerId));
      } catch (err: any) {
        console.warn("Firestore createProjectPost failed:", err);
        throw err;
      }
    }

    return fullPost;
  },

  subscribeProjectPosts(callback: (posts: ProjectPost[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad('suredev_project_posts', []);
      callback(stored);
    };

    // Always emit cached local state immediately for instant 0ms UI load
    syncLocal();

    if (!db) {
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(collection(db, 'projectPosts'), orderBy('createdAt', 'desc'));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: ProjectPost[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ProjectPost);
        });
        safeSave('suredev_project_posts', list);
        callback(list);
      }, (error) => {
        console.warn("Firestore projectPosts live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore projectPosts subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  // --- PROJECT APPLICATIONS (PHASE 3) ---
  async submitProjectApplication(
    appData: Omit<ProjectApplication, 'id' | 'applicationId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<ProjectApplication> {
    const id = `app-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    const fullApp: ProjectApplication = {
      ...appData,
      id,
      applicationId: id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Check duplicate in Firestore if available, otherwise check local
    if (db) {
      try {
        const dupQuery = query(
          collection(db, 'projectApplications'),
          where('projectId', '==', appData.projectId),
          where('developerId', '==', appData.developerId)
        );
        const dupSnap = await getDocs(dupQuery);
        if (!dupSnap.empty) {
          throw new Error('You have already applied for this project.');
        }
      } catch (dupErr: any) {
        if (dupErr?.message === 'You have already applied for this project.') {
          throw dupErr;
        }
        console.warn("Duplicate application check warning:", dupErr);
      }
    } else {
      const stored = safeLoad<ProjectApplication[]>('suredev_project_applications', []);
      const exists = stored.some(a => a.projectId === appData.projectId && a.developerId === appData.developerId);
      if (exists) {
        throw new Error('You have already applied for this project.');
      }
    }

    // 2. Save directly to Firestore collection 'projectApplications'
    if (db) {
      try {
        const docRef = doc(db, 'projectApplications', id);
        const payload = withMetadata(cleanPayload(fullApp), appData.developerId);
        await setDoc(docRef, payload);
      } catch (err: any) {
        console.error("Firestore submitProjectApplication failed:", err);
        throw new Error(err?.message || 'Failed to persist application in Firestore.');
      }
    }

    // 3. Update local cache ONLY AFTER Firestore write succeeds
    const stored = safeLoad<ProjectApplication[]>('suredev_project_applications', []);
    const filtered = stored.filter(a => !(a.projectId === appData.projectId && a.developerId === appData.developerId));
    filtered.unshift(fullApp);
    safeSave('suredev_project_applications', filtered);

    // 4. Create notification for the employer (non-blocking)
    try {
      await this.createNotification(
        appData.employerId,
        'project_application',
        'New Project Application',
        `${appData.developerName} applied for your project "${appData.projectTitle}".`,
        appData.developerId
      );
    } catch (notifErr) {
      console.warn("Failed to create notification for employer:", notifErr);
    }

    return fullApp;
  },

  subscribeDeveloperApplications(developerId: string, callback: (apps: ProjectApplication[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad<ProjectApplication[]>('suredev_project_applications', []);
      const devApps = stored.filter(a => a.developerId === developerId);
      callback(devApps);
    };

    // Always emit cached local state immediately for instant 0ms UI load
    syncLocal();

    if (!db) {
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(
        collection(db, 'projectApplications'),
        where('developerId', '==', developerId)
      );
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: ProjectApplication[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ProjectApplication);
        });
        // Merge into local cache
        const allStored = safeLoad<ProjectApplication[]>('suredev_project_applications', []);
        const otherApps = allStored.filter(a => a.developerId !== developerId);
        const combined = [...list, ...otherApps];
        safeSave('suredev_project_applications', combined);
        callback(list);
      }, (error) => {
        console.warn("Firestore developer applications live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore developer applications subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  subscribeEmployerApplications(employerId: string, callback: (apps: ProjectApplication[]) => void) {
    const syncLocal = () => {
      const stored = safeLoad<ProjectApplication[]>('suredev_project_applications', []);
      const empApps = stored.filter(a => a.employerId === employerId);
      callback(empApps);
    };

    // Always emit cached local state immediately for instant 0ms UI load
    syncLocal();

    if (!db) {
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    let isSnapshotFired = false;
    let unsubFirestore = () => {};

    try {
      const q = query(
        collection(db, 'projectApplications'),
        where('employerId', '==', employerId)
      );
      unsubFirestore = onSnapshot(q, (snapshot) => {
        isSnapshotFired = true;
        const list: ProjectApplication[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ProjectApplication);
        });
        // Merge into local cache
        const allStored = safeLoad<ProjectApplication[]>('suredev_project_applications', []);
        const otherApps = allStored.filter(a => a.employerId !== employerId);
        const combined = [...list, ...otherApps];
        safeSave('suredev_project_applications', combined);
        callback(list);
      }, (error) => {
        console.warn("Firestore employer applications live sync failed or offline:", error);
        if (!isSnapshotFired) {
          syncLocal();
          window.addEventListener('storage', syncLocal);
        }
      });
    } catch (err) {
      console.warn("Firestore employer applications subscription failed:", err);
      syncLocal();
      window.addEventListener('storage', syncLocal);
      return () => window.removeEventListener('storage', syncLocal);
    }

    return () => {
      unsubFirestore();
      window.removeEventListener('storage', syncLocal);
    };
  },

  async updateProjectApplicationStatus(
    applicationId: string,
    status: 'accepted' | 'rejected',
    actorId: string,
    providedAppData?: Partial<ProjectApplication>
  ): Promise<{ success: boolean; projectId?: string }> {
    const now = new Date().toISOString();

    // 1. Resolve Target Application from local cache, Firestore, or fallback
    const stored = safeLoad<ProjectApplication[]>('suredev_project_applications', []);
    let target = stored.find(a => a.id === applicationId || a.applicationId === applicationId);

    if (!target && db) {
      try {
        const appDocSnap = await getDoc(doc(db, 'projectApplications', applicationId));
        if (appDocSnap.exists()) {
          target = { id: appDocSnap.id, ...appDocSnap.data() } as ProjectApplication;
        }
      } catch (e) {
        console.warn("Could not fetch application doc from Firestore:", e);
      }
    }

    if (!target && providedAppData) {
      target = {
        id: applicationId,
        applicationId: applicationId,
        ...providedAppData
      } as ProjectApplication;
    }

    if (!target) {
      throw new Error("Application not found.");
    }

    let createdProjectId: string | undefined = target.createdProjectId;

    // 2. If accepting, trigger existing Managed Project creation flow (IDEMPOTENT)
    if (status === 'accepted') {
      // Check if project already exists for this application to prevent duplicates
      const managedProjects = safeLoad<ManagedProject[]>('suredev_managed_projects', []);
      let existingProj = managedProjects.find(
        p => p.sourceApplicationId === applicationId || (target?.createdProjectId && p.id === target.createdProjectId)
      );

      if (!existingProj && db) {
        try {
          if (target.createdProjectId) {
            const snap = await getDoc(doc(db, 'projects', target.createdProjectId));
            if (snap.exists()) {
              existingProj = { id: snap.id, ...snap.data() } as ManagedProject;
            }
          }
          if (!existingProj) {
            const q = query(collection(db, 'projects'), where('sourceApplicationId', '==', applicationId));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              existingProj = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as ManagedProject;
            }
          }
        } catch (projCheckErr) {
          console.warn("Could not query existing project for application:", projCheckErr);
        }
      }

      if (existingProj) {
        createdProjectId = existingProj.id;
        if (existingProj.status === 'Pending') {
          await this.updateProjectStatus(
            existingProj.id,
            'Active',
            actorId,
            target.employerName || 'Employer',
            'employer'
          );
        }
      } else {
        // Fetch Employer details
        let employerName = target.employerName || 'SureDev Employer';
        let employerLogo = '';
        try {
          const empProfile = await this.getEmployerProfile(target.employerId || actorId);
          if (empProfile) {
            employerName = empProfile.companyName || empProfile.contactPerson || employerName;
            employerLogo = empProfile.companyLogo || empProfile.profileImageUrl || '';
          }
        } catch (e) {
          console.warn("Error fetching employer profile during application acceptance:", e);
        }

        // Fetch Developer details (avatar, skills)
        let developerAvatar = target.developerProfileImage || '';
        let developerSkills: string[] = [];
        try {
          const devProfile = await this.getDeveloperProfile(target.developerId);
          if (devProfile) {
            if (!developerAvatar) developerAvatar = devProfile.avatar || devProfile.profileImageUrl || '';
            if (devProfile.skills && devProfile.skills.length > 0) developerSkills = devProfile.skills;
          }
        } catch (e) {
          console.warn("Error fetching developer profile during application acceptance:", e);
        }

        // Fetch source Project Post for skills, description, budget fallbacks
        let postSkills: string[] = [];
        let postDescription = '';
        let postBudget = '';
        let postDeadline = '';
        if (target.projectId) {
          const localPosts = safeLoad<ProjectPost[]>('suredev_project_posts', []);
          const matchedPost = localPosts.find(p => p.id === target?.projectId || p.postId === target?.projectId);
          if (matchedPost) {
            postSkills = matchedPost.skills || [];
            postDescription = matchedPost.description || '';
            postBudget = matchedPost.budget || '';
            postDeadline = matchedPost.deadline || '';
          } else if (db) {
            try {
              const pSnap = await getDoc(doc(db, 'projectPosts', target.projectId));
              if (pSnap.exists()) {
                const postData = pSnap.data();
                postSkills = postData.skills || [];
                postDescription = postData.description || '';
                postBudget = postData.budget || '';
                postDeadline = postData.deadline || '';
              }
            } catch (postErr) {
              console.warn("Could not fetch project post during acceptance:", postErr);
            }
          }
        }

        const projectSkills = postSkills.length > 0
          ? postSkills
          : (developerSkills.length > 0 ? developerSkills.slice(0, 3) : ['React', 'TypeScript', 'Node.js']);

        const projectBudget = target.proposedBudget || postBudget || 'Fixed Scope';
        const projectDeadline = target.estimatedCompletionTime || postDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const projectDescription = target.proposal
          ? `Proposal from ${target.developerName}:\n\n${target.proposal}`
          : (postDescription || `Project: ${target.projectTitle}`);

        // CALL EXISTING createManagedProject METHOD with status: 'Active'
        const newProject = await this.createManagedProject({
          employerId: target.employerId || actorId,
          developerId: target.developerId,
          employerName,
          developerName: target.developerName,
          employerLogo,
          developerAvatar,
          title: target.projectTitle,
          description: projectDescription,
          budget: projectBudget,
          deadline: projectDeadline,
          requiredSkills: projectSkills,
          notes: target.experience ? `Relevant Experience: ${target.experience}` : (target.proposal ? `Proposal: ${target.proposal}` : ''),
          sourceApplicationId: applicationId,
          sourcePostId: target.projectId,
          status: 'Active',
        });

        createdProjectId = newProject.id;
      }
    }

    // 3. Update local application cache
    target.status = status;
    if (createdProjectId) {
      target.createdProjectId = createdProjectId;
    }
    target.updatedAt = now;

    const targetIdx = stored.findIndex(a => a.id === applicationId || a.applicationId === applicationId);
    if (targetIdx !== -1) {
      stored[targetIdx] = { ...target };
    } else {
      stored.unshift(target);
    }
    safeSave('suredev_project_applications', stored);

    // 4. Update Firestore
    if (db) {
      try {
        const docRef = doc(db, 'projectApplications', applicationId);
        const updatePayload: any = {
          status,
          updatedAt: now
        };
        if (createdProjectId) {
          updatePayload.createdProjectId = createdProjectId;
        }
        await updateDoc(docRef, updatePayload);
      } catch (err) {
        console.warn("Firestore updateProjectApplicationStatus failed:", err);
      }
    }

    // 5. Send notification to the developer
    const notifTitle = status === 'accepted' ? 'Application Accepted 🎉' : 'Application Status Update';
    const notifText = status === 'accepted' 
      ? `Congratulations! Your application for "${target.projectTitle}" was accepted. A new project workspace has been created.`
      : `Your application for "${target.projectTitle}" was not accepted.`;
    
    try {
      await this.createNotification(
        target.developerId,
        `application_${status}`,
        notifTitle,
        notifText,
        actorId,
        createdProjectId
      );
    } catch (notifErr) {
      console.warn("Could not dispatch acceptance notification:", notifErr);
    }

    return { success: true, projectId: createdProjectId };
  }
};

