import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        console.log('Fetching files from Firestore...');
        
        // Aktif dosyaları son yüklenme tarihine göre sırala
        const querySnapshot = await adminDb.collection('docs')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();

        console.log(`Found ${querySnapshot.size} documents`);

        const files = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
            };
        });

        console.log('Successfully processed files');
        return NextResponse.json(files);
    } catch (error) {
        console.error('List files error:', error);
        return NextResponse.json(
            { error: 'Failed to list files', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 