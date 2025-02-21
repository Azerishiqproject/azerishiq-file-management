import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App;

try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!privateKey) {
        throw new Error('FIREBASE_PRIVATE_KEY is not configured');
    }

    if (!process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('FIREBASE_CLIENT_EMAIL is not configured');
    }

    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured');
    }

    if (getApps().length === 0) {
        adminApp = initializeApp({
            credential: cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    } else {
        adminApp = getApps()[0];
    }
} catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw error;
}

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp); 