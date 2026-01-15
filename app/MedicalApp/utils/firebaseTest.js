import { db } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to add a test document
    const testCollection = collection(db, 'test');
    const docRef = await addDoc(testCollection, {
      test: 'Hello Firebase',
      timestamp: new Date().toISOString()
    });
    console.log('Test document added with ID:', docRef.id);

    // Try to read the test document
    const querySnapshot = await getDocs(testCollection);
    console.log('Test documents found:', querySnapshot.size);
    querySnapshot.forEach((doc) => {
      console.log('Document data:', doc.id, doc.data());
    });

    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}; 