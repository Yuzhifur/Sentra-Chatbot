// src/services/FirebaseService.test.js
import { FirebaseService } from './FirebaseService';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com'
    }
  })),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('firebase/firestore', () => {
  const mockDoc = jest.fn(() => ({
    id: 'mock-doc-id'
  }));
  
  const mockCollection = jest.fn(() => ({
    id: 'mock-collection-id'
  }));
  
  const mockGetDoc = jest.fn().mockResolvedValue({
    exists: jest.fn().mockReturnValue(true),
    data: jest.fn().mockReturnValue({
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      userCharacters: ['char1', 'char2'],
    })
  });
  
  const mockWhere = jest.fn().mockReturnValue({});
  const mockQuery = jest.fn().mockReturnValue({});
  
  const mockGetDocs = jest.fn().mockResolvedValue({
    empty: true,
    docs: [],
    forEach: jest.fn()
  });
  
  const mockSetDoc = jest.fn().mockResolvedValue({});
  const mockUpdateDoc = jest.fn().mockResolvedValue({});
  const mockServerTimestamp = jest.fn().mockReturnValue('timestamp');

  return {
    getFirestore: jest.fn(),
    doc: mockDoc,
    getDoc: mockGetDoc,
    setDoc: mockSetDoc,
    updateDoc: mockUpdateDoc,
    collection: mockCollection,
    query: mockQuery,
    where: mockWhere,
    getDocs: mockGetDocs,
    serverTimestamp: mockServerTimestamp
  };
});

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn().mockResolvedValue({}),
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/image.jpg')
}));

describe('FirebaseService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getUserData returns user data when user exists', async () => {
    const userData = await FirebaseService.getUserData('test-user-id');
    
    expect(userData).not.toBeNull();
    expect(userData.username).toBe('testuser');
    expect(userData.displayName).toBe('Test User');
    expect(userData.email).toBe('test@example.com');
    expect(userData.userCharacters.length).toBe(2);
  });

  test('isUsernameAvailable returns true when username is not taken', async () => {
    const { getDocs } = require('firebase/firestore');
    
    getDocs.mockResolvedValueOnce({
      empty: true,
      docs: [],
      forEach: jest.fn()
    });
    
    const result = await FirebaseService.isUsernameAvailable('newusername');
    
    expect(result).toBe(true);
  });

  test('isUsernameAvailable returns false when username is empty', async () => {
    const result = await FirebaseService.isUsernameAvailable('');
    
    expect(result).toBe(false);
  });

  test('uploadProfilePicture uploads file and returns reference', async () => {
    const { ref, uploadBytes } = require('firebase/storage');
    
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await FirebaseService.uploadProfilePicture('test-user-id', mockFile);
    
    expect(ref).toHaveBeenCalled();
    expect(uploadBytes).toHaveBeenCalled();
  });
});