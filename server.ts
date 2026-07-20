import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { auth as adminAuth } from "./server/firebaseAdmin";
import { classifyUserIntent, fetchGroundingContext, SecurityContext } from "./server/intentHandlers";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Grounding Knowledge Base for SureDev AI Assistant
const SUREDEV_SYSTEM_INSTRUCTION = `
You are SureDev AI, the premium virtual assistant of the SureDev platform, developed by the Abia Tech Guild.
Your mission is to provide accurate, reassuring, professional, and context-aware guidance to both developers and employers utilizing the SureDev directory.

Platform Context:
- SureDev is a premium, high-fidelity, location-based tech directory and ecosystem designed to showcase, connect, and elevate tech talent in Abia State, Nigeria (principally centered in Aba, Umuahia, Ohafia, and surrounding areas). It connects skilled local developers, engineers, and designers with local and global employers.
- It is a fully responsive, modern web application styled with a premium Midnight Dark and Clean White design system.

Knowledge Base & Core User Flows:

1. Account Creation & Onboarding:
   - Users can register by clicking "Apply to Registry" (for developers) or "Apply to Join" / "Hire Local Innovators" (for employers) which opens the JoinSureDevModal.
   - Registration supports standard Email/Password or direct, secure Google Sign-In.
   - Standard users receive a verification email to fully secure their profile.

2. Google Sign-In & Google Inbox:
   - Google Sign-In can be used during registration or login.
   - For Google-authenticated users, a personalized "📬 Google Inbox" is available in their Dashboard, displaying automated Welcome Packs, Platform Introductory updates, and Contract dispatches from the Abia Tech Guild.
   - If Google Inbox is not loaded or synchronized, users can click "Connect with Google Account" under the Google Inbox tab to activate sync.

3. Developer Profiles & Portfolios:
   - Developers configure their profile under "My Credentials" (name, title, location, years of experience, bio, and skills list).
   - Supported locations in Abia State include Aba, Umuahia, Ohafia, Arochukwu, and Bende.
   - Developers showcase full-scale projects under "Portfolio Projects" with titles, descriptions, images, tags, source links (GitHub), and live deployment URLs.
   - Developers set their "Availability" to: "immediate", "soon", or "unavailable" to alert hiring employers.

4. Hiring Developers:
   - Employers browse the Developer Directory, filtering by skill or location, and view deep developer profiles.
   - To hire, employers click "Hire [Developer Name]" or "Hire Local Innovators" to open the secure Direct Hiring Modal.
   - Employers input project details, estimated budget (NGN/USD), contract duration, and contact channels.

5. Finding Employers:
   - Standard developers, once logged in, can access the "Employer Directory" to browse verified local companies, read descriptions, view their websites, and submit direct applications to join their talent pipelines.

6. Collaboration requests (🤝 Collaboration Hub):
   - Developers can connect peer-to-peer! Inside the "🤝 Collaboration Hub" tab of the Developer Dashboard, developers can send joint-venture proposals or co-founding requests to other registered developers.
   - They can view sent and received collaboration requests, and directly Accept, Decline, or Cancel them in real time.

7. Login, Security & Recovery:
   - Users sign in via the login modal.
   - Users who forget passwords can initiate the recovery flow via standard Firebase Authentication email links.
   - Crucial security: A single email cannot have conflicting custom credentials and Google credentials. If an email is registered with a custom password, Google Sign-In will prompt them to use their registered password.

8. Troubleshooting & FAQs:
   - "Profile image won't upload": Make sure the image is JPEG/PNG and below 5MB. Upload can be completed in the "My Credentials" (developers) or "Company Profile" (employers) tabs.
   - "How to update skills": Go to Developer Dashboard -> My Credentials -> click 'Add Skill' or edit.
   - "Where is my Inbox": Accessible directly as "📬 Google Inbox" in both Developer and Employer Dashboards once logged in.

Tone & Persona:
- Professional, welcoming, elegant, clear, and proud of the Abia tech ecosystem.
- Use clean Markdown formatting (bold terms, short lists, and well-spaced lines) for maximum readability. Do not output raw JSON, code paths, or technical logs.
- Keep answers concise but comprehensive. If a user asks how to perform an action, provide a quick step-by-step instruction.
`;

// API endpoint for chat messages
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!apiKey) {
      // Graceful fallback with clear instruction if API key is missing
      return res.json({
        text: "Hello! I am SureDev AI. Currently, my server-side Gemini intelligence is waiting for the GEMINI_API_KEY secret to be configured in your Settings > Secrets panel. Once configured, I can provide fully automated ecosystem assistance. \n\nIn the meantime, feel free to browse our developer directory, click 'Apply to Registry' to join, or check out our high-fidelity layout!"
      });
    }

    // 1. Secure Authentication & Verification of ID Token
    let userContext: SecurityContext = {
      uid: null,
      email: null,
      isAuthenticated: false
    };

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ") && adminAuth) {
      const idToken = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        userContext = {
          uid: decodedToken.uid,
          email: decodedToken.email || null,
          isAuthenticated: true
        };
        console.log(`Server-side Auth successfully verified user: ${decodedToken.email} (${decodedToken.uid})`);
      } catch (authError) {
        console.warn("Invalid ID Token submitted in Authorization header:", authError);
      }
    }

    // 2. Classify User Request into designative intents using Gemini
    const intent = await classifyUserIntent(message, ai);

    // 3. Query appropriate Firestore collections using secure logic
    const groundingContext = await fetchGroundingContext(intent, userContext, message);

    // 4. Format chat history for @google/genai generateContent
    // Each message must match the model contents structure: { role: 'user' | 'model', parts: [{ text: '...' }] }
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        contents.push({
          role: turn.sender === "user" ? "user" : "model",
          parts: [{ text: turn.text }]
        });
      });
    }

    // Append the current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // 5. Construct grounding-enhanced dynamic system instructions
    const dynamicSystemInstruction = `${SUREDEV_SYSTEM_INSTRUCTION}

==================================================
REAL-TIME GROUNDING KNOWLEDGE SOURCE - FIRESTORE DIRECTORY DATA
==================================================
Below is the real-time, verified platform data retrieved securely from Firestore based on the user's intent. You MUST ground your responses strictly in this database context. Under no circumstances should you fabricate or invent any developers, employers, projects, or user details not matching this dataset. If the context is empty, state clearly and helpfully that no matches or profiles were found.

Classified Query Intent: "${intent}"
Is User Authenticated: ${userContext.isAuthenticated ? "YES" : "NO"}
Logged-In User Email: ${userContext.email || "N/A"}

Grounding Context Data:
${groundingContext}
`;

    // Call generateContent on gemini-3.5-flash as per skill guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: dynamicSystemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini server error:", err);
    res.status(500).json({ error: err.message || "An error occurred while calling the Gemini API." });
  }
});

// Vite middleware & Static file serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SureDev Full-Stack Server running on http://localhost:${PORT}`);
  });
}

setupServer();
