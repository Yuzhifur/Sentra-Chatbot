import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  DocumentData,
  DocumentReference,
  deleteDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions'

export interface Message {
  role: string;  // 'user' or 'assistant'
  content: string;
  timestamp?: Timestamp;
}

export interface ChatHistory {
  messages: Message[];
}

export interface ChatData {
  characterId: string;
  characterName: string;
  userId: string;
  userUsername: string;
  history: string;
  scenario: string;  // NEW: Custom scenario for this chat
  title?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class ChatService {
  /**
   * Create a new chat session between a user and a character
   * Now includes scenario customization
   */
  static async createChatSession(characterId: string, customScenario?: string): Promise<string> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to chat');
      }

      // Get character data
      const db = getFirestore();
      const characterDoc = await getDoc(doc(db, "characters", characterId));

      if (!characterDoc.exists()) {
        throw new Error(`Character with ID ${characterId} not found`);
      }

      const characterData = characterDoc.data();

      // Get user data
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();

      // Create a unique chat ID
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 10000);
      const uniqueId = `${currentUser.uid.substring(0, 4)}_${timestamp}_${randomNum}`;
      const chatId = `chat_${uniqueId}`;
      const chatRef = doc(db, "chats", chatId);

      // Create empty chat history
      const emptyHistory: ChatHistory = { messages: [] };

      // Create default title
      const defaultTitle = `Chat with ${characterData.name}`;

      // Determine scenario to use
      const scenarioToUse = customScenario && customScenario.trim() 
        ? customScenario.trim() 
        : (characterData.scenario || "");

      // Create chat document with scenario
      const chatData: ChatData = {
        characterId: characterId,
        characterName: characterData.name || 'Character',
        userId: currentUser.uid,
        userUsername: userData.username || userData.displayName || 'User',
        history: JSON.stringify(emptyHistory),
        scenario: scenarioToUse,  // NEW: Store the scenario for this chat
        title: defaultTitle,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(chatRef, chatData);

      // Add chat reference to user's chat history
      const userChatHistoryRef = doc(collection(db, "users", currentUser.uid, "chatHistory"), chatId);
      await setDoc(userChatHistoryRef, {
        title: defaultTitle,
        characterId: characterId,
        characterName: characterData.name,
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
        avatar: characterData.avatar || ""
      });

      return chatId;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  }

  /**
   * Update the scenario for an existing chat
   */
  static async updateChatScenario(chatId: string, newScenario: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to update chat scenario');
      }

      const db = getFirestore();
      const chatRef = doc(db, "chats", chatId);

      // Verify the chat exists and belongs to the user
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        throw new Error(`Chat session ${chatId} not found`);
      }

      const chatData = chatDoc.data() as ChatData;
      if (chatData.userId !== currentUser.uid) {
        throw new Error('You can only update your own chats');
      }

      // Update the scenario
      await updateDoc(chatRef, {
        scenario: newScenario.trim(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating chat scenario:", error);
      throw error;
    }
  }

  /**
   * Get the scenario for a specific chat
   */
  static async getChatScenario(chatId: string): Promise<string> {
    try {
      const chatData = await this.getChatSession(chatId);
      return chatData.scenario || "";
    } catch (error) {
      console.error("Error getting chat scenario:", error);
      throw error;
    }
  }

  // Delete an existed chat session
  static async deleteChatSession(chatId: string): Promise<void> {
    const db = getFirestore();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You must be logged in to delete chats");
    }

    // delete the file in chats directory
    const chatRef = doc(db, 'chats', chatId);
    await deleteDoc(chatRef);

    // delete the file in chatHistory under user directory
    const historyRef = doc(db, 'users', currentUser.uid, 'chatHistory', chatId);
    await deleteDoc(historyRef);
  }

  /**
   * Get an existing chat session
   */
  static async getChatSession(chatId: string): Promise<ChatData> {
    try {
      const db = getFirestore();
      const chatDoc = await getDoc(doc(db, "chats", chatId));

      if (!chatDoc.exists()) {
        throw new Error(`Chat session ${chatId} not found`);
      }

      return chatDoc.data() as ChatData;
    } catch (error) {
      console.error("Error getting chat session:", error);
      throw error;
    }
  }

  /**
   * Get chat history messages
   */
  static async getChatMessages(chatId: string): Promise<Message[]> {
    try {
      const chatData = await this.getChatSession(chatId);

      try {
        const history: ChatHistory = JSON.parse(chatData.history);
        if (Array.isArray(history.messages)) {
          return history.messages;
        }
        return [];
      } catch (parseError) {
        console.error("Error parsing chat history:", parseError);
        return [];
      }
    } catch (error) {
      console.error("Error getting chat messages:", error);
      throw error;
    }
  }

  /**
   * Send a message in a chat
   */
  static async sendMessage(chatId: string, content: string): Promise<Message> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to send messages');
      }

      // Create user message
      const userMessage: Message = {
        role: 'user',
        content: content,
        timestamp: Timestamp.now()
      };

      // Get current messages
      const messages = await this.getChatMessages(chatId);

      // Add new message
      const updatedMessages = [...messages, userMessage];

      // Update chat document
      const db = getFirestore();
      const chatRef = doc(db, "chats", chatId);

      await updateDoc(chatRef, {
        history: JSON.stringify({ messages: updatedMessages }),
        updatedAt: Timestamp.now()
      });

      // Update user's chat history with latest timestamp
      const userChatHistoryRef = doc(db, "users", currentUser.uid, "chatHistory", chatId);
      await updateDoc(userChatHistoryRef, {
        lastUpdated: Timestamp.now()
      });

      return userMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Rewind chat history to a specific message and update it with new content
   */
  static async rewindToMessage(chatId: string, messageIndex: number, newContent: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to edit messages');
      }

      // Get current messages
      const messages = await this.getChatMessages(chatId);

      if (messageIndex < 0 || messageIndex >= messages.length) {
        throw new Error('Invalid message index');
      }

      if (messages[messageIndex].role !== 'user') {
        throw new Error('Can only edit user messages');
      }

      // Create new message array up to and including the edited message
      const rewindedMessages = messages.slice(0, messageIndex);
      
      // Add the edited message
      const editedMessage: Message = {
        role: 'user',
        content: newContent.trim(),
        timestamp: Timestamp.now()
      };
      
      rewindedMessages.push(editedMessage);

      // Update chat document with the rewinded history
      const db = getFirestore();
      const chatRef = doc(db, "chats", chatId);

      await updateDoc(chatRef, {
        history: JSON.stringify({ messages: rewindedMessages }),
        updatedAt: Timestamp.now()
      });

      // Update user's chat history with latest timestamp
      const userChatHistoryRef = doc(db, "users", currentUser.uid, "chatHistory", chatId);
      await updateDoc(userChatHistoryRef, {
        lastUpdated: Timestamp.now()
      });

    } catch (error) {
      console.error("Error rewinding to message:", error);
      throw error;
    }
  }

  /**
   * Update chat title
   */
  static async updateChatTitle(chatId: string, newTitle: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to update chat title');
      }

      // Trim and validate title
      const trimmedTitle = newTitle.trim();
      if (!trimmedTitle) {
        throw new Error('Chat title cannot be empty');
      }

      const db = getFirestore();

      // Update main chat document
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        title: trimmedTitle,
        updatedAt: Timestamp.now()
      });

      // Update title in user's chat history
      const userChatHistoryRef = doc(db, "users", currentUser.uid, "chatHistory", chatId);
      await updateDoc(userChatHistoryRef, {
        title: trimmedTitle,
        lastUpdated: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating chat title:", error);
      throw error;
    }
  }

  /**
   * Generate AI response in chat
   * Now passes the chat's custom scenario to the AI
   */
  static async generateResponse(chatId: string): Promise<Message> {
    try {
      // Get chat session (includes custom scenario)
      const chatData = await this.getChatSession(chatId);

      // Get character data
      const db = getFirestore();
      const characterDoc = await getDoc(doc(db, "characters", chatData.characterId));

      if (!characterDoc.exists()) {
        throw new Error('Character not found');
      }

      const characterData = characterDoc.data();

      // Get current messages
      const messages = await this.getChatMessages(chatId);

      // Generate AI response
      const functions = getFunctions();
      const processChatFunction = httpsCallable(functions, 'processChat');

      // Prepare data for the cloud function - include the chat's custom scenario
      const functionData = {
        messages: messages,
        characterId: chatData.characterId,
        sessionId: chatId,
        customScenario: chatData.scenario  // NEW: Pass custom scenario
      };

      // Call the cloud function
      const result = await processChatFunction(functionData);
      const functionResponse = result.data as {success: boolean, aiMessage: Message};

      if (!functionResponse.success) {
        throw new Error('Failed to generate AI response');
      }

      const aiResponse = functionResponse.aiMessage;

      // Add AI response to chat history
      const updatedMessages = [...messages, aiResponse];

      // Update chat document
      const chatRef = doc(db, "chats", chatId);

      await updateDoc(chatRef, {
        history: JSON.stringify({ messages: updatedMessages }),
        updatedAt: Timestamp.now()
      });

      return aiResponse;
    } catch (error) {
      console.error("Error generating AI response:", error);
      throw error;
    }
  }

  /**
   * Get recent chats for the current user
   */
  static async getRecentChats(limitCount: number = 10): Promise<any[]> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to view chats');
      }

      const db = getFirestore();
      const chatHistoryRef = collection(db, "users", currentUser.uid, "chatHistory");

      // Query for recent chats, ordered by last message timestamp
      const q = query(
        chatHistoryRef,
        orderBy("lastUpdated", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const recentChats = [];

      for (const docSnapshot of querySnapshot.docs) {
        // Check if characterId exists, if not, try to update it
        const data = docSnapshot.data();
        const chatId = docSnapshot.id;

        if (!data.characterId && docSnapshot.id) {
          try {
            // Try to get the chat document to find the characterId
            const chatDocRef = doc(db, "chats", docSnapshot.id);
            const chatDoc = await getDoc(chatDocRef);

            if (chatDoc.exists()) {
              const chatData = chatDoc.data();
              if (chatData.characterId) {
                // Update the chatHistory document with the characterId
                await updateDoc(docSnapshot.ref, {
                  characterId: chatData.characterId
                });

                // Add the characterId to the data
                data.characterId = chatData.characterId;
              }
            }
          } catch (updateError) {
            console.error("Error updating legacy chat history entry:", updateError);
          }
        }

        recentChats.push({
          id: docSnapshot.id,
          ...data
        });
      }

      return recentChats;
    } catch (error) {
      console.error("Error getting recent chats:", error);
      throw error;
    }
  }

  /**
   * Get chat history for a specific character
   */
  static async getCharacterChatHistory(characterId: string): Promise<any[]> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('You must be logged in to view chat history');
      }

      const db = getFirestore();
      const chatHistoryRef = collection(db, "users", currentUser.uid, "chatHistory");

      // Query for chats with the specific character
      const q = query(
        chatHistoryRef,
        where("characterId", "==", characterId),
        orderBy("lastUpdated", "desc")
      );

      const querySnapshot = await getDocs(q);
      const characterChats = [];

      for (const doc of querySnapshot.docs) {
        characterChats.push({
          id: doc.id,
          ...doc.data()
        });
      }

      return characterChats;
    } catch (error) {
      console.error("Error getting character chat history:", error);
      throw error;
    }
  }
}