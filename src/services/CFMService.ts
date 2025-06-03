// src/services/CFMService.ts
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FirebaseService } from './FirebaseService';
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { ai } from '../index';

export interface CFMMemory {
  [chatId: string]: string; // Map of chatId to memory string
}

export interface CFMData {
  memories: CFMMemory;
  lastUpdated: Timestamp;
}

export class CFMService {
  private static geminiModel: any = null;

  /**
   * Initialize Gemini model for memory generation
   */
  private static async initializeGemini() {
    if (this.geminiModel) return;

    try {
      if (!ai) {
        throw new Error('Firebase AI Logic not initialized');
      }

      this.geminiModel = getGenerativeModel(ai, {
        model: "gemini-2.0-flash-001"
      });
    } catch (error) {
      console.error("Error initializing Gemini for CFM:", error);
      throw error;
    }
  }

  /**
   * Check if CFM is enabled for a chat
   */
  static async isCFMEnabled(chatId: string): Promise<boolean> {
    try {
      const db = getFirestore();
      const chatDoc = await getDoc(doc(db, "chats", chatId));

      if (!chatDoc.exists()) {
        return false;
      }

      const data = chatDoc.data();
      return data.CFM_enabled === true;
    } catch (error) {
      console.error("Error checking CFM status:", error);
      return false;
    }
  }

  /**
   * Enable CFM for a chat (one-way operation, cannot be disabled)
   */
  static async enableCFM(chatId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be logged in to enable CFM');
      }

      const db = getFirestore();
      const chatRef = doc(db, "chats", chatId);

      // Verify chat exists and belongs to user
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data();
      if (chatData.userId !== currentUser.uid) {
        throw new Error('Unauthorized to modify this chat');
      }

      // Check if already enabled
      if (chatData.CFM_enabled === true) {
        console.log('CFM already enabled for this chat');
        return;
      }

      // Enable CFM
      await updateDoc(chatRef, {
        CFM_enabled: true,
        CFM_enabledAt: Timestamp.now()
      });

      // Initialize CFM collection if needed and generate initial memory
      await this.updateChatMemory(chatId);

    } catch (error) {
      console.error("Error enabling CFM:", error);
      throw error;
    }
  }

  /**
   * Generate a memory summary from chat history using Gemini
   */
  static async generateMemorySummary(
    messages: any[],
    characterName: string,
    userName: string
  ): Promise<string> {
    try {
      await this.initializeGemini();

      // Format messages for Gemini
      const chatHistory = messages.map(msg =>
        `${msg.role === 'user' ? userName : characterName}: ${msg.content}`
      ).join('\n');

      const prompt = `
You are a memory summarizer. Create a concise memory summary of this chat between ${userName} and ${characterName}.
Focus on key events, emotions, relationship dynamics, and important details that ${characterName} should remember about ${userName}.
Keep it under 200 words and write from ${characterName}'s perspective.

Chat history:
${chatHistory}

Memory summary:`;

      const result = await this.geminiModel.generateContent(prompt);
      const response = result.response;
      const memory = response.text().trim();

      return memory;
    } catch (error) {
      console.error("Error generating memory summary:", error);
      // Return a fallback memory
      return `Had a conversation with ${userName}.`;
    }
  }

  /**
   * Update or create memory for a specific chat
   */
  static async updateChatMemory(chatId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be logged in');
      }

      // Get chat data
      const db = getFirestore();
      const chatDoc = await getDoc(doc(db, "chats", chatId));

      if (!chatDoc.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatDoc.data();

      // Only update if CFM is enabled
      if (!chatData.CFM_enabled) {
        return;
      }

      // Get chat messages
      const messages = JSON.parse(chatData.history || '{"messages":[]}').messages;

      if (messages.length === 0) {
        return; // No messages to summarize
      }

      // Get user data for username
      const userData = await FirebaseService.getUserData(currentUser.uid);
      const userName = userData?.displayName || userData?.username || 'User';

      // Generate memory summary
      const memory = await this.generateMemorySummary(
        messages,
        chatData.characterName,
        userName
      );

      // Store memory in CFM collection
      const cfmRef = doc(db, "users", currentUser.uid, "CFM", chatData.characterId);
      const cfmDoc = await getDoc(cfmRef);

      if (cfmDoc.exists()) {
        // Update existing document
        const existingData = cfmDoc.data() as CFMData;
        await updateDoc(cfmRef, {
          [`memories.${chatId}`]: memory,
          lastUpdated: Timestamp.now()
        });
      } else {
        // Create new document
        const newData: CFMData = {
          memories: {
            [chatId]: memory
          },
          lastUpdated: Timestamp.now()
        };
        await setDoc(cfmRef, newData);
      }

    } catch (error) {
      console.error("Error updating chat memory:", error);
      throw error;
    }
  }

  /**
   * Get all memories for a specific character from a friend
   */
  static async getFriendMemories(
    friendUserId: string,
    characterId: string
  ): Promise<CFMMemory | null> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be logged in');
      }

      // Verify friendship
      const friendshipStatus = await FirebaseService.checkFriendshipStatus(
        currentUser.uid,
        friendUserId
      );

      if (friendshipStatus !== 'friends') {
        throw new Error('Can only access memories from friends');
      }

      // Get memories
      const db = getFirestore();
      const cfmRef = doc(db, "users", friendUserId, "CFM", characterId);
      const cfmDoc = await getDoc(cfmRef);

      if (!cfmDoc.exists()) {
        return null;
      }

      const data = cfmDoc.data() as CFMData;
      return data.memories || null;

    } catch (error) {
      console.error("Error getting friend memories:", error);
      return null;
    }
  }

  /**
   * Format memories for system message
   */
  static formatMemoriesForSystem(
    memories: CFMMemory,
    friendUsername: string
  ): string {
    const memoryEntries = Object.entries(memories);

    if (memoryEntries.length === 0) {
      return `System: You have no memories with ${friendUsername}.`;
    }

    const memoryText = memoryEntries
      .map(([chatId, memory]) => memory)
      .join('\n\n');

    return `System: Your memories with ${friendUsername}:\n${memoryText}`;
  }

  /**
   * Parse @mentions from a message
   */
  static parseMentions(message: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  /**
   * Get user ID from username
   */
  static async getUserIdFromUsername(username: string): Promise<string | null> {
    try {
      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username.toLowerCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].id;
    } catch (error) {
      console.error("Error getting user ID from username:", error);
      return null;
    }
  }
}