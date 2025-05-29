// src/pages/UserProfile.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import UserProfile from './UserProfile';
import { FirebaseService } from '../services/FirebaseService';

// Mock React Router
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams()
}));

// Mock Sidebar component
jest.mock('../components/Sidebar', () => ({
  __esModule: true,
  default: ({ doResetDashboard }) => (
    <div data-testid="sidebar-mock">Sidebar Mock</div>
  )
}));

// Mock UserSettingsPopup component
jest.mock('../components/UserSettingsPopup', () => ({
  __esModule: true,
  default: ({ onClose, onSave, currentBio, currentDisplayName }) => (
    <div data-testid="user-settings-popup">
      <button onClick={() => onSave('New bio', 'New name', null)}>Save Settings</button>
      <button onClick={onClose}>Close Settings</button>
    </div>
  )
}));

// Mock CharacterChatPopup component
jest.mock('../components/CharacterChatPopup', () => ({
  __esModule: true,
  default: ({ characterId, characterName, onClose }) => (
    <div data-testid="character-chat-popup">
      <span>Chat with {characterName}</span>
      <button onClick={onClose}>Close Chat</button>
    </div>
  )
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-123',
      displayName: 'Test User'
    }
  }))
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => 'collection-ref'),
  doc: jest.fn(() => 'doc-ref'),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => ({
    exists: () => true,
    data: () => ({
      userCharacters: ['char-1', 'char-2']
    })
  }))
}));

// Mock FirebaseService
jest.mock('../services/FirebaseService', () => ({
  FirebaseService: {
    getUserData: jest.fn(),
    getUserCharacters: jest.fn(),
    getCharacterById: jest.fn(),
    deleteCharacter: jest.fn(),
    updateUserData: jest.fn(),
    uploadAndGetProfilePicture: jest.fn(),
    logOut: jest.fn()
  }
}));

// Mock user data
const mockUserData = {
  username: 'testuser',
  displayName: 'Test User',
  userAvatar: 'https://example.com/avatar.jpg',
  userDescription: 'Test user bio',
  userCharacters: ['char-1', 'char-2']
};

// Mock character data
const mockCharacters = [
  {
    id: '1',
    docId: 'char-1',
    name: 'Test Character 1',
    avatar: 'https://example.com/char1-avatar.jpg',
    authorDisplayName: 'Test User',
    characterDescription: 'A test character'
  },
  {
    id: '2',
    docId: 'char-2',
    name: 'Test Character 2',
    avatar: '',
    authorDisplayName: 'Test User',
    characterDescription: 'Another test character'
  }
];

// Rendering helper function with BrowserRouter
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('UserProfile Component Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set default mock implementations
    mockUseParams.mockReturnValue({});
    FirebaseService.getUserData.mockResolvedValue(mockUserData);
    FirebaseService.getUserCharacters.mockResolvedValue(mockCharacters);
    FirebaseService.getCharacterById.mockImplementation((id) => {
      return Promise.resolve(mockCharacters.find(char => char.docId === id));
    });
  });

  

  test('renders settings buttons for own profile', async () => {
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  test('does not render settings buttons for other user profile', async () => {
    mockUseParams.mockReturnValue({ userId: 'other-user-123' });
    
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Settings buttons should not be present
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('displays user characters correctly', async () => {
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText('Test Character 1')).toBeInTheDocument();
      expect(screen.getByText('Test Character 2')).toBeInTheDocument();
    });

    // Check that character images are handled properly
    const charWithAvatar = screen.getByAltText('Test Character 1');
    expect(charWithAvatar).toBeInTheDocument();
  });

  test('shows edit and delete buttons for own characters', async () => {
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      // Edit buttons should be present (✏️ emoji)
      const editButtons = screen.getAllByTitle('Edit character');
      expect(editButtons).toHaveLength(2);

      // Delete buttons should be present (❌ emoji)
      const deleteButtons = screen.getAllByTitle('Delete character');
      expect(deleteButtons).toHaveLength(2);
    });
  });

  test('handles character deletion', async () => {
    FirebaseService.deleteCharacter.mockResolvedValue();
    
    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true);
    
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Delete character');
      fireEvent.click(deleteButtons[0]);
    });

    // Verify confirmation was called
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this character?');
    
    // Verify delete service was called
    await waitFor(() => {
      expect(FirebaseService.deleteCharacter).toHaveBeenCalledWith('test-user-123', 'char-1');
    });
  });

  test('handles character deletion cancellation', async () => {
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);
    
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Delete character');
      fireEvent.click(deleteButtons[0]);
    });

    // Verify confirmation was called but delete service was not
    expect(window.confirm).toHaveBeenCalled();
    expect(FirebaseService.deleteCharacter).not.toHaveBeenCalled();
  });

  test('navigates to character edit page', async () => {
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      const editButtons = screen.getAllByTitle('Edit character');
      fireEvent.click(editButtons[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/character-edit/char-1');
  });

  test('opens settings popup', async () => {
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      const settingsButton = screen.getByText('Settings');
      fireEvent.click(settingsButton);
    });

    expect(screen.getByTestId('user-settings-popup')).toBeInTheDocument();
  });

  test('handles settings save', async () => {
    FirebaseService.updateUserData.mockResolvedValue();
    FirebaseService.uploadAndGetProfilePicture.mockResolvedValue('https://example.com/new-avatar.jpg');
    
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      const settingsButton = screen.getByText('Settings');
      fireEvent.click(settingsButton);
    });

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(FirebaseService.updateUserData).toHaveBeenCalledWith('test-user-123', {
        ...mockUserData,
        userDescription: 'New bio',
        displayName: 'New name'
      });
    });
  });

  test('handles logout', async () => {
    FirebaseService.logOut.mockResolvedValue();
    
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
    });

    expect(FirebaseService.logOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('switches between tabs', async () => {
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      // Initially on Characters tab
      expect(screen.getByText('Test Character 1')).toBeInTheDocument();
      
      // Click on Liked tab
      const likedTab = screen.getByText('Liked');
      fireEvent.click(likedTab);
    });

    // Should show empty state for liked characters
    expect(screen.getByText("You haven't liked any Characters yet.")).toBeInTheDocument();
  });

  

  test('opens chat popup from character popup', async () => {
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      // Click on a character to open popup
      const characterElement = screen.getByText('Test Character 1');
      fireEvent.click(characterElement);
    });

    // Click on chat button in popup
    const chatButton = screen.getByText("Let's Chat! ✏️");
    fireEvent.click(chatButton);

    // Should show chat popup
    expect(screen.getByTestId('character-chat-popup')).toBeInTheDocument();
    expect(screen.getByText('Chat with Test Character 1')).toBeInTheDocument();
  });

  

  test('handles user not found', async () => {
    mockUseParams.mockReturnValue({ userId: 'nonexistent-user' });
    FirebaseService.getUserData.mockResolvedValue(null);
    
    renderWithRouter(<UserProfile />);

    // Should navigate away when user not found
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('displays empty state when user has no characters', async () => {
    FirebaseService.getUserCharacters.mockResolvedValue([]);
    
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText("You haven't made any Characters yet.")).toBeInTheDocument();
    });
  });

  test('handles character loading error gracefully', async () => {
    FirebaseService.getUserCharacters.mockRejectedValue(new Error('Failed to load characters'));
    
    renderWithRouter(<UserProfile />);

    // Should still render profile even if characters fail to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  test('renders user avatar or initials correctly', async () => {
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      // Should render avatar image
      const avatarImage = screen.getByAltText('Test User');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  test('renders user initials when no avatar', async () => {
    const userWithoutAvatar = { ...mockUserData, userAvatar: '' };
    FirebaseService.getUserData.mockResolvedValue(userWithoutAvatar);
    
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      // Should render first letter of username as fallback
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  test('displays character placeholder when no avatar', async () => {
    renderWithRouter(<UserProfile />);

    await waitFor(() => {
      // Character 2 has no avatar, should show first letter
      expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test Character 2"
    });
  });
});