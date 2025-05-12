// jest-setup.js
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set up URL polyfill if needed
const { URL } = require('url');
global.URL = URL;