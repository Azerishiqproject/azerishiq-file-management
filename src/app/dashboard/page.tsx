'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import Sidebar from '@/components/Sidebar';
import FileList from '@/components/FileList';
import Navbar from '@/components/Navbar';
import { deleteFile } from '@/services/storage';
import { toast } from 'react-hot-toast';
import { FileData } from '@/types/file';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function DashboardPage() {
    const { userData, authStatus } = useAuth();
    const { handleProtectedNavigation } = useNavigation();
    const [files, setFiles] = useState<FileData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('Fetching files...');
            
            // Auth kontrolü
            if (!userData || !userData.email) {
                console.log('No user data available, waiting for auth...');
                return;
            }

            // Firestore'dan dokümanları getir
            const querySnapshot = await getDocs(collection(db, 'docs'));
            console.log(`Found ${querySnapshot.size} documents`);

            // Dokümanları dönüştür
            const filesList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Processing document:', doc.id, data);
                return {
                    id: doc.id,
                    name: data.name || '',
                    title: data.name || '',
                    description: data.description || 'no explanation',
                    size: data.size || 0,
                    type: 'pdf',
                    uploadedAt: new Date().toISOString(),
                    downloadURL: data.downloadURL || '',
                    path: data.path || '',
                    status: 'active',
                    views: 0,
                    downloads: 0,
                    uploadedBy: userData.email,
                    uploadedByEmail: userData.email
                } as FileData;
            });

            console.log('Files processed:', filesList);
            setFiles(filesList);
        } catch (error) {
            console.error('Error fetching files:', error);
            const errorMessage = error instanceof Error ? error.message : 'Dosyalar yüklenirken bir hata oluştu';
            console.error('Detailed error:', error);
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [userData]);

    useEffect(() => {
        handleProtectedNavigation('/dashboard');
        if (userData && userData.email) {
            fetchFiles();
        }
    }, [handleProtectedNavigation, userData, fetchFiles]);

    const handleDownload = async (downloadURL: string, fileName: string) => {
        try {
            console.log('Download URL:', downloadURL);
            if (!downloadURL) {
                throw new Error('İndirme bağlantısı bulunamadı');
            }

            // Fetch API ile dosyayı indir
            const response = await fetch(downloadURL);
            if (!response.ok) {
                throw new Error('Fayl yüklənmədi');
            }

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Fayl yüklənir...');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Fayl yüklənərkən xəta baş verdi');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu faylı silmek istədiyinizə əminsiniz?')) {
            return;
        }

        try {
            setIsLoading(true);
            await deleteFile(id);
            toast.success('Fayl uğurla silindi');
            await fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Fayl silinirken xəta baş verdi');
        } finally {
            setIsLoading(false);
        }
    };

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

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar user={{
                id: userData.uid,
                username: userData.email || '',
                role: userData.role
            }} />
            
            <div className="flex">
                {/* Admin için sidebar */}
                {userData.role === 'admin' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Sidebar />
                    </motion.div>
                )}

                {/* Ana içerik */}
                <motion.main 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 p-6"
                >
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text mb-2">
                                    {userData.role === 'admin' ? 'Bütün fayllar' : 'Fayllar'}
                                </h1>
                                <p className="text-gray-600 mb-4">
                                    {userData.role === 'admin' 
                                        ? 'Sistemdəki faylları burdan idarə edə bilərsiniz.'
                                        : 'Sistemdəki faylları burdan görə bilərsiniz.'}
                                </p>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <FileList 
                                files={files} 
                                userRole={userData.role}
                                onDownload={(downloadURL: string, fileName: string) => {
                                    handleDownload(downloadURL, fileName);
                                    return void 0;
                                }}
                                onDelete={userData.role === 'admin' ? handleDelete : undefined}
                                isLoading={isLoading}
                            />
                        </motion.div>
                    </div>
                </motion.main>
            </div>
        </div>
    );
} 