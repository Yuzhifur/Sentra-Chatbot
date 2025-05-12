module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/jest-setup.js'],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    moduleNameMapper: {
      "\\.(css|less|scss|sass)$": "identity-obj-proxy"
    },
    transform: {
      "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
    },
    testMatch: [
      "**/__tests__/**/*.js?(x)",
      "**/?(*.)+(spec|test).js?(x)"
    ],
    transformIgnorePatterns: [
      "/node_modules/(?!(@firebase|firebase|react-router|@remix-run)/)"
    ],
    verbose: true,
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node']
  };