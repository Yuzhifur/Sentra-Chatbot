// src/setupTests.js
import '@testing-library/jest-dom';

// Add TextEncoder and TextDecoder polyfills for Node environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    return null;
  }

  unobserve() {
    return null;
  }

  disconnect() {
    return null;
  }
}

window.IntersectionObserver = MockIntersectionObserver;

// Mock window.scroll
window.scroll = jest.fn();

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock window.fs API for artifact tests
window.fs = {
  readFile: jest.fn().mockResolvedValue(new Uint8Array([]))
};

// Suppress console error and warnings during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});