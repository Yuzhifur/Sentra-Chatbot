// src/components/CharacterChatPopup.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import CharacterChatPopup from './CharacterChatPopup';

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock ScenarioSelectionPopup
jest.mock('./ScenarioSelectionPopup', () => ({
  __esModule: true,
  default: ({ characterId, characterName, defaultScenario, onClose }) => (
    <div data-testid="scenario-popup">
      <span>Scenario for {characterName}</span>
      <span>Default: {defaultScenario}</span>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'user-123' }
  }))
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => {
  const mockTimestamp = { toDate: () => new Date('2023-12-01T10:30:00Z') };
  
  const mockChatHistory = [
    {
      id: 'chat-1',
      data: () => ({
        title: 'First Chat',
        characterId: 'char-123',
        characterName: 'Test Character',
        avatar: 'https://example.com/avatar.jpg',
        lastUpdated: mockTimestamp
      })
    },
    {
      id: 'chat-2', 
      data: () => ({
        title: 'Second Chat',
        characterId: 'char-123',
        characterName: 'Test Character',
        avatar: '',
        lastUpdated: mockTimestamp
      })
    }
  ];

  return {
    getFirestore: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(() => ({ docs: mockChatHistory })),
    getDoc: jest.fn(() => ({
      exists: () => true,
      data: () => ({
        name: 'Test Character',
        scenario: 'Default test scenario'
      })
    })),
    doc: jest.fn()
  };
});

// Test props
const defaultProps = {
  characterId: 'char-123',
  characterName: 'Test Character',
  onClose: jest.fn()
};

// Helper to render with router
const renderWithRouter = (ui) => render(ui, { wrapper: BrowserRouter });

describe('CharacterChatPopup Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with character name', async () => {
    renderWithRouter(<CharacterChatPopup {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Chats with Test Character')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Start New Chat')).toBeInTheDocument();
  });

  test('shows loading initially', () => {
    renderWithRouter(<CharacterChatPopup {...defaultProps} />);
    expect(screen.getByText('Loading chat history...')).toBeInTheDocument();
  });

  test('shows empty state when no chats', async () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValueOnce({ docs: [] });
    
    renderWithRouter(<CharacterChatPopup {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('No previous chats with this character')).toBeInTheDocument();
    });
  });

  test('closes when close button clicked', () => {
    const mockOnClose = jest.fn();
    renderWithRouter(<CharacterChatPopup {...defaultProps} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('×'));
    expect(mockOnClose).toHaveBeenCalled();
  });


  test('opens scenario popup for new chat', async () => {
    renderWithRouter(<CharacterChatPopup {...defaultProps} />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Start New Chat'));
    });
    
    expect(screen.getByTestId('scenario-popup')).toBeInTheDocument();
    expect(screen.getByText('Scenario for Test Character')).toBeInTheDocument();
  });

  test('passes default scenario to popup', async () => {
    renderWithRouter(<CharacterChatPopup {...defaultProps} />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Start New Chat'));
    });
    
    expect(screen.getByText('Default: Default test scenario')).toBeInTheDocument();
  });

  test('handles missing character scenario', async () => {
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: 'Test Character' }) // No scenario
    });
    
    renderWithRouter(<CharacterChatPopup {...defaultProps} />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Start New Chat'));
    });
    
    expect(screen.getByText('Default:')).toBeInTheDocument();
  });

  test('handles authentication error', async () => {
    const { getAuth } = require('firebase/auth');
    getAuth.mockReturnValueOnce({ currentUser: null });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    renderWithRouter(<CharacterChatPopup {...defaultProps} />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('User not authenticated');
    });
    
    consoleSpy.mockRestore();
  });

  test('handles firestore error gracefully', async () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockRejectedValueOnce(new Error('Firestore error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    renderWithRouter(<CharacterChatPopup {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Start New Chat')).toBeInTheDocument();
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });


  test('closes main popup when scenario popup closes', async () => {
    const mockOnClose = jest.fn();
    renderWithRouter(<CharacterChatPopup {...defaultProps} onClose={mockOnClose} />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Start New Chat'));
    });
    
    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});