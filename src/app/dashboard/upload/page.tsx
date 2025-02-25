'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { uploadFile, uploadMultipleFiles } from '@/services/storage';
import { toast } from 'react-hot-toast';

export default function UploadPage() {
    const { userData, authStatus } = useAuth();
    const { handleProtectedNavigation } = useNavigation();
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        handleProtectedNavigation('/dashboard/upload');
    }, [handleProtectedNavigation]);

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

    const handleSingleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file); // Seçilen dosyayı yüklemeden ayarla
    };

    const handleMultipleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target?.files || []);
        if (files.length === 0) return;

        // Maksimum 50 dosya kontrolü
        if (files.length > 50) {
            toast.error('Maksimum 50 fayl seçə bilərsiniz');
            return;
        }

        try {
            setIsUploading(true);
            await uploadMultipleFiles(files);
            toast.success('Fayllar uğurla yükləndi');
            event.target.value = '';
        } catch (error) {
            console.error('Toplu yükleme hatası:', error);
            toast.error('Fayllar yüklənərkən bir xəta baş verdi');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadButtonClick = async () => {
        if (selectedFile) {
            try {
                setIsUploading(true);
                await uploadFile(selectedFile, description);
                toast.success('Fayl uğurla yükləndi');
                // Formu sıfırla
                setDescription('');
                setSelectedFile(null);
            } catch (error) {
                console.error('Yükleme hatası:', error);
                toast.error('Fayl yüklənərkən xəta baş verdi');
            } finally {
                setIsUploading(false);
            }
        }
    };

    // Yükleniyor durumunda spinner göster
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
                    <p className="text-gray-600">Bu səhifəyə giriş icazəniz yoxdur.</p>
                </div>
            </div>
        );
    }

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
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text mb-2 text-black">
                                    Fayl Yükleme
                                </h1>
                                <p className="text-gray-600 mb-6">
                                    Sisteme yeni fayllar yükləyə bilərsiniz.
                                </p>

                                <div className="space-y-6">
                                    {/* Tekli dosya yükleme */}
                                    <div className="bg-gray-50 p-6 rounded-xl">
                                        <h2 className="text-lg font-semibold mb-4 text-black">Tək Fayl Yükleme</h2>
                                        <div className="space-y-4">
                                            <div className="flex gap-4">
                                                <input
                                                    type="file"
                                                    onChange={handleSingleFileUpload}
                                                    disabled={isUploading}
                                                    className="block w-full text-sm text-gray-500
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-indigo-50 file:text-indigo-700
                                                        hover:file:bg-indigo-100"
                                                />
                                            </div>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Açıqlama (isteğe bağlı)"
                                                className="w-full p-2 border rounded text-black"
                                            />
                                        </div>
                                    </div>

                                    {/* Toplu dosya yükleme */}
                                    <div className="bg-gray-50 p-6 rounded-xl">
                                        <h2 className="text-lg font-semibold mb-4 text-black">Toplu Fayl Yükleme</h2>
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                                                isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="file"
                                                multiple
                                                max="50"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.epub,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.ico,.webp" 
                                                onChange={handleMultipleFileUpload}
                                                disabled={isUploading}
                                                className="block w-full text-sm text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-indigo-50 file:text-indigo-700
                                                    hover:file:bg-indigo-100"
                                            />
                                            <p className="text-sm text-gray-500 mt-2">
                                                Maksimum 50 fayl seçə bilərsiniz
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Yükle butonu */}
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={handleUploadButtonClick}
                                        disabled={isUploading || !selectedFile}
                                        className={`px-6 py-2 bg-indigo-600 text-white rounded-lg transition-colors ${
                                            isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                                        }`}
                                    >
                                        Yükle
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
} 