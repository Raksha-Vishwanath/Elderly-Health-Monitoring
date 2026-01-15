import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';

// Collection References
export const patientsRef = collection(db, 'patients');
export const medicalHistoryRef = collection(db, 'medicalHistory');
export const medicationsRef = collection(db, 'medications');
export const appointmentsRef = collection(db, 'appointments');

// Verify database connection
console.log('Database initialized:', db);
console.log('Collection references created:', {
  patients: patientsRef,
  medicalHistory: medicalHistoryRef,
  medications: medicationsRef,
  appointments: appointmentsRef
});

// Patient Functions
export const addPatient = async (patientData) => {
  try {
    console.log('Adding patient to Firestore:', patientData);
    if (!db) {
      throw new Error('Database not initialized');
    }
    const docRef = await addDoc(patientsRef, {
      ...patientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('Patient added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding patient:', error);
    throw error;
  }
};

export const getPatient = async (patientId) => {
  try {
    console.log('Getting patient data for ID:', patientId);
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('Patient data found:', docSnap.data());
      return { id: docSnap.id, ...docSnap.data() };
    }
    console.log('No patient data found for ID:', patientId);
    return null;
  } catch (error) {
    console.error('Error getting patient:', error);
    throw error;
  }
};

// Medical History Functions
export const addMedicalHistory = async (patientId, historyData) => {
  try {
    const docRef = await addDoc(medicalHistoryRef, {
      patientId,
      ...historyData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding medical history:', error);
    throw error;
  }
};

export const getPatientMedicalHistory = async (patientId) => {
  try {
    const q = query(medicalHistoryRef, where('patientId', '==', patientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting medical history:', error);
    throw error;
  }
};

// Medication Functions
export const addMedication = async (patientId, medicationData) => {
  try {
    const docRef = await addDoc(medicationsRef, {
      patientId,
      ...medicationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

export const getPatientMedications = async (patientId) => {
  try {
    const q = query(medicationsRef, where('patientId', '==', patientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting medications:', error);
    throw error;
  }
};

// Appointment Functions
export const addAppointment = async (patientId, appointmentData) => {
  try {
    const docRef = await addDoc(appointmentsRef, {
      patientId,
      ...appointmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw error;
  }
};

export const getPatientAppointments = async (patientId) => {
  try {
    const q = query(appointmentsRef, where('patientId', '==', patientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
}; 