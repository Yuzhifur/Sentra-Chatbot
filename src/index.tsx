// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC2c0dIp9pGtoezcqLL5Qt24w9z2v7tg0g",
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