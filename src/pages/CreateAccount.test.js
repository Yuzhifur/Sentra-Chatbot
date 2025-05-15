// src/pages/CreateAccount.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateAccount } from './CreateAccount';
import { FirebaseService } from '../services/FirebaseService';

// Mock FirebaseService
jest.mock('../services/FirebaseService', () => ({
  FirebaseService: {
    createAccount: jest.fn(() => Promise.resolve({ uid: 'new-user-123' })),
    isUsernameAvailable: jest.fn(() => Promise.resolve(true)),
    createUserDocument: jest.fn(() => Promise.resolve())
  }
}));

describe('CreateAccount Component Tests', () => {
  // Mock function for switching to login
  const mockSwitchToLogin = jest.fn();

  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('handles switching to login', () => {
    render(<CreateAccount doSwitchToLogin={mockSwitchToLogin} />);
    
    // Click on the login link
    fireEvent.click(screen.getByText(/Already have an account\? Login instead/i));
    
    // Check if mock function was called
    expect(mockSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  test('handles input changes', () => {
    render(<CreateAccount doSwitchToLogin={mockSwitchToLogin} />);
    
    // Get form fields
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    
    // Change values
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    // Check values updated
    expect(usernameInput.value).toBe('testuser');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  test('shows error when passwords do not match', async () => {
    render(<CreateAccount doSwitchToLogin={mockSwitchToLogin} />);
    
    // Fill out form with mismatched passwords
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password456' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
    
    // Check that account creation was not called
    expect(FirebaseService.createAccount).not.toHaveBeenCalled();
  });

  test('validates minimum password length', async () => {
    render(<CreateAccount doSwitchToLogin={mockSwitchToLogin} />);
    
    // Fill out form with short password
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'pass' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'pass' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    // Check that account creation was not called
    expect(FirebaseService.createAccount).not.toHaveBeenCalled();
  });

  test('validates username length', async () => {
    render(<CreateAccount doSwitchToLogin={mockSwitchToLogin} />);
    
    // Fill out form with short username
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'ab' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument();
    });
    
    // Check that account creation was not called
    expect(FirebaseService.createAccount).not.toHaveBeenCalled();
  });

  test('successful account creation with valid inputs', async () => {
    render(<CreateAccount doSwitchToLogin={mockSwitchToLogin} />);
    
    // Fill out form with valid data
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    
    // Check that services were called with correct arguments
    await waitFor(() => {
      expect(FirebaseService.createAccount).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(FirebaseService.createUserDocument).toHaveBeenCalledWith('new-user-123', expect.objectContaining({
        username: 'testuser',
        displayName: 'testuser',
        email: 'test@example.com'
      }));
    });
  });
});