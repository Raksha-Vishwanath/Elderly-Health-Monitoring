import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCdbBj9H3mHFZnaoTcHMUTPvX4q6UqWbQo",
  authDomain: "medical-1be9b.firebaseapp.com",
  projectId: "medical-1be9b",
  storageBucket: "medical-1be9b.appspot.com",
  messagingSenderId: "719533498256",
  appId: "1:719533498256:web:ef919f32565b476844dd15",
  measurementId: "G-6MJH4FJL99"
};

// Initialize Firebase
let app;
let db;
let auth;

try {
  console.log('Starting Firebase initialization...');
  console.log('Firebase config:', JSON.stringify(firebaseConfig, null, 2));
  
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  db = getFirestore(app);
  console.log('Firestore initialized successfully');
  
  auth = getAuth(app);
  console.log('Firebase Auth initialized successfully');

  // Add auth state listener for debugging
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User is signed in:', user.uid);
      console.log('User email:', user.email);
      console.log('User email verified:', user.emailVerified);
    } else {
      console.log('No user is signed in');
    }
  });

  // Log available auth providers
  console.log('Auth providers:', auth.providerData);
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
}

export { db, auth };
export default app; 