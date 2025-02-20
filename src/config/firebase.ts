import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAPgV-PDc5Aca7MZs_5O1Hj6gajwdO2nGs",
    authDomain: "azerishiq-file-managment.firebaseapp.com",
    projectId: "azerishiq-file-managment",
    storageBucket: "azerishiq-file-managment.appspot.com",
    messagingSenderId: "787810475194",
    appId: "1:787810475194:web:f85c39e8d29befe9e2f683"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app; 