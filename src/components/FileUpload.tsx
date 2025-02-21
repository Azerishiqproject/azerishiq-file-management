'use client';

import { useState, useCallback } from 'react';
import { File as CustomFile, FileType } from '@/types/file';
import { motion } from 'framer-motion';

interface FileUploadProps {
    onUpload: (file: CustomFile) => void;
}

interface FileFormData {
    title: string;
    description: string;
    file: File | null;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState<FileFormData>({
        title: '',
        description: '',
        file: null
    });
    const [isLoading, setIsLoading] = useState(false);

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const getFileType = (mimeType: string): FileType | null => {
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.includes('word')) return 'word';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
        return null;
    };

    const validateFile = useCallback((file: File) => {
        if (!allowedTypes.includes(file.type)) {
            setError('Sadece PDF, Word ve Excel dosyaları yüklenebilir.');
            return false;
        }

        const fileType = getFileType(file.type);
        if (!fileType) {
            setError('Desteklenmeyen dosya tipi.');
            return false;
        }

        return true;
    }, [allowedTypes]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        const file = e.dataTransfer.files[0];
        if (!file) return;

        if (validateFile(file)) {
            setSelectedFile(file);
            setFormData(prev => ({ ...prev, file }));
        }
    }, [validateFile]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (validateFile(file)) {
            setSelectedFile(file);
            setFormData(prev => ({ ...prev, file }));
        }
    }, [validateFile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.file) {
            setError('Lütfen bir dosya seçin.');
            return;
        }

        if (!formData.title.trim()) {
            setError('Lütfen dosya başlığını girin.');
            return;
        }

        setIsLoading(true);

        try {
            const fileType = getFileType(formData.file.type);
            if (!fileType) throw new Error('Geçersiz dosya tipi');

            const fileUrl = window.URL.createObjectURL(new Blob([formData.file]));

            const customFile: CustomFile = {
                id: Date.now().toString(),
                name: formData.title,
                type: fileType,
                size: formData.file.size,
                uploadedBy: 'current-user',
                uploadedAt: new Date(),
                url: fileUrl,
                description: formData.description
            };

            onUpload(customFile);
            
            setFormData({
                title: '',
                description: '',
                file: null
            });
            setSelectedFile(null);
        } catch (err) {
            setError('Dosya yükleme sırasında bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dosya Yükleme Alanı */}
            <motion.div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
                    isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-500 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.01 }}
                animate={{ borderColor: isDragging ? '#6366f1' : '#e5e7eb' }}
            >
                <div className="space-y-4">
                    <motion.div
                        animate={{ 
                            scale: isDragging ? 1.1 : 1,
                            y: isDragging ? -10 : 0
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </motion.div>
                    <div className="text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer">
                            <span className="text-indigo-600 hover:text-indigo-500 font-medium">Dosya seçin</span>
                            <span className="text-gray-500"> veya sürükleyip bırakın</span>
                            <input
                                id="file-upload"
                                type="file"
                                className="sr-only"
                                accept={allowedTypes.join(',')}
                                onChange={handleFileSelect}
                            />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">PDF, Word veya Excel</p>
                    {selectedFile && (
                        <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-medium text-indigo-600"
                        >
                            Seçilen dosya: {selectedFile.name}
                        </motion.p>
                    )}
                </div>
            </motion.div>

            {/* Başlık ve Açıklama Alanları */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Dosya Başlığı
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="appearance-none w-full rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200"
                        placeholder="Dosya başlığını girin"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Açıklama
                    </label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="appearance-none w-full rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200"
                        placeholder="Dosya hakkında açıklama girin"
                    />
                </div>
            </div>

            {/* Hata Mesajı */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-50 text-red-600 text-sm"
                >
                    {error}
                </motion.div>
            )}

            {/* Yükleme Butonu */}
            <motion.button
                type="submit"
                disabled={isLoading || !selectedFile}
                className={`w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg ${
                    (isLoading || !selectedFile) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                {isLoading ? 'Yükleniyor...' : 'Dosyayı Yükle'}
            </motion.button>
        </form>
    );
} 