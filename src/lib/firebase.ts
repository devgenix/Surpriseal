import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if API key is present to avoid crash
const isConfigValid = !!firebaseConfig.apiKey;
const app = isConfigValid ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;
const auth = app ? getAuth(app) : null;
// Use initializeFirestore with long polling to prevent hangs in some environments
const db = app ? initializeFirestore(app, {
  experimentalForceLongPolling: true,
}) : null;
const storage = app ? getStorage(app) : null;
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };
