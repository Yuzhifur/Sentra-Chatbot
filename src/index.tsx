// src/index.tsx
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// NEW: Import Firebase AI Logic
import { getAI, GoogleAIBackend } from "firebase/ai";

import React from 'react';
import ReactDOM from 'react-dom/client';
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "sentra-4114a.firebaseapp.com",
  projectId: "sentra-4114a",
  storageBucket: "sentra-4114a.firebasestorage.app",
  messagingSenderId: "614598589929",
  appId: "1:614598589929:web:b3f4dd3023a8931e62df78",
  measurementId: "G-7SETKM1MXF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const functions = getFunctions(app);

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LfX4FErAAAAAJZ30GtWFskgSKQJuCqeJ7i9FnXP'),
});

console.log("Check if appCheck is valid:");
console.log(appCheck)

// NEW: Initialize Firebase AI Logic
let ai: any = null;
try {
  ai = getAI(app, { backend: new GoogleAIBackend() });
  console.log('Firebase AI Logic initialized successfully');
} catch (error) {
  console.warn('Firebase AI Logic initialization failed:', error);
  console.warn('Avatar generation will not be available');
}

// Export Firebase instances for use in other modules
export { app as default, db, storage, auth, functions, ai };




if (window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1') {
  console.log('Using Firebase emulators');
  connectFirestoreEmulator(db, 'localhost', 8081);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);

  // Note: Firebase AI Logic emulator is not available yet
  // Avatar generation will use the live service even in development
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);