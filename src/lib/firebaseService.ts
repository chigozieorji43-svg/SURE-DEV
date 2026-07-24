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
import { Developer, Employer, CollabRequest, Project } from '../types';
import { DEVELOPERS, EMPLOYERS } from '../data';
import { uploadToCloudinary } from './cloudinary';

// ==========================================
// 1. IMAGE COMPRESSION UTILITY
// ==========================================
export async function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
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
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
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
  _oldFileUrl?: string
): Promise<string> {
  let uploadData: Blob | File = file;
  if (file.type.startsWith('image/')) {
    try {
      uploadData = await compressImage(file);
    } catch (e) {
      console.warn('Image compression failed, using original file', e);
    }
    try {
      const res = await uploadToCloudinary({
        file: uploadData,
        folder: `suredev_uploads/${path}`
      });
      if (res.secure_url) {
        return res.secure_url;
      }
    } catch (err) {
      console.warn('Cloudinary image upload failed:', err);
      throw err;
    }
  }

  if (!storage) {
    return blobToBase64(uploadData);
  }

  try {
    const uniqueName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const fileRef = ref(storage, `${path}/${uniqueName}`);
    await uploadBytes(fileRef, uploadData);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (err) {
    console.warn('Storage upload failed:', err);
    throw err;
  }
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

  // 4. Upload to Cloudinary using unsigned preset 'SURE DEV' on cloud 'ojk0qrbo'
  try {
    const cloudinaryRes = await uploadToCloudinary({
      file: uploadData,
      onProgress,
      folder: `suredev_profiles/${accountType}s`,
      tags: ['suredev', accountType, uid]
    });

    const secureUrl = cloudinaryRes.secure_url;
    if (!secureUrl) {
      throw new Error('Cloudinary upload did not return a valid secure URL.');
    }

    console.log("Cloudinary secure_url:", secureUrl);

    // 5. Save returned secure_url to Firestore, Auth profile photoURL, and local stores
    await syncProfileImageData(uid, secureUrl, accountType);

    return secureUrl;
  } catch (error: any) {
    console.error('Cloudinary Profile Image Upload Error:', error);
    throw new Error(error?.message || 'Failed to upload profile image to Cloudinary.');
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

const safeLoad = (key: string, defaultVal: any) => {
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

// ==========================================
// 3. FIRESTORE DATABASE MUTATIONS & REALTIME QUERIES
// ==========================================

export const dbService = {
  // --- USER DOCS FOR ACCOUNT TYPES ---
  async getUserDoc(uid: string) {
    const localDoc = safeLoad(`user_doc_${uid}`, null) || {};
    let userDocData = localDoc;

    if (db) {
      try {
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          userDocData = { ...localDoc, ...snap.data() };
          safeSave(`user_doc_${uid}`, userDocData);
        }
      } catch (error) {
        console.warn("Firestore getUserDoc failed, using localStorage fallback:", error);
      }
    }

    // Fallback to Auth photoURL if photoURL is missing from userDoc
    if (auth && auth.currentUser && auth.currentUser.uid === uid && auth.currentUser.photoURL) {
      if (!userDocData.photoURL && !userDocData.profileImageUrl) {
        userDocData.photoURL = auth.currentUser.photoURL;
        userDocData.profileImageUrl = auth.currentUser.photoURL;
        userDocData.hasCustomProfileImage = true;
      }
    }

    return userDocData;
  },

  async getDeveloperProfile(uid: string) {
    let localProfile = safeLoad(`developer_profile_${uid}`, null);
    if (!localProfile) {
      const devs = safeLoad('suredev_developers', DEVELOPERS);
      localProfile = devs.find((d: any) => d.id === uid) || null;
    }

    let profileData = localProfile;

    if (db) {
      try {
        const docRef = doc(db, 'developers', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Developer;
          profileData = { ...localProfile, ...data };
        }
      } catch (error) {
        console.warn("Firestore getDeveloperProfile failed, using localStorage fallback:", error);
      }
    }

    // Source of Truth Fallback Check: Firestore Profile -> Firestore UserDoc -> Auth photoURL
    const userDoc = await this.getUserDoc(uid);
    const bestPhotoUrl = profileData?.profileImageUrl || profileData?.avatar || userDoc?.photoURL || userDoc?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null);

    if (profileData) {
      if (bestPhotoUrl && (!profileData.avatar || profileData.avatar.includes('unsplash.com') || profileData.avatar !== bestPhotoUrl)) {
        profileData.avatar = bestPhotoUrl;
        profileData.profileImageUrl = bestPhotoUrl;
        profileData.hasCustomProfileImage = true;
      }
      safeSave(`developer_profile_${uid}`, profileData);
      const devs = safeLoad('suredev_developers', DEVELOPERS);
      const index = devs.findIndex((d: any) => d.id === uid);
      if (index !== -1) {
        devs[index] = { ...devs[index], ...profileData };
      } else {
        devs.unshift(profileData);
      }
      safeSave('suredev_developers', devs);
    }

    return profileData;
  },

  async getEmployerProfile(uid: string) {
    let localProfile = safeLoad(`employer_profile_${uid}`, null);
    if (!localProfile) {
      const emps = safeLoad('suredev_employers', EMPLOYERS);
      localProfile = emps.find((e: any) => e.id === uid) || null;
    }

    let profileData = localProfile;

    if (db) {
      try {
        const docRef = doc(db, 'employers', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Employer;
          profileData = { ...localProfile, ...data };
        }
      } catch (error) {
        console.warn("Firestore getEmployerProfile failed, using localStorage fallback:", error);
      }
    }

    // Source of Truth Fallback Check: Firestore Profile -> Firestore UserDoc -> Auth photoURL
    const userDoc = await this.getUserDoc(uid);
    const bestPhotoUrl = profileData?.profileImageUrl || profileData?.companyLogo || userDoc?.photoURL || userDoc?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null);

    if (profileData) {
      if (bestPhotoUrl && (!profileData.companyLogo || profileData.companyLogo.includes('unsplash.com') || profileData.companyLogo !== bestPhotoUrl)) {
        profileData.companyLogo = bestPhotoUrl;
        profileData.profileImageUrl = bestPhotoUrl;
        profileData.hasCustomProfileImage = true;
      }
      safeSave(`employer_profile_${uid}`, profileData);
      const emps = safeLoad('suredev_employers', EMPLOYERS);
      const index = emps.findIndex((e: any) => e.id === uid);
      if (index !== -1) {
        emps[index] = { ...emps[index], ...profileData };
      } else {
        emps.unshift(profileData);
      }
      safeSave('suredev_employers', emps);
    }

    return profileData;
  },

  async createDefaultDeveloperProfile(uid: string, email: string, name: string) {
    const userDoc = await this.getUserDoc(uid);
    const existingPhoto = userDoc?.photoURL || userDoc?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null);

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
      accountType: 'developer',
      email,
      name: newDev.name,
      photoURL: existingPhoto || null,
      profileImageUrl: existingPhoto || null,
      hasCustomProfileImage: !!existingPhoto,
      updatedAt: new Date().toISOString()
    };
    safeSave(`user_doc_${uid}`, updatedUserDoc);

    if (db) {
      try {
        await this.saveDeveloperProfile(uid, newDev, uid);
      } catch (err) {
        console.warn("Firestore failed to save default developer profile:", err);
      }
    }
    return newDev;
  },

  async createDefaultEmployerProfile(uid: string, email: string, name: string) {
    const userDoc = await this.getUserDoc(uid);
    const existingPhoto = userDoc?.photoURL || userDoc?.profileImageUrl || (auth?.currentUser?.uid === uid ? auth.currentUser.photoURL : null);

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
      accountType: 'employer',
      email,
      name: newEmp.contactPerson,
      photoURL: existingPhoto || null,
      profileImageUrl: existingPhoto || null,
      hasCustomProfileImage: !!existingPhoto,
      updatedAt: new Date().toISOString()
    };
    safeSave(`user_doc_${uid}`, updatedUserDoc);

    if (db) {
      try {
        await this.saveEmployerProfile(uid, newEmp, uid);
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

    if (!db) {
      syncLocal();
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

    const userDoc = safeLoad(`user_doc_${ownerId}`, null) || {};
    const updatedUser = {
      ...userDoc,
      accountType: 'developer',
      email: data.email || userDoc.email,
      name: data.name || userDoc.name,
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
        await setDoc(docRef, withMetadata(data, ownerId), { merge: true });
        
        const userDocRef = doc(db, 'users', ownerId);
        await setDoc(userDocRef, {
          accountType: 'developer',
          email: data.email || userDoc.email,
          name: data.name || userDoc.name,
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

    if (!db) {
      syncLocal();
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

    const userDoc = safeLoad(`user_doc_${ownerId}`, null) || {};
    const updatedUser = {
      ...userDoc,
      accountType: 'employer',
      email: data.email || userDoc.email,
      name: data.contactPerson || userDoc.name,
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
        await setDoc(docRef, withMetadata(data, ownerId), { merge: true });

        const userDocRef = doc(db, 'users', ownerId);
        await setDoc(userDocRef, {
          accountType: 'employer',
          email: data.email || userDoc.email,
          name: data.contactPerson || userDoc.name,
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

    if (!db) {
      syncLocal();
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

  async createNotification(receiverId: string, type: string, title: string, text: string, senderId: string) {
    const payload = {
      id: `notif-${Date.now()}`,
      receiverId,
      type,
      title,
      text,
      senderId,
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
  }
};
