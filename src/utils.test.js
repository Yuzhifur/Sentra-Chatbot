// src/utils.test.js
// This is a simple test file that doesn't depend on React or complex imports

// Function to test
function sum(a, b) {
    return a + b;
  }
  
  // Test
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
  
  test('adds negative numbers correctly', () => {
    expect(sum(-1, -2)).toBe(-3);
  });
  
  // Simple string test
  test('string concatenation works', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
  });
  
  // Array test
  test('array operations work', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6]);
  });
  
  // Object test
  test('object operations work', () => {
    const obj = { name: 'Sentra', type: 'chatbot' };
    expect(obj.name).toBe('Sentra');
    expect(obj.type).toBe('chatbot');
    expect(Object.keys(obj)).toEqual(['name', 'type']);
  });