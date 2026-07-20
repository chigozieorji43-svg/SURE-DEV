import { auth } from "../lib/firebase";

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const aiService = {
  /**
   * Sends a message to the SureDev AI assistant endpoint on the server.
   * Includes previous messages for context grounding.
   */
  async sendMessage(message: string, history: ChatMessage[]): Promise<string> {
    try {
      let idToken: string | null = null;
      if (auth && auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken();
        } catch (tokenErr) {
          console.warn("Could not retrieve Firebase Auth ID token:", tokenErr);
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          // Only send the last 15 messages to prevent excessive token use or payload bloat
          history: history.slice(-15).map(msg => ({
            sender: msg.sender,
            text: msg.text,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      return data.text || "I apologize, but I received an empty response. Please try again.";
    } catch (err: any) {
      console.error("aiService.sendMessage error:", err);
      return `I encountered an issue connecting with the SureDev AI servers. Please verify that your dev server is active and the GEMINI_API_KEY is correctly set in your Secrets panel.\n\nError details: ${err.message || err}`;
    }
  },

  /**
   * Persists chat messages to localStorage.
   */
  saveChatHistory(history: ChatMessage[]): void {
    try {
      localStorage.setItem("suredev_chat_history", JSON.stringify(history));
    } catch (err) {
      console.error("Failed to save chat history to localStorage:", err);
    }
  },

  /**
   * Retrieves chat history from localStorage.
   */
  getChatHistory(): ChatMessage[] {
    try {
      const historyStr = localStorage.getItem("suredev_chat_history");
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (err) {
      console.error("Failed to load chat history from localStorage:", err);
      return [];
    }
  },

  /**
   * Clears chat history from localStorage.
   */
  clearChatHistory(): void {
    try {
      localStorage.removeItem("suredev_chat_history");
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    }
  }
};
