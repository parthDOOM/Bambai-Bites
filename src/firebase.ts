import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBu90X4Wo45e-OrshFJtSsayI1OWLccKpw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bambai-bites.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bambai-bites",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bambai-bites.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "442263565389",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:442263565389:web:c318358308e695bdabd804"
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
