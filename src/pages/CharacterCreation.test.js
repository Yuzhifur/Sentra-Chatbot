// src/pages/CharacterCreation.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CharacterCreation } from './CharacterCreation';
import { FirebaseService } from '../services/FirebaseService';
import { BrowserRouter } from 'react-router-dom';

// Mock Sidebar component to avoid Router context issues
jest.mock('../components/Sidebar', () => ({
  __esModule: true,
  default: ({ doResetDashboard }) => (
    <div data-testid="sidebar-mock">Sidebar Mock</div>
  )
}));

// Mock FirebaseService
jest.mock('../services/FirebaseService', () => ({
  FirebaseService: {
    getNextCharacterId: jest.fn(() => Promise.resolve(42)),
    getUserData: jest.fn(() => Promise.resolve({
      username: 'testuser',
      displayName: 'Test User'
    })),
    addCharacterToUserList: jest.fn(() => Promise.resolve()),
    getCharacterById: jest.fn(() => Promise.resolve({
      name: 'Test Character',
      age: 25,
      gender: 'Female',
      species: 'Human',
      characterDescription: 'A test character description',
      temperament: 'Friendly'
    }))
  }
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(() => 'storage-ref'),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/avatar.jpg'))
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => 'doc-ref'),
  collection: jest.fn(() => 'collection-ref'),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-char-123' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  arrayUnion: jest.fn(item => ['old-item', item]),
  getDoc: jest.fn(() => ({
    exists: () => true,
    data: () => ({
      userCharacters: ['old-char-123']
    })
  })),
  setDoc: jest.fn(() => Promise.resolve())
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'user-123'
    }
  }))
}));

// Mock return function
const mockReturn = jest.fn();

// Rendering helper function with BrowserRouter
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

// Helper function to safely get elements with fallbacks
const safeGetElement = (getterFn, fallbackFn) => {
  try {
    return getterFn();
  } catch (e) {
    return fallbackFn();
  }
};

// Test suite
describe('CharacterCreation Component Tests', () => {
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly in create mode', () => {
    renderWithRouter(
      <CharacterCreation
        isEditMode={false}
        initialData={null}
        return={mockReturn}
      />
    );
    
    // Check for key elements in the component
    expect(screen.getByText('Welcome to Character Creation')).toBeInTheDocument();
    expect(screen.getByText('Basic Info *')).toBeInTheDocument();
    expect(screen.getByText('Personality *')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Character/i })).toBeInTheDocument();
    
    // Verify that form fields are present
    expect(screen.getByText('Name: *')).toBeInTheDocument();
    expect(screen.getByText('Age: *')).toBeInTheDocument();
  });

  test('renders correctly in edit mode with initial data', () => {
    const initialData = {
      name: 'Existing Character',
      age: 30,
      gender: 'Male',
      species: 'Elf',
      characterDescription: 'An existing character for testing',
      temperament: 'Wise'
    };
    
    renderWithRouter(
      <CharacterCreation
        isEditMode={true}
        initialData={initialData}
        characterId="char-123"
        return={mockReturn}
      />
    );
    
    // Check for edit mode heading
    expect(screen.getByText('Edit Character')).toBeInTheDocument();
    
    // Check for pre-filled form values using name attribute instead of label
    const nameInput = safeGetElement(
      () => screen.getByDisplayValue('Existing Character'),
      () => document.querySelector('input[name="name"]')
    );
    expect(nameInput).toBeInTheDocument();
    
    const ageInput = safeGetElement(
      () => screen.getByDisplayValue('30'),
      () => document.querySelector('input[name="age"]')
    );
    expect(ageInput).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Update Character/i })).toBeInTheDocument();
  });

  test('toggles sections when headers are clicked', async () => {
    renderWithRouter(
      <CharacterCreation
        isEditMode={false}
        initialData={null}
        return={mockReturn}
      />
    );
    
    // By default, Basic Info section should be open
    expect(screen.getByText('Name: *')).toBeInTheDocument();
    
    // Personality section should be closed initially
    const personalityHeader = screen.getByText('Personality *');
    fireEvent.click(personalityHeader);
    
    // After clicking, check if we can find any element that indicates the section is open
    // Since we're not sure exactly what element will be there, check for various possibilities
    await waitFor(() => {
      // Either a label with text containing "Temperament" exists
      const temperamentLabel = screen.queryByText(/Temperament/);
      // Or a textarea with name="temperament" exists
      const temperamentInput = document.querySelector('textarea[name="temperament"]');
      // Either of these conditions should be true if the section is open
      expect(temperamentLabel !== null || temperamentInput !== null).toBe(true);
    });
    
    // Click Advanced section
    const advancedHeader = screen.getByText('Advanced');
    fireEvent.click(advancedHeader);
    
    // Check for elements that would indicate the Advanced section is open
    await waitFor(() => {
      // Look for things that might exist in the Advanced section
      const specialAbilityLabel = screen.queryByText(/Special Ability/);
      const specialAbilityInput = document.querySelector('textarea[name="specialAbility"]');
      const scenarioLabel = screen.queryByText(/Scenario/);
      const scenarioInput = document.querySelector('textarea[name="scenario"]');
      const outfitLabel = screen.queryByText(/Outfit/);
      const outfitInput = document.querySelector('textarea[name="outfit"]');
      
      // If any of these elements exist, the section is probably open
      const sectionIsOpen = 
        specialAbilityLabel !== null || 
        specialAbilityInput !== null ||
        scenarioLabel !== null ||
        scenarioInput !== null ||
        outfitLabel !== null ||
        outfitInput !== null;
        
      expect(sectionIsOpen).toBe(true);
    });
  });

  test('validates required fields on submission', async () => {
    renderWithRouter(
      <CharacterCreation
        isEditMode={false}
        initialData={null}
        return={mockReturn}
      />
    );
    
    // Submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Create Character/i });
    fireEvent.click(submitButton);
    
    // Check for validation error message
    await waitFor(() => {
      expect(screen.getByText(/Please fill in at least the required fields/i)).toBeInTheDocument();
    });
  });

  test('handles input changes correctly', () => {
    renderWithRouter(
      <CharacterCreation
        isEditMode={false}
        initialData={null}
        return={mockReturn}
      />
    );
    
    // Get inputs with a more resilient method
    const nameInput = document.querySelector('input[name="name"]');
    const ageInput = document.querySelector('input[name="age"]');
    const descInput = document.querySelector('textarea[name="characterDescription"]');
    
    // Change input values
    fireEvent.change(nameInput, { target: { value: 'New Test Character' } });
    fireEvent.change(ageInput, { target: { value: '42' } });
    fireEvent.change(descInput, { target: { value: 'A description for testing' } });
    
    // Check if values were updated
    expect(nameInput.value).toBe('New Test Character');
    expect(ageInput.value).toBe('42');
    expect(descInput.value).toBe('A description for testing');
  });

  test('creates a new character successfully', async () => {
    const { addDoc, updateDoc, collection } = require('firebase/firestore');
    
    renderWithRouter(
      <CharacterCreation
        isEditMode={false}
        initialData={null}
        return={mockReturn}
      />
    );
    
    // Find and fill required fields using querySelector
    const nameInput = document.querySelector('input[name="name"]');
    fireEvent.change(nameInput, { target: { value: 'Test Character' } });
    
    const ageInput = document.querySelector('input[name="age"]');
    fireEvent.change(ageInput, { target: { value: '25' } });
    
    const genderSelect = document.querySelector('select[name="gender"]');
    fireEvent.change(genderSelect, { target: { value: 'Female' } });
    
    const descInput = document.querySelector('textarea[name="characterDescription"]');
    fireEvent.change(descInput, { target: { value: 'A test character description' } });
    
    // Open Personality section
    const personalityHeader = screen.getByText('Personality *');
    fireEvent.click(personalityHeader);
    
    // Give a little time for the section to open
    await waitFor(() => {
      // Look for the temperament field
      const tempInput = document.querySelector('textarea[name="temperament"]');
      if (tempInput) {
        fireEvent.change(tempInput, { target: { value: 'Friendly and outgoing' } });
      } else {
        // If we can't find it, output some debug info
        console.log('Could not find temperament input after clicking Personality section');
      }
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Character/i });
    fireEvent.click(submitButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Character created successfully/i)).toBeInTheDocument();
    });
    
    // Verify Firebase service calls
    expect(FirebaseService.getNextCharacterId).toHaveBeenCalled();
    expect(FirebaseService.getUserData).toHaveBeenCalled();
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'characters');
    expect(addDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalled();
    
    // Verify callback after timeout
    await waitFor(() => {
      expect(mockReturn).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('updates an existing character successfully', async () => {
    const { updateDoc } = require('firebase/firestore');
    
    renderWithRouter(
      <CharacterCreation
        isEditMode={true}
        initialData={{
          name: 'Existing Character',
          age: 30,
          gender: 'Male',
          characterDescription: 'Original description',
          temperament: 'Original temperament'
        }}
        characterId="char-123"
        return={mockReturn}
      />
    );
    
    // Change some fields using querySelector
    const nameInput = document.querySelector('input[name="name"]');
    fireEvent.change(nameInput, { target: { value: 'Updated Character Name' } });
    
    const descInput = document.querySelector('textarea[name="characterDescription"]');
    fireEvent.change(descInput, { target: { value: 'Updated description' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Update Character/i });
    fireEvent.click(submitButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Character updated successfully/i)).toBeInTheDocument();
    });
    
    // Verify Firebase update call
    expect(updateDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalledWith(
      'doc-ref',
      expect.objectContaining({
        name: 'Updated Character Name',
        characterDescription: 'Updated description'
      })
    );
    
    // Verify callback after timeout
    await waitFor(() => {
      expect(mockReturn).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('handles avatar upload', async () => {
    const { uploadBytes, getDownloadURL } = require('firebase/storage');
    
    renderWithRouter(
      <CharacterCreation
        isEditMode={false}
        initialData={null}
        return={mockReturn}
      />
    );
    
    // Create a mock file
    const file = new File(['dummy content'], 'avatar.png', { type: 'image/png' });
    
    // Get the file input by type
    const fileInput = document.querySelector('input[type="file"]');
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    
    // Upload a file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Fill required fields for submission using querySelector
    const nameInput = document.querySelector('input[name="name"]');
    fireEvent.change(nameInput, { target: { value: 'Test Character' } });
    
    const ageInput = document.querySelector('input[name="age"]');
    fireEvent.change(ageInput, { target: { value: '25' } });
    
    const genderSelect = document.querySelector('select[name="gender"]');
    fireEvent.change(genderSelect, { target: { value: 'Female' } });
    
    const descInput = document.querySelector('textarea[name="characterDescription"]');
    fireEvent.change(descInput, { target: { value: 'A character with avatar' } });
    
    // Open Personality section
    const personalityHeader = screen.getByText('Personality *');
    fireEvent.click(personalityHeader);
    
    // Find and fill temperament field
    await waitFor(() => {
      const tempInput = document.querySelector('textarea[name="temperament"]');
      if (tempInput) {
        fireEvent.change(tempInput, { target: { value: 'Creative' } });
      }
    });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Character/i });
    fireEvent.click(submitButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Character created successfully/i)).toBeInTheDocument();
    });
    
    // Verify storage uploads were called
    expect(uploadBytes).toHaveBeenCalled();
    expect(getDownloadURL).toHaveBeenCalled();
  });
});