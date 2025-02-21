import { S3Client } from '@aws-sdk/client-s3';
import { cloudflareConfig } from '../config/cloudflare';

// S3 Client oluşturma - Sadece server-side'da çalışacak
let s3Client: S3Client | null = null;

const getS3Client = () => {
    if (typeof window !== 'undefined') {
        throw new Error('S3 client can only be used on the server side');
    }

    if (!s3Client) {
        const accessKeyId = cloudflareConfig.accessKeyId;
        const secretAccessKey = cloudflareConfig.secretAccessKey;

        if (!accessKeyId || !secretAccessKey) {
            throw new Error('Cloudflare credentials are not configured');
        }

        s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${cloudflareConfig.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    return s3Client;
};

// API endpoint'leri
const API_ENDPOINTS = {
    UPLOAD: '/api/files/upload',
    LIST: '/api/files/list',
    DOWNLOAD: '/api/files/download',
    DELETE: '/api/files/delete',
};

// Dosya yükleme
export const uploadFile = async (file: File, title: string, description: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);

    const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to upload file');
    }

    return response.json();
};

// Dosya listeleme
export const listFiles = async () => {
    const response = await fetch(API_ENDPOINTS.LIST);
    
    if (!response.ok) {
        throw new Error('Failed to list files');
    }

    const files = await response.json();
    return files.map((file: any) => ({
        id: file.key,
        name: file.name,
        type: getFileType(file.name.split('.').pop() || ''),
        size: file.size,
        uploadedAt: new Date(file.uploadedAt),
        uploadedBy: 'admin',
        url: file.url
    }));
};

// İndirme URL'i alma
export const getDownloadUrl = async (key: string) => {
    const response = await fetch(`${API_ENDPOINTS.DOWNLOAD}?key=${encodeURIComponent(key)}`);
    
    if (!response.ok) {
        throw new Error('Failed to get download URL');
    }

    const { url } = await response.json();
    return url;
};

// Dosya silme
export const deleteFile = async (key: string) => {
    const response = await fetch(API_ENDPOINTS.DELETE, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
    });

    if (!response.ok) {
        throw new Error('Failed to delete file');
    }

    return response.json();
};

// Dosya tipini belirleme yardımcı fonksiyonu
const getFileType = (extension: string): 'pdf' | 'word' | 'excel' | 'other' => {
    switch (extension.toLowerCase()) {
        case 'pdf':
            return 'pdf';
        case 'doc':
        case 'docx':
            return 'word';
        case 'xls':
        case 'xlsx':
            return 'excel';
        default:
            return 'other';
    }
}; 