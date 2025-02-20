'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function UploadPage() {
    const { userData, authStatus } = useAuth();
    const { handleProtectedNavigation } = useNavigation();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        handleProtectedNavigation('/dashboard/upload');
    }, [handleProtectedNavigation]);

    // Loading durumunda spinner göster
    if (authStatus === 'loading' || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"
                />
            </div>
        );
    }

    // Sadece admin kullanıcılar için erişim
    if (userData.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Erişim Reddedildi</h1>
                    <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
                </div>
            </div>
        );
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement file upload logic
        console.log('Uploading:', { title, description, file: selectedFile });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar user={{
                id: userData.uid,
                username: userData.email || '',
                role: userData.role
            }} />
            
            <div className="flex">
                <Sidebar />

                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text mb-2">
                                    Dosya Yükleme
                                </h1>
                                <p className="text-gray-600">
                                    Sisteme yeni dosyalar yükleyebilirsiniz.
                                </p>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-sm p-6"
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* Başlık alanı */}
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                            Başlık
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Dosya başlığını girin"
                                            required
                                        />
                                    </div>

                                    {/* Açıklama alanı */}
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                            Açıklama
                                        </label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Dosya açıklamasını girin"
                                            rows={4}
                                            required
                                        />
                                    </div>

                                    {/* Dosya yükleme alanı */}
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                                            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                                        }`}
                                    >
                                        <div className="space-y-2">
                                            {selectedFile ? (
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">{selectedFile.name}</span>
                                                    <br />
                                                    <span>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                </div>
                                            ) : (
                                                <div className="text-gray-600">
                                                    Dosyaları sürükleyip bırakın veya seçin
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                id="file"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                required
                                            />
                                            <label
                                                htmlFor="file"
                                                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                                            >
                                                Dosya Seç
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Gönder butonu */}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Yükle
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
} 