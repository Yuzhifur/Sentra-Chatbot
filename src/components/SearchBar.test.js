// src/components/SearchBar.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import SearchBar from './SearchBar';

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => 'collection-ref'),
  query: jest.fn(() => 'query-ref'),
  where: jest.fn(() => 'where-clause'),
  getDocs: jest.fn(() => ({
    forEach: jest.fn()
  }))
}));

// Mock CharacterChatPopup
jest.mock('./CharacterChatPopup', () => ({
  __esModule: true,
  default: ({ characterId, characterName, onClose }) => (
    <div data-testid="chat-popup">
      Chat with {characterName}
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

// Mock search results
const mockUserResults = [
  {
    id: 'user-1',
    data: () => ({
      username: 'testuser',
      displayName: 'Test User',
      userAvatar: 'avatar.jpg'
    })
  }
];

const mockCharacterResults = [
  {
    id: 'char-1',
    data: () => ({
      id: '123',
      name: 'Test Character',
      avatar: 'char-avatar.jpg',
      authorDisplayName: 'Author Name',
      characterDescription: 'A test character'
    })
  }
];

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('SearchBar Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search input correctly', () => {
    renderWithRouter(<SearchBar />);
    
    expect(screen.getByPlaceholderText('Search Here for Characters')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  
  test('displays user search results', async () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => mockUserResults.forEach(callback)
    }).mockResolvedValue({ forEach: jest.fn() });
    
    renderWithRouter(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search Here for Characters');
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  
  test('navigates to user profile when user result clicked', async () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => mockUserResults.forEach(callback)
    }).mockResolvedValue({ forEach: jest.fn() });
    
    renderWithRouter(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search Here for Characters');
    fireEvent.change(input, { target: { value: 'testuser' } });
    
    await waitFor(() => {
      const userResult = screen.getByText('Test User');
      fireEvent.click(userResult);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile/user-1');
  });

  

  test('closes dropdown when clicking outside', async () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValueOnce({
      forEach: (callback) => mockUserResults.forEach(callback)
    }).mockResolvedValue({ forEach: jest.fn() });
    
    renderWithRouter(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search Here for Characters');
    fireEvent.change(input, { target: { value: 'test' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });
  });

  test('handles search errors gracefully', async () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockRejectedValue(new Error('Search failed'));
    
    renderWithRouter(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search Here for Characters');
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Should not crash and should stop loading
    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    });
  });

  test('searches by character ID when input is numeric', async () => {
    const { getDocs, query, where } = require('firebase/firestore');
    getDocs
      .mockResolvedValueOnce({ forEach: jest.fn() }) // users query
      .mockResolvedValueOnce({ // int ID query
        forEach: (callback) => mockCharacterResults.forEach(callback)
      })
      .mockResolvedValueOnce({ forEach: jest.fn() }); // name query
    
    renderWithRouter(<SearchBar />);
    
    const input = screen.getByPlaceholderText('Search Here for Characters');
    fireEvent.change(input, { target: { value: '123' } });
    
    await waitFor(() => {
      expect(screen.getByText('Test Character')).toBeInTheDocument();
    });
    
    // Verify that numeric search was performed
    expect(where).toHaveBeenCalledWith('id', '==', '123');
  });
});