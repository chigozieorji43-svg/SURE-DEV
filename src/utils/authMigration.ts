import { db, collection, getDocs, doc, setDoc, deleteDoc } from '../lib/firebase';
import { authLogger } from './authLogger';

export interface MigrationReport {
  timestamp: string;
  totalUserDocs: number;
  developerRolesCount: number;
  employerRolesCount: number;
  missingRolesFixed: number;
  duplicateProfilesRemoved: number;
  invalidProfilesCleaned: number;
  status: 'SUCCESS' | 'FAILED';
  details: string[];
}

/**
 * Migration Script: Scans Firestore users, developers, and employers collections to ensure:
 * 1. Every /users/{uid} document has a valid role ("developer" | "employer").
 * 2. Every UID owns EXACTLY ONE profile matching its role.
 * 3. Removes any duplicate/orphan profiles (e.g., if a developer UID also has an employer doc).
 * 4. Repairs inconsistent records safely.
 */
export async function runAuthDataMigration(): Promise<MigrationReport> {
  const timestamp = new Date().toISOString();
  authLogger.info("Starting Auth Data & Account Separation Migration Scan...", { timestamp });

  const report: MigrationReport = {
    timestamp,
    totalUserDocs: 0,
    developerRolesCount: 0,
    employerRolesCount: 0,
    missingRolesFixed: 0,
    duplicateProfilesRemoved: 0,
    invalidProfilesCleaned: 0,
    status: 'SUCCESS',
    details: []
  };

  if (!db) {
    report.status = 'FAILED';
    report.details.push("Firestore database instance is unavailable.");
    authLogger.error("Migration failed: Firestore unavailable.");
    return report;
  }

  try {
    // 1. Scan /users collection
    const usersSnap = await getDocs(collection(db, 'users'));
    report.totalUserDocs = usersSnap.docs.length;
    authLogger.info(`Found ${usersSnap.docs.length} user documents in /users collection.`);

    const userMap = new Map<string, { uid: string; email: string; role?: 'developer' | 'employer' }>();

    for (const userDocSnap of usersSnap.docs) {
      const uid = userDocSnap.id;
      const data = userDocSnap.data();
      let role: 'developer' | 'employer' | undefined = data.role || data.accountType;

      // Fix missing roles safely based on profile presence if missing
      if (!role) {
        authLogger.warn(`User /users/${uid} missing role field. Inspecting profiles...`);
        // Check developers collection
        const devSnap = await getDocs(collection(db, 'developers'));
        const hasDevDoc = devSnap.docs.some(d => d.id === uid);
        
        // Check employers collection
        const empSnap = await getDocs(collection(db, 'employers'));
        const hasEmpDoc = empSnap.docs.some(e => e.id === uid);

        if (hasDevDoc && !hasEmpDoc) {
          role = 'developer';
        } else if (hasEmpDoc && !hasDevDoc) {
          role = 'employer';
        } else {
          // Default fallback if totally unassigned, assign developer to prevent orphan state
          role = 'developer';
        }

        // Repair /users/{uid}
        await setDoc(doc(db, 'users', uid), {
          uid,
          email: data.email || `user_${uid}@suredev.ng`,
          role,
          accountType: role,
          profileCompleted: data.profileCompleted ?? true,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        report.missingRolesFixed++;
        report.details.push(`Fixed missing role for UID ${uid} -> assigned ${role}.`);
      }

      if (role === 'developer') report.developerRolesCount++;
      if (role === 'employer') report.employerRolesCount++;

      userMap.set(uid, { uid, email: data.email || '', role });
    }

    // 2. Scan /developers and /employers for duplicate or misplaced profiles
    const devSnap = await getDocs(collection(db, 'developers'));
    const empSnap = await getDocs(collection(db, 'employers'));

    const devUids = new Set(devSnap.docs.map(d => d.id));
    const empUids = new Set(empSnap.docs.map(e => e.id));

    // Check for UIDs that exist in BOTH collections
    const duplicateUids = [...devUids].filter(uid => empUids.has(uid));

    for (const dupUid of duplicateUids) {
      authLogger.warn(`Duplicate profile detected for UID ${dupUid} in both /developers and /employers!`);
      const userDoc = userMap.get(dupUid);
      const canonicalRole = userDoc?.role;

      if (canonicalRole === 'developer') {
        // Delete employer profile
        await deleteDoc(doc(db, 'employers', dupUid));
        report.duplicateProfilesRemoved++;
        report.details.push(`Removed duplicate Employer profile for Developer UID ${dupUid}.`);
      } else if (canonicalRole === 'employer') {
        // Delete developer profile
        await deleteDoc(doc(db, 'developers', dupUid));
        report.duplicateProfilesRemoved++;
        report.details.push(`Removed duplicate Developer profile for Employer UID ${dupUid}.`);
      }
    }

    // 3. Scan for developers who are registered as employer in /users
    for (const devDocSnap of devSnap.docs) {
      const uid = devDocSnap.id;
      const user = userMap.get(uid);
      if (user && user.role === 'employer' && !duplicateUids.includes(uid)) {
        // Mismatch: /developers profile exists but user role is employer
        authLogger.warn(`Cleaning misplaced Developer profile for Employer UID ${uid}...`);
        await deleteDoc(doc(db, 'developers', uid));
        report.invalidProfilesCleaned++;
        report.details.push(`Cleaned misplaced Developer profile for Employer UID ${uid}.`);
      }
    }

    // 4. Scan for employers who are registered as developer in /users
    for (const empDocSnap of empSnap.docs) {
      const uid = empDocSnap.id;
      const user = userMap.get(uid);
      if (user && user.role === 'developer' && !duplicateUids.includes(uid)) {
        // Mismatch: /employers profile exists but user role is developer
        authLogger.warn(`Cleaning misplaced Employer profile for Developer UID ${uid}...`);
        await deleteDoc(doc(db, 'employers', uid));
        report.invalidProfilesCleaned++;
        report.details.push(`Cleaned misplaced Employer profile for Developer UID ${uid}.`);
      }
    }

    authLogger.success("Migration Scan Complete Successfully!", report);
    return report;

  } catch (error: any) {
    report.status = 'FAILED';
    report.details.push(`Migration exception: ${error.message}`);
    authLogger.error("Migration encountered error:", error);
    return report;
  }
}
