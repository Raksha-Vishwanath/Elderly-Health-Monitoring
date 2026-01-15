import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Auth state changed - User is signed in:', user.uid);
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'patients', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            console.log('User data found in Firestore');
            setUser({ ...user, ...userDocSnap.data() });
          } else {
            console.log('No user data found in Firestore');
            setUser(user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(user);
        }
      } else {
        console.log('Auth state changed - No user is signed in');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, userData) => {
    try {
      console.log('Starting signup process...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      console.log('User created with ID:', userId);
      
      // Create patient document
      const patientData = {
        uid: userId,
        email,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Creating patient document...');
      const patientDocRef = doc(db, 'patients', userId);
      await setDoc(patientDocRef, patientData);
      
      // Create empty collections for the user
      console.log('Creating user collections...');
      
      // Create medications collection
      const medicationsDocRef = doc(db, 'medications', userId);
      await setDoc(medicationsDocRef, {
        medications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Create medical history collection
      const historyDocRef = doc(db, 'medicalHistory', userId);
      await setDoc(historyDocRef, {
        history: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Create appointments collection
      const appointmentsDocRef = doc(db, 'appointments', userId);
      await setDoc(appointmentsDocRef, {
        appointments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('All collections created successfully');
      return userCredential.user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Starting login process...');
      console.log('Attempting to login with email:', email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful, user ID:', userCredential.user.uid);

      // Check if user data exists in Firestore
      const userDocRef = doc(db, 'patients', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      console.log('User data from Firestore:', userDocSnap.exists() ? userDocSnap.data() : 'No data found');

      if (!userDocSnap.exists()) {
        console.log('No user data found in Firestore, creating new patient record');
        // Create a new patient record if it doesn't exist
        const newPatientData = {
          uid: userCredential.user.uid,
          email: email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newPatientData);
        console.log('New patient record created');
      }

      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signup,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 