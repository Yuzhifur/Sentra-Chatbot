jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({
      currentUser: { uid: 'test-user-id' }
    })),
    signOut: jest.fn(() => Promise.resolve()),
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
      user: { uid: 'test-user-id', email: 'test@example.com' }
    })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
      user: { uid: 'new-user-id', email: 'new@example.com' }
    }))
  }));
  
  jest.mock('firebase/firestore', () => {
    // Create mock document data
    const mockUserData = {
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      userAvatar: '',
      userDescription: 'Test bio',
      userCharacters: ['char_1', 'char_2']
    };
    
    // Mock Firestore query results
    const mockQueryDocs = [];
    
    return {
      getFirestore: jest.fn(),
      doc: jest.fn(() => 'mock-doc-ref'),
      getDoc: jest.fn(() => ({
        exists: () => true,
        data: () => mockUserData
      })),
      setDoc: jest.fn(() => Promise.resolve()),
      updateDoc: jest.fn(() => Promise.resolve()),
      collection: jest.fn(() => 'mock-collection-ref'),
      addDoc: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
      query: jest.fn(() => 'mock-query'),
      where: jest.fn(),
      getDocs: jest.fn(() => ({
        empty: true,
        docs: mockQueryDocs,
        forEach: (callback) => mockQueryDocs.forEach(callback)
      })),
      serverTimestamp: jest.fn(() => 'mock-timestamp')
    };
  });
  
  // Import the service (after mocks are set up)
  import { FirebaseService } from './FirebaseService';
  
  describe('FirebaseService Tests', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });
  
    test('getUserData returns user data when user exists', async () => {
      const userData = await FirebaseService.getUserData('test-user-id');
      
      expect(userData).not.toBeNull();
      expect(userData?.username).toBe('testuser');
      expect(userData?.displayName).toBe('Test User');
    });
    
    test('isUsernameAvailable returns true for available usernames', async () => {
      const result = await FirebaseService.isUsernameAvailable('newusername');
      
      expect(result).toBe(true);
    });
    
    test('should update user last login', async () => {
      const { getFirestore, doc, updateDoc } = require('firebase/firestore');
      
      await FirebaseService.updateUserLastLogin('test-user-id');
      
      expect(getFirestore).toHaveBeenCalled();
      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        lastLogin: 'mock-timestamp'
      });
    });
  
    test('should handle signIn correctly', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      
      const user = await FirebaseService.signIn('test@example.com', 'password');
      
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
      expect(user.uid).toBe('test-user-id');
      expect(user.email).toBe('test@example.com');
    });
  
    test('should handle logOut correctly', async () => {
      const { signOut } = require('firebase/auth');
      
      await FirebaseService.logOut();
      
      expect(signOut).toHaveBeenCalled();
    });
  });