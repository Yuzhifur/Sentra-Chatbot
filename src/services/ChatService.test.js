// src/services/ChatService.test.js
import { ChatService } from './ChatService';

// Mock Firebase modules
jest.mock('firebase/firestore', () => {
  // Mock chat data
  const mockChatData = {
    characterId: 'char_123',
    characterName: 'Test Character',
    userId: 'user_456',
    userUsername: 'testuser',
    history: JSON.stringify({
      messages: [
        { role: 'user', content: 'Hello!', timestamp: { toDate: () => new Date() } },
        { role: 'assistant', content: 'Hi there!', timestamp: { toDate: () => new Date() } }
      ]
    }),
    title: 'Test Chat Session',
    createdAt: { toDate: () => new Date() },
    updatedAt: { toDate: () => new Date() }
  };

  // Mock chat history data
  const mockChatHistoryData = [
    {
      id: 'chat_abc123',
      title: 'Chat with Test Character',
      characterId: 'char_123',
      characterName: 'Test Character',
      avatar: '',
      lastUpdated: { toDate: () => new Date() }
    }
  ];

  // Mock function implementations
  return {
    getFirestore: jest.fn(),
    doc: jest.fn(() => 'mock-doc-ref'),
    collection: jest.fn(() => 'mock-collection-ref'),
    getDoc: jest.fn(() => ({
      exists: () => true,
      data: () => mockChatData
    })),
    getDocs: jest.fn(() => ({
      docs: [
        {
          id: 'chat_abc123',
          data: () => mockChatHistoryData[0]
        }
      ]
    })),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    Timestamp: {
      now: jest.fn(() => ({ toDate: () => new Date() }))
    },
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn()
  };
});

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'user_456',
      displayName: 'Test User'
    }
  }))
}));

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => async () => ({
    data: {
      success: true,
      aiMessage: {
        role: 'assistant',
        content: 'This is a test AI response.'
      }
    }
  }))
}));

describe('ChatService Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('getChatSession fetches the correct chat data', async () => {
    const { getDoc } = require('firebase/firestore');
    
    const chatId = 'chat_abc123';
    const result = await ChatService.getChatSession(chatId);
    
    // Verify the mock was called with correct parameters
    expect(getDoc).toHaveBeenCalled();
    
    // Verify the returned chat data has expected fields
    expect(result).toHaveProperty('characterId', 'char_123');
    expect(result).toHaveProperty('characterName', 'Test Character');
    expect(result).toHaveProperty('title', 'Test Chat Session');
    expect(result).toHaveProperty('history');
  });

  test('getChatMessages correctly parses chat history', async () => {
    const chatId = 'chat_abc123';
    const messages = await ChatService.getChatMessages(chatId);
    
    // Verify messages array is parsed correctly from the JSON history
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Hello!');
    expect(messages[1].role).toBe('assistant');
    expect(messages[1].content).toBe('Hi there!');
  });
  
  test('sendMessage adds a user message to chat history', async () => {
    const { updateDoc } = require('firebase/firestore');
    
    const chatId = 'chat_abc123';
    const messageContent = 'This is a test message';
    
    const result = await ChatService.sendMessage(chatId, messageContent);
    
    // Verify the message was created with correct properties
    expect(result).toHaveProperty('role', 'user');
    expect(result).toHaveProperty('content', messageContent);
    expect(result).toHaveProperty('timestamp');
    
    // Verify the chat document was updated
    expect(updateDoc).toHaveBeenCalledTimes(2); // One for chat doc, one for user's chat history
  });
  
  test('generateResponse calls AI API and adds response to chat', async () => {
    const { updateDoc } = require('firebase/firestore');
    const { httpsCallable } = require('firebase/functions');
    
    const chatId = 'chat_abc123';
    
    const result = await ChatService.generateResponse(chatId);
    
    // Verify AI API was called
    expect(httpsCallable).toHaveBeenCalled();
    
    // Verify response has correct format
    expect(result).toHaveProperty('role', 'assistant');
    expect(result).toHaveProperty('content', 'This is a test AI response.');
    
    // Verify chat document was updated
    expect(updateDoc).toHaveBeenCalledTimes(1);
  });
  
  test('createChatSession creates a new chat session', async () => {
    const { setDoc } = require('firebase/firestore');
    
    const characterId = 'char_123';
    
    await ChatService.createChatSession(characterId);
    
    // Verify document creation was called twice (chat doc and user chat history)
    expect(setDoc).toHaveBeenCalledTimes(2);
  });
  
  test('deleteChatSession removes chat documents', async () => {
    const { deleteDoc } = require('firebase/firestore');
    
    const chatId = 'chat_abc123';
    
    await ChatService.deleteChatSession(chatId);
    
    // Verify delete was called for both chat doc and chat history entry
    expect(deleteDoc).toHaveBeenCalledTimes(2);
  });
  
  test('getRecentChats fetches and sorts recent chats', async () => {
    const chats = await ChatService.getRecentChats(5);
    
    // Verify result is an array with the expected chat
    expect(Array.isArray(chats)).toBe(true);
    expect(chats.length).toBe(1);
    expect(chats[0]).toHaveProperty('id', 'chat_abc123');
    expect(chats[0]).toHaveProperty('title', 'Chat with Test Character');
  });
  
  test('updateChatTitle changes the chat title', async () => {
    const { updateDoc } = require('firebase/firestore');
    
    const chatId = 'chat_abc123';
    const newTitle = 'Updated Chat Title';
    
    await ChatService.updateChatTitle(chatId, newTitle);
    
    // Verify that updateDoc was called twice (main chat doc and user's chat history)
    expect(updateDoc).toHaveBeenCalledTimes(2);
    
    // Check if both calls included the new title
    const calls = updateDoc.mock.calls;
    expect(calls[0][1]).toHaveProperty('title', newTitle);
    expect(calls[1][1]).toHaveProperty('title', newTitle);
  });
});