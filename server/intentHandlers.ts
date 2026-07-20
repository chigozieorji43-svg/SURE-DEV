import { GoogleGenAI } from "@google/genai";
import { db, isAdminAvailable } from "./firebaseAdmin";

export interface SecurityContext {
  uid: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

// Low-overhead mock data fallback in case Firebase Admin is not yet provisioned by the user
const FALLBACK_DEVELOPERS = [
  {
    id: "dev-chinedu",
    name: "Chinedu Okeke",
    title: "Principal Full Stack Engineer",
    location: "Aba",
    experience: 7,
    skills: ["React", "Node.js", "TypeScript", "GraphQL", "PostgreSQL", "Docker", "AWS"],
    availability: "immediate",
    bio: "Passionate full-stack developer focusing on scalable financial systems. Architect of regional payment rails and high-throughput APIs.",
    email: "chinedu.okeke@suredev.ng",
    projects: [
      {
        id: "proj-abapay",
        title: "AbaPay Commerce Gateway",
        description: "A custom, low-latency financial settlement API designed for trade merchants in Ariaria International Market, Aba."
      }
    ]
  },
  {
    id: "dev-amarachi",
    name: "Amarachi Nwosu",
    title: "Senior Product Designer & Frontend Developer",
    location: "Umuahia",
    experience: 5,
    skills: ["Figma", "React", "Tailwind CSS", "Framer Motion", "Design Systems"],
    availability: "immediate",
    bio: "Bridging the gap between world-class visual aesthetics and frontend engineering for African startups.",
    email: "amarachi.nwosu@suredev.ng",
    projects: [
      {
        id: "proj-farmtrust",
        title: "FarmTrust Logistical Ledger",
        description: "An intuitive supply chain ledger tracking organic palm produce from rural cooperatives in Ohafia."
      }
    ]
  }
];

const FALLBACK_EMPLOYERS = [
  {
    id: "emp-innovation-hub",
    companyName: "Aba Innovation Hub",
    contactPerson: "Nnamdi Kalu",
    description: "The primary tech incubation and acceleration venue for local software engineers in Abia State.",
    location: "Aba",
    industry: "Incubator & Software Services",
    desiredSkills: ["React", "TypeScript", "Node.js", "Tailwind CSS"]
  },
  {
    id: "emp-coop-retail",
    companyName: "Ariaria Cooperative Retailers",
    contactPerson: "Chief Benson",
    description: "Digital retail network optimizing stock distribution for thousands of market merchants.",
    location: "Aba",
    industry: "Retail & FinTech",
    desiredSkills: ["React Native", "TypeScript", "SQL"]
  }
];

/**
 * Classifies the incoming user request into one of the designated intents using Gemini.
 */
export async function classifyUserIntent(message: string, ai: GoogleGenAI): Promise<string> {
  const classifyPrompt = `
You are an expert NLP classifier for the SureDev directory platform. Classify the following user query into exactly one of these intents. Return ONLY the classification string. Do not include punctuation, markdown, or any explanation.

Predefined Intents:
- "search_developers": The user is searching for, asking to list, or inquiring about software developers, engineers, designers, freelancers, tech specialists, or asking about specific skills or locations (e.g., Aba, Umuahia).
- "search_employers": The user is looking for companies, employers, hiring organizations, open vacancies, or browsing who is hiring.
- "profile_status": The user is asking about their own profile, checking their profile completion status, looking at "My Credentials", or wanting to know how to edit/complete their account.
- "projects": The user is inquiring about developer projects, portfolios, showcasing work, or details of products built by Aba tech specialists.
- "notifications": The user is asking to view, sync, or check their alerts, unread notifications, or platform updates.
- "collaboration_requests": The user wants to check, view, manage, or ask about joint-venture collaboration requests, partnership status, or peer invites.
- "messages": The user wants to check their chat messages, view conversation transcripts, or inquire about message histories.
- "general_help": Welcoming, general queries, general questions about how SureDev works, or troubleshooting guides (e.g., password reset, image upload limitations).

User Query: "${message}"

Classification (return only one of: search_developers, search_employers, profile_status, projects, notifications, collaboration_requests, messages, general_help):`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: classifyPrompt }] }],
      config: {
        temperature: 0.1,
      }
    });

    const intent = response.text?.trim().toLowerCase().replace(/[^a-z_]/g, "") || "general_help";
    console.log(`Classified user query intent as: ${intent}`);
    return intent;
  } catch (err) {
    console.warn("Classifier failed, defaulting to general_help:", err);
    return "general_help";
  }
}

/**
 * Executes secure, server-side data fetching based on user intent and security context.
 */
export async function fetchGroundingContext(
  intent: string,
  userContext: SecurityContext,
  queryKeywords: string
): Promise<string> {
  const isAuth = userContext.isAuthenticated;
  const uid = userContext.uid;

  if (!isAdminAvailable || !db) {
    console.log("Firebase Admin is offline or unprovisioned. Grounding using high-fidelity mock dataset.");
    return formatFallbackContext(intent, userContext);
  }

  try {
    switch (intent) {
      case "search_developers": {
        const snapshot = await db.collection("developers").limit(15).get();
        const developers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return `[GROUNDED DATA: REAL-TIME DEVELOPERS FROM FIRESTORE]
${JSON.stringify(developers, null, 2)}`;
      }

      case "search_employers": {
        const snapshot = await db.collection("employers").limit(15).get();
        const employers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return `[GROUNDED DATA: REAL-TIME EMPLOYERS FROM FIRESTORE]
${JSON.stringify(employers, null, 2)}`;
      }

      case "profile_status": {
        if (!isAuth || !uid) {
          return "[SECURITY CONTEXT] User is NOT logged in. You cannot fetch their profile status. Direct them to log in using the 'Apply to Registry' or 'Sign In' flows first.";
        }
        
        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
          return `[SECURITY CONTEXT] User verified (UID: ${uid}, Email: ${userContext.email}) but has not finalized their profile yet. Instruct them to choose their account type (Developer or Employer) to get started.`;
        }

        const userData = userDoc.data();
        const accountType = userData?.accountType;

        let specificProfile: any = null;
        if (accountType === "developer") {
          const devDoc = await db.collection("developers").doc(uid).get();
          specificProfile = devDoc.exists ? devDoc.data() : null;
        } else if (accountType === "employer") {
          const empDoc = await db.collection("employers").doc(uid).get();
          specificProfile = empDoc.exists ? empDoc.data() : null;
        }

        return `[GROUNDED DATA: LOGGED-IN USER SECURE PROFILE]
User Account: ${JSON.stringify(userData, null, 2)}
Specific Profile Details: ${JSON.stringify(specificProfile, null, 2)}`;
      }

      case "projects": {
        // Fetch public portfolios and extract projects securely
        const snapshot = await db.collection("developers").limit(15).get();
        const projectsList: any[] = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.projects && Array.isArray(data.projects)) {
            data.projects.forEach((proj: any) => {
              projectsList.push({
                ...proj,
                developerId: doc.id,
                developerName: data.name
              });
            });
          }
        });
        return `[GROUNDED DATA: VERIFIED DEVELOPER PROJECTS FROM FIRESTORE]
${JSON.stringify(projectsList, null, 2)}`;
      }

      case "notifications": {
        if (!isAuth || !uid) {
          return "[SECURITY CONTEXT] User is NOT logged in. Restrict access to notifications. Please politely ask them to sign in.";
        }

        // Secure fetch - only fetch notifications targeted to currently verified user UID
        const snapshot = await db.collection("notifications")
          .where("receiverId", "==", uid)
          .limit(15)
          .get();

        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return `[GROUNDED DATA: SECURE PERSONAL NOTIFICATIONS (Only visible to verified UID ${uid})]
${JSON.stringify(notifications, null, 2)}`;
      }

      case "collaboration_requests": {
        if (!isAuth || !uid) {
          return "[SECURITY CONTEXT] User is NOT logged in. Restrict access to collaboration hub. Please politely ask them to sign in.";
        }

        // Secure double-sided check (requests sent by them or received by them)
        const sentSnap = await db.collection("collaboration_requests")
          .where("senderId", "==", uid)
          .limit(15)
          .get();

        const receivedSnap = await db.collection("collaboration_requests")
          .where("receiverId", "==", uid)
          .limit(15)
          .get();

        const sent = sentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const received = receivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return `[GROUNDED DATA: SECURE USER COLLABORATION RECORDS (Only visible to verified UID ${uid})]
Sent Requests: ${JSON.stringify(sent, null, 2)}
Received Requests: ${JSON.stringify(received, null, 2)}`;
      }

      case "messages": {
        if (!isAuth || !uid) {
          return "[SECURITY CONTEXT] User is NOT logged in. Restrict access to messaging. Ask them to sign in to read/send messages.";
        }

        // Fetch messages where the verified user is the sender
        const messagesSnap = await db.collection("messages")
          .where("senderId", "==", uid)
          .limit(20)
          .get();

        const messages = messagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return `[GROUNDED DATA: SECURE SEND HISTORY (Only visible to verified UID ${uid})]
${JSON.stringify(messages, null, 2)}`;
      }

      default:
        return "";
    }
  } catch (err: any) {
    console.warn(`Firestore secure query failed for intent '${intent}':`, err);
    // Graceful fallback to static data on error to prevent chat crashes
    return formatFallbackContext(intent, userContext);
  }
}

/**
 * Generates structured mock data context in case Firebase Firestore setup is pending.
 */
function formatFallbackContext(intent: string, userContext: SecurityContext): string {
  switch (intent) {
    case "search_developers":
      return `[GROUNDED DATA: HIGH-FIDELITY FALLBACK DEVELOPERS]
${JSON.stringify(FALLBACK_DEVELOPERS, null, 2)}`;

    case "search_employers":
      return `[GROUNDED DATA: HIGH-FIDELITY FALLBACK EMPLOYERS]
${JSON.stringify(FALLBACK_EMPLOYERS, null, 2)}`;

    case "profile_status":
      if (!userContext.isAuthenticated) {
        return "[SECURITY CONTEXT] User is NOT logged in. Prompt them to click 'Apply to Registry' or 'Sign In' to manage their profile credentials.";
      }
      return `[GROUNDED DATA: SIMULATED PROFILE CONTEXT]
Email: ${userContext.email} (Authenticated)
Status: Pending Full Registry Profile. Direct the user to go to 'My Credentials' in their Dashboard to complete registration.`;

    case "projects":
      const projectsList: any[] = [];
      FALLBACK_DEVELOPERS.forEach(d => {
        d.projects.forEach(p => {
          projectsList.push({
            ...p,
            developerId: d.id,
            developerName: d.name
          });
        });
      });
      return `[GROUNDED DATA: HIGH-FIDELITY FALLBACK PROJECTS]
${JSON.stringify(projectsList, null, 2)}`;

    case "notifications":
      if (!userContext.isAuthenticated) {
        return "[SECURITY CONTEXT] User is NOT logged in. Direct them to sign in to view their secure inbox notifications.";
      }
      return `[GROUNDED DATA: INBOX NOTIFICATIONS]
No current unread alerts. All systems synchronized.`;

    case "collaboration_requests":
      if (!userContext.isAuthenticated) {
        return "[SECURITY CONTEXT] User is NOT logged in. Please politely ask them to sign in to access the secure Collaboration Hub.";
      }
      return `[GROUNDED DATA: SIMULATED COLLABORATION HUB]
Active Requests: No pending joint-venture proposals. Encourage them to discover peers in the Aba directory and click 'Collab'!`;

    case "messages":
      if (!userContext.isAuthenticated) {
        return "[SECURITY CONTEXT] User is NOT logged in. Ask them to sign in to communicate securely.";
      }
      return `[GROUNDED DATA: MESSAGE CONTEXT]
No active direct chat histories found for this user session.`;

    default:
      return "";
  }
}
