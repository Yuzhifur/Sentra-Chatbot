// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import React from 'react';
import ReactDOM from 'react-dom/client';
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { BrowserRouter } from 'react-router-dom';
import { App } from './App'; // Fix: there is app and App
import './index.css';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

let appCheck;
if (window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1') {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LcCxB8rAAAAAARP0L6WZ_oDKY8MUyXvGznMxFO7'),
    isTokenAutoRefreshEnabled: true
  });
}

if (window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1') {
  console.log('Using Firebase emulators');
  connectFirestoreEmulator(db, 'localhost', 8081);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
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