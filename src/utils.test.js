// src/utils.test.js
// This file contains basic utility function tests

// Simple utility function to test
export function formatUsername(username) {
    if (!username) return '';
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }
  
  // Get initials from a display name (e.g., "John Doe" -> "JD")
  export function getInitials(name) {
    if (!name) return '';
    
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2); // Limit to 2 characters
  }
  
  // Function to safely parse JSON with fallback
  export function safeJsonParse(jsonString, fallback = {}) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return fallback;
    }
  }
  
  // Tests
  describe('Utility Functions', () => {
    // Test formatUsername function
    describe('formatUsername', () => {
      test('capitalizes first letter and lowercases the rest', () => {
        expect(formatUsername('john')).toBe('John');
        expect(formatUsername('JANE')).toBe('Jane');
        expect(formatUsername('dOe')).toBe('Doe');
      });
  
      test('handles empty inputs', () => {
        expect(formatUsername('')).toBe('');
        expect(formatUsername(null)).toBe('');
        expect(formatUsername(undefined)).toBe('');
      });
    });
  
    // Test getInitials function
    describe('getInitials', () => {
      test('returns initials from a full name', () => {
        expect(getInitials('John Doe')).toBe('JD');
        expect(getInitials('Jane Smith')).toBe('JS');
      });
  
      test('handles single names', () => {
        expect(getInitials('John')).toBe('J');
      });
  
      test('handles empty inputs', () => {
        expect(getInitials('')).toBe('');
        expect(getInitials(null)).toBe('');
        expect(getInitials(undefined)).toBe('');
      });
      
      test('limits to two characters for long names', () => {
        expect(getInitials('John Jacob Smith')).toBe('JJ');
      });
    });
  
    // Test safeJsonParse function
    describe('safeJsonParse', () => {
      test('parses valid JSON', () => {
        expect(safeJsonParse('{"name":"John","age":30}')).toEqual({name: 'John', age: 30});
        expect(safeJsonParse('["a", "b", "c"]')).toEqual(['a', 'b', 'c']);
      });
  
      test('returns fallback for invalid JSON', () => {
        expect(safeJsonParse('invalid json')).toEqual({});
        expect(safeJsonParse('invalid json', [])).toEqual([]);
      });
    });
  });