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
  sendEmailVerification
} from './firebase';
import { Developer, Employer, CollabRequest, Project } from '../types';
import { DEVELOPERS, EMPLOYERS } from '../data';

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

// ==========================================
// 2. STORAGE MANAGEMENT
// ==========================================
export async function uploadFileToStorage(
  file: File,
  path: string,
  oldFileUrl?: string
): Promise<string> {
  if (!storage) {
    // Fallback to base64 only if Firebase is completely absent (for type safety during builds)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  let uploadData: Blob | File = file;
  if (file.type.startsWith('image/')) {
    try {
      uploadData = await compressImage(file);
    } catch (e) {
      console.warn('Image compression failed, using original file', e);
    }
  }

  // Delete old file if it resides in Firebase Storage to prevent leaks
  if (oldFileUrl && oldFileUrl.includes('firebasestorage.googleapis.com')) {
    try {
      const decodedUrl = decodeURIComponent(oldFileUrl);
      const startIdx = decodedUrl.indexOf('/o/') + 3;
      const endIdx = decodedUrl.indexOf('?');
      if (startIdx > 2 && endIdx > startIdx) {
        const oldStoragePath = decodedUrl.substring(startIdx, endIdx);
        const oldRef = ref(storage, oldStoragePath);
        await deleteObject(oldRef);
        console.log('Auto-deleted superseded file from storage:', oldStoragePath);
      }
    } catch (error) {
      console.warn('Failed to auto-cleanup old file in storage:', error);
    }
  }

  const uniqueName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const fileRef = ref(storage, `${path}/${uniqueName}`);
  await uploadBytes(fileRef, uploadData);
  const downloadUrl = await getDownloadURL(fileRef);
  return downloadUrl;
}

export async function uploadProfileImage(
  uid: string,
  file: File,
  accountType: 'developer' | 'employer',
  onProgress?: (progress: number) => void
): Promise<string> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Only JPG, JPEG, PNG, and WebP images are allowed.');
  }

  // Validate size
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds the 5MB limit.');
  }

  if (!storage) {
    // Local storage fallback when Firebase is not configured
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            // Save in local storage
            if (accountType === 'developer') {
              const profile = safeLoad(`developer_profile_${uid}`, null);
              if (profile) {
                profile.avatar = base64;
                profile.profileImageUrl = base64;
                profile.hasCustomProfileImage = true;
                safeSave(`developer_profile_${uid}`, profile);
              }
            } else {
              const profile = safeLoad(`employer_profile_${uid}`, null);
              if (profile) {
                profile.companyLogo = base64;
                profile.profileImageUrl = base64;
                profile.hasCustomProfileImage = true;
                safeSave(`employer_profile_${uid}`, profile);
              }
            }
            
            const userDoc = safeLoad(`user_doc_${uid}`, null) || {};
            userDoc.profileImageUrl = base64;
            userDoc.hasCustomProfileImage = true;
            userDoc.updatedAt = new Date().toISOString();
            safeSave(`user_doc_${uid}`, userDoc);

            resolve(base64);
          };
          reader.readAsDataURL(file);
        }
      }, 100);
    });
  }

  // Compress the image before uploading
  let uploadData: Blob | File = file;
  try {
    uploadData = await compressImage(file, 800, 800, 0.85);
  } catch (e) {
    console.warn('Image compression failed, using original file:', e);
  }

  const fileRef = ref(storage, `profilePictures/${uid}/profile.jpg`);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, uploadData);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error("Firebase Storage upload failed:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save in Firestore and local storage fallback
          if (db) {
            const userDocRef = doc(db, 'users', uid);
            await setDoc(userDocRef, {
              profileImageUrl: downloadUrl,
              hasCustomProfileImage: true,
              updatedAt: serverTimestamp()
            }, { merge: true });

            if (accountType === 'developer') {
              const devDocRef = doc(db, 'developers', uid);
              await setDoc(devDocRef, {
                avatar: downloadUrl,
                profileImageUrl: downloadUrl,
                hasCustomProfileImage: true,
                updatedAt: serverTimestamp()
              }, { merge: true });
            } else {
              const empDocRef = doc(db, 'employers', uid);
              await setDoc(empDocRef, {
                companyLogo: downloadUrl,
                profileImageUrl: downloadUrl,
                hasCustomProfileImage: true,
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
          }

          // Update local state storage
          if (accountType === 'developer') {
            const profile = safeLoad(`developer_profile_${uid}`, null);
            if (profile) {
              profile.avatar = downloadUrl;
              profile.profileImageUrl = downloadUrl;
              profile.hasCustomProfileImage = true;
              safeSave(`developer_profile_${uid}`, profile);
            }
          } else {
            const profile = safeLoad(`employer_profile_${uid}`, null);
            if (profile) {
              profile.companyLogo = downloadUrl;
              profile.profileImageUrl = downloadUrl;
              profile.hasCustomProfileImage = true;
              safeSave(`employer_profile_${uid}`, profile);
            }
          }

          const userDoc = safeLoad(`user_doc_${uid}`, null) || {};
          userDoc.profileImageUrl = downloadUrl;
          userDoc.hasCustomProfileImage = true;
          userDoc.updatedAt = new Date().toISOString();
          safeSave(`user_doc_${uid}`, userDoc);

          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
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
    const localDoc = safeLoad(`user_doc_${uid}`, null);
    if (!db) return localDoc;
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        safeSave(`user_doc_${uid}`, data);
        return data;
      }
      return localDoc;
    } catch (error) {
      console.warn("Firestore getUserDoc failed, using localStorage fallback:", error);
      return localDoc;
    }
  },

  async getDeveloperProfile(uid: string) {
    let localProfile = safeLoad(`developer_profile_${uid}`, null);
    if (!localProfile) {
      const devs = safeLoad('suredev_developers', DEVELOPERS);
      localProfile = devs.find((d: any) => d.id === uid) || null;
    }
    if (!db) return localProfile;
    try {
      const docRef = doc(db, 'developers', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Developer;
        safeSave(`developer_profile_${uid}`, data);
        const devs = safeLoad('suredev_developers', DEVELOPERS);
        const index = devs.findIndex((d: any) => d.id === uid);
        if (index !== -1) {
          devs[index] = { ...devs[index], ...data };
        } else {
          devs.unshift(data);
        }
        safeSave('suredev_developers', devs);
        return data;
      }
      return localProfile;
    } catch (error) {
      console.warn("Firestore getDeveloperProfile failed, using localStorage fallback:", error);
      return localProfile;
    }
  },

  async getEmployerProfile(uid: string) {
    let localProfile = safeLoad(`employer_profile_${uid}`, null);
    if (!localProfile) {
      const emps = safeLoad('suredev_employers', EMPLOYERS);
      localProfile = emps.find((e: any) => e.id === uid) || null;
    }
    if (!db) return localProfile;
    try {
      const docRef = doc(db, 'employers', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Employer;
        safeSave(`employer_profile_${uid}`, data);
        const emps = safeLoad('suredev_employers', EMPLOYERS);
        const index = emps.findIndex((e: any) => e.id === uid);
        if (index !== -1) {
          emps[index] = { ...emps[index], ...data };
        } else {
          emps.unshift(data);
        }
        safeSave('suredev_employers', emps);
        return data;
      }
      return localProfile;
    } catch (error) {
      console.warn("Firestore getEmployerProfile failed, using localStorage fallback:", error);
      return localProfile;
    }
  },

  async createDefaultDeveloperProfile(uid: string, email: string, name: string) {
    const newDev: Developer = {
      id: uid,
      name: name || email.split('@')[0],
      title: 'Software Developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
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
    const userDoc = {
      accountType: 'developer',
      email,
      name: newDev.name,
      updatedAt: new Date().toISOString()
    };
    safeSave(`user_doc_${uid}`, userDoc);

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
    const newEmp: Employer = {
      id: uid,
      companyName: name ? `${name}'s Company` : `${email.split('@')[0]}'s Venture`,
      companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200&h=200',
      contactPerson: name || email.split('@')[0],
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
    const userDoc = {
      accountType: 'employer',
      email,
      name: newEmp.contactPerson,
      updatedAt: new Date().toISOString()
    };
    safeSave(`user_doc_${uid}`, userDoc);

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
        safeSave('suredev_developers', developersList);
        callback(developersList);
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
    const updatedDev = { ...existing, ...data, id: devId };
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
      updatedAt: new Date().toISOString()
    };
    safeSave(`user_doc_${ownerId}`, updatedUser);

    if (db) {
      try {
        const docRef = doc(db, 'developers', devId);
        await setDoc(docRef, withMetadata(data, ownerId), { merge: true });
        
        const userDocRef = doc(db, 'users', ownerId);
        await setDoc(userDocRef, {
          accountType: 'developer',
          email: data.email,
          name: data.name,
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
        safeSave('suredev_employers', employersList);
        callback(employersList);
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
    const updatedEmp = { ...existing, ...data, id: empId };
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
      updatedAt: new Date().toISOString()
    };
    safeSave(`user_doc_${ownerId}`, updatedUser);

    if (db) {
      try {
        const docRef = doc(db, 'employers', empId);
        await setDoc(docRef, withMetadata(data, ownerId), { merge: true });

        const userDocRef = doc(db, 'users', ownerId);
        await setDoc(userDocRef, {
          accountType: 'employer',
          email: data.email,
          name: data.contactPerson,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore saveEmployerProfile failed:", err);
      }
    }
  },

  // --- COLLABORATION REQUESTS ---
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
