import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Firebase Admin SDK yapılandırması
let app: App;
if (!getApps().length) {
    try {
        // Private key formatını düzelt - hem Windows hem de MacOS için çalışacak şekilde
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
        
        // Eğer JSON string olarak kaydedilmişse (Vercel'de yaygın)
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        
        // Escape karakterlerini düzelt
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        console.log('Initializing Firebase Admin with:', {
            projectId: process.env.FIREBASE_PROJECT_ID,
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!privateKey
        });

        app = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
        throw error; // Hata fırlatarak uygulamanın başlamamasını sağla
    }
} else {
    app = getApps()[0];
}

// Firestore ve Storage referanslarını al
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

export async function POST(request: Request) {
    try {
        console.log('Starting file upload process...');

        // CORS headers ekle
        const headers = new Headers({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });

        // OPTIONS request için response
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        // Firebase Admin SDK'nın doğru başlatıldığını kontrol et
        if (!app || !bucket) {
            console.error('Firebase Admin SDK not properly initialized');
            return NextResponse.json({ 
                error: 'Server configuration error',
                details: 'Firebase Admin SDK not properly initialized'
            }, { status: 500 });
        }

        // Form verilerini al
        const formData = await request.formData();
        const fileEntry = formData.get('file');
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        console.log('Form data received:', {
            hasFile: !!fileEntry,
            title,
            description
        });

        // Dosya kontrolü
        if (!fileEntry || !(fileEntry instanceof Blob)) {
            console.error('File validation failed:', { fileEntry });
            return NextResponse.json({ 
                error: 'No file provided',
                details: 'Please select a file to upload'
            }, { status: 400 });
        }

        // Dosya boyutu kontrolü (100MB limit)
        if (fileEntry.size > 100 * 1024 * 1024) {
            console.error('File size validation failed:', { size: fileEntry.size });
            return NextResponse.json({ 
                error: 'File too large',
                details: 'File size must be less than 100MB'
            }, { status: 400 });
        }

        // Dosya adı ve tip kontrolü
        let fileName = 'unknown';
        if ('name' in fileEntry && typeof fileEntry.name === 'string') {
            fileName = fileEntry.name;
        }

        const fileType = fileEntry.type || 'application/octet-stream';
        const fileSize = fileEntry.size;

        console.log('File details:', {
            name: fileName,
            type: fileType,
            size: fileSize
        });

        try {
            // Benzersiz dosya adı oluştur
            const timestamp = Date.now();
            const uniqueFileName = `${timestamp}-${fileName}`;
            const filePath = `docs/${uniqueFileName}`;

            console.log('Generated file path:', filePath);

            // Dosyayı Buffer'a dönüştür
            const buffer = Buffer.from(await fileEntry.arrayBuffer());

            // Dosyayı yükle
            console.log('Starting Firebase Storage upload...');
            const file = bucket.file(filePath);
            
            // Dosya yükleme işlemini try-catch bloğu içinde yap
            try {
                await file.save(buffer, {
                    metadata: {
                        contentType: fileType,
                        metadata: {
                            title: title || '',
                            description: description || '',
                            originalName: fileName
                        }
                    }
                });
                console.log('File uploaded to Firebase Storage successfully');
            } catch (uploadError) {
                console.error('Firebase Storage upload error:', uploadError);
                return NextResponse.json({ 
                    error: 'Storage upload failed',
                    details: uploadError instanceof Error ? uploadError.message : 'Failed to upload file to storage',
                }, { status: 500 });
            }

            // Download URL al
            console.log('Getting download URL...');
            let downloadURL;
            try {
                const [url] = await file.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500'
                });
                downloadURL = url;
                console.log('Download URL obtained:', downloadURL);
            } catch (urlError) {
                console.error('Failed to get download URL:', urlError);
                return NextResponse.json({ 
                    error: 'Failed to get download URL',
                    details: urlError instanceof Error ? urlError.message : 'Could not generate download URL',
                }, { status: 500 });
            }

            // Firestore'a metadata kaydet
            console.log('Saving metadata to Firestore...');
            let docRef;
            try {
                docRef = await db.collection('docs').add({
                    name: fileName,
                    title: title || fileName,
                    description: description || '',
                    size: fileSize,
                    type: fileType,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    downloadURL,
                    path: filePath,
                    status: 'active',
                    views: 0,
                    downloads: 0,
                    uploadedBy: 'anonymous',
                    uploadedByEmail: 'anonymous'
                });
                console.log('Metadata saved to Firestore successfully');
            } catch (firestoreError) {
                console.error('Firestore save error:', firestoreError);
                // Dosya yüklendi ama metadata kaydedilemedi, dosyayı silmeyi dene
                try {
                    await file.delete();
                    console.log('Deleted file from storage after Firestore error');
                } catch (deleteError) {
                    console.error('Failed to delete file after Firestore error:', deleteError);
                }
                
                return NextResponse.json({ 
                    error: 'Database operation failed',
                    details: firestoreError instanceof Error ? firestoreError.message : 'Failed to save file metadata',
                }, { status: 500 });
            }

            // Başarılı yanıt dön
            return NextResponse.json({
                id: docRef.id,
                name: fileName,
                title,
                description,
                size: fileSize,
                type: fileType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                downloadURL,
                path: filePath,
                status: 'active',
                views: 0,
                downloads: 0,
                uploadedBy: 'anonymous',
                uploadedByEmail: 'anonymous'
            });

        } catch (error: unknown) {
            console.error('Firebase operation error:', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });

            return NextResponse.json({ 
                error: 'Storage operation failed',
                details: error instanceof Error ? error.message : 'Failed to upload file to storage',
                stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
            }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('Request processing error:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json({ 
            error: 'Request failed',
            details: error instanceof Error ? error.message : 'Failed to process upload request',
        }, { status: 500 });
    }
} 