import { FileData } from '@/types/file';
import { toast } from 'react-hot-toast';
import { db } from '@/config/firebase';
import { collection, getDocs, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';

// API endpoint'leri
const API_ENDPOINTS = {
    UPLOAD: '/api/files/upload',
    LIST: '/api/files/list',
    DOWNLOAD: '/api/files/download',
    DELETE: '/api/files/delete'
};

// Firestore koleksiyonu
const docsCollection = collection(db, 'docs');
const storage = getStorage();

// Hata işleme yardımcı fonksiyonu
const handleError = (error: unknown, message: string) => {
    console.error(message, error);
    const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu';
    toast.error(errorMessage);
    throw error instanceof Error ? error : new Error(message);
};

// Dosya listeleme
export const listFiles = async (): Promise<FileData[]> => {
    try {
        console.log('Fetching files from Firestore...');
        
        // Firestore'dan dokümanları getir
        const querySnapshot = await getDocs(docsCollection);
        console.log(`Found ${querySnapshot.size} documents`);

        // Dokümanları dönüştür
        const files = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            name: doc.data().name || '',
            title: doc.data().name || '',
            description: doc.data().description || '',
            size: doc.data().size || 0,
            type: 'pdf',
            uploadedAt: new Date().toISOString(),
            downloadURL: doc.data().downloadURL || '',
            path: doc.data().path || '',
            status: 'active',
            views: 0,
            downloads: 0,
            uploadedBy: 'admin',
            uploadedByEmail: 'admin@example.com'
        })) as FileData[];

        console.log('Successfully processed files:', files);
        return files;
    } catch (error) {
        handleError(error, 'Failed to list files');
        throw error;
    }
};

// Dosya yükleme
export const uploadFile = async (file: File, description: string) => {
    const loadingToast = toast.loading('Dosya yükleniyor...');
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description);

        const response = await fetch(API_ENDPOINTS.UPLOAD, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Dosya yüklenirken bir hata oluştu');
        }

        const data = await response.json();
        toast.success('Dosya başarıyla yüklendi', {
            id: loadingToast
        });
        return data as FileData;
    } catch (error) {
        handleError(error, 'Failed to upload file');
        throw error;
    }
};

// Toplu dosya yükleme
export const uploadMultipleFiles = async (files: File[]) => {
    const loadingToast = toast.loading(`${files.length} dosya yükleniyor...`);
    try {
        const uploadPromises = files.map(file => {
            const formData = new FormData();
            formData.append('file', file);

            return fetch(API_ENDPOINTS.UPLOAD, {
                method: 'POST',
                body: formData
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`${file.name} yüklenirken hata oluştu`);
                }
                return response.json();
            });
        });

        const results = await Promise.all(uploadPromises);
        toast.success(`${files.length} dosya başarıyla yüklendi`, {
            id: loadingToast
        });
        return results as FileData[];
    } catch (error) {
        handleError(error, 'Failed to upload files');
        throw error;
    }
};

// Dosya indirme URL'i alma
export const getDownloadUrl = async (id: string, path: string) => {
    try {
        const response = await fetch(`${API_ENDPOINTS.DOWNLOAD}?id=${encodeURIComponent(id)}`);
        
        if (!response.ok) {
            await handleError(null, 'Network error');
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        handleError(error, 'Failed to get download URL');
        throw error;
    }
};

// Dosya silme
export const deleteFile = async (id: string, path: string) => {
    const loadingToast = toast.loading('Dosya siliniyor...');
    try {
        // Önce Firestore'dan dokümanı sil
        const docRef = doc(db, 'docs', id);
        await deleteDoc(docRef);

        // Storage'dan silme işlemi için API endpoint'i kullan
        const response = await fetch(API_ENDPOINTS.DELETE, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path })
        });

        if (!response.ok) {
            throw new Error('Dosya silinirken bir hata oluştu');
        }

        toast.success('Dosya başarıyla silindi', {
            id: loadingToast
        });
        return { success: true };
    } catch (error) {
        handleError(error, 'Failed to delete file');
        throw error;
    }
}; 