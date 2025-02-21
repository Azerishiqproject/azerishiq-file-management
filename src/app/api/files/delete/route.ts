import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function DELETE(request: Request) {
    try {
        const { path } = await request.json();

        if (!path) {
            return NextResponse.json({ error: 'Dosya yolu belirtilmedi' }, { status: 400 });
        }

        // Admin SDK ile storage'dan dosyayı sil
        const bucket = adminStorage.bucket();
        await bucket.file(path).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Dosya silinirken bir hata oluştu' }, 
            { status: 500 }
        );
    }
} 