import { FileData } from '@/types/file';
import { toast } from 'react-hot-toast';
import { db } from '@/config/firebase';
import { collection, getDocs, doc, deleteDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    const loadingToast = toast.loading('Fayl yüklənir...');
    try {
        // Benzersiz dosya adı oluştur
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}-${file.name}`;
        const filePath = `docs/${uniqueFileName}`;

        // Storage referansı oluştur
        const storageRef = ref(storage, filePath);
        
        // Dosyayı yükle
        await uploadBytes(storageRef, file);
        
        // Download URL al
        const downloadURL = await getDownloadURL(storageRef);

        // Firestore'a metadata kaydet
        const docRef = await addDoc(docsCollection, {
            name: file.name,
            description: description || '',
            size: file.size,
            type: file.type,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            downloadURL,
            path: filePath,
            status: 'active',
            views: 0,
            downloads: 0,
            uploadedBy: 'anonymous',
            uploadedByEmail: 'anonymous'
        });

        toast.success('Fayl uğurla yüklendi', {
            id: loadingToast
        });

        return {
            id: docRef.id,
            name: file.name,
            description,
            size: file.size,
            type: file.type,
            downloadURL,
            path: filePath
        };
    } catch (error) {
        console.error('Upload error:', error);
        toast.error(error instanceof Error ? error.message : 'Fayl yüklənərkən xəta baş verdi', {
            id: loadingToast
        });
        throw error;
    }
};

// Toplu dosya yükleme
export const uploadMultipleFiles = async (files: File[]) => {
    const loadingToast = toast.loading(`${files.length} fayl yüklənir...`);
    try {
        const uploadPromises = files.map(async (file) => {
            // Benzersiz dosya adı oluştur
            const timestamp = Date.now();
            const uniqueFileName = `${timestamp}-${file.name}`;
            const filePath = `docs/${uniqueFileName}`;

            // Storage referansı oluştur
            const storageRef = ref(storage, filePath);
            
            // Dosyayı yükle
            await uploadBytes(storageRef, file);
            
            // Download URL al
            const downloadURL = await getDownloadURL(storageRef);

            // Firestore'a metadata kaydet
            const docRef = await addDoc(docsCollection, {
                name: file.name,
                description: '',
                size: file.size,
                type: file.type,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                downloadURL,
                path: filePath,
                status: 'active',
                views: 0,
                downloads: 0,
                uploadedBy: 'anonymous',
                uploadedByEmail: 'anonymous'
            });

            return {
                id: docRef.id,
                name: file.name,
                description: '',
                size: file.size,
                type: file.type,
                downloadURL,
                path: filePath
            };
        });

        const results = await Promise.all(uploadPromises);
        toast.success(`${files.length} fayl uğurla yüklendi`, {
            id: loadingToast
        });
        return results;
    } catch (error) {
        console.error('Bulk upload error:', error);
        toast.error(error instanceof Error ? error.message : 'Fayllar yüklənərkən xəta baş verdi', {
            id: loadingToast
        });
        throw error;
    }
};

// İndirme URL'i alma
export const getDownloadUrl = async (id: string) => {
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
export const deleteFile = async (id: string) => {
    try {
        // Get the document first to get the path
        const docRef = doc(db, 'docs', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error('Dosya bulunamadı');
        }

        const fileData = docSnap.data();
        const filePath = fileData.path;

        // Delete from Storage if path exists
        if (filePath) {
            const storageRef = ref(storage, filePath);
            try {
                await deleteObject(storageRef);
            } catch (storageError) {
                console.error('Storage deletion error:', storageError);
                // Continue with Firestore deletion even if Storage deletion fails
            }
        }

        // Delete from Firestore
        await deleteDoc(docRef);
        
        return { success: true };
    } catch (error) {
        handleError(error, 'Failed to delete file');
        throw error;
    }
}; 