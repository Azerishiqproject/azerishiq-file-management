'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import Sidebar from '@/components/Sidebar';
import FileList from '@/components/FileList';
import Navbar from '@/components/Navbar';
import { File } from '@/types/file';

// Örnek dosyalar
const sampleFiles: File[] = [
    {
        id: '1',
        name: 'Rapor-2024.pdf',
        type: 'pdf',
        size: 2500000, // 2.5 MB
        uploadedBy: 'admin',
        uploadedAt: new Date('2024-02-15'),
        url: '#'
    },
    {
        id: '2',
        name: 'Sunum.docx',
        type: 'word',
        size: 1800000, // 1.8 MB
        uploadedBy: 'admin',
        uploadedAt: new Date('2024-02-16'),
        url: '#'
    },
    {
        id: '3',
        name: 'Veriler.xlsx',
        type: 'excel',
        size: 950000, // 0.95 MB
        uploadedBy: 'admin',
        uploadedAt: new Date('2024-02-17'),
        url: '#'
    }
];

export default function DashboardPage() {
    const { userData, authStatus } = useAuth();
    const { handleProtectedNavigation } = useNavigation();

    useEffect(() => {
        handleProtectedNavigation('/dashboard');
    }, [authStatus, handleProtectedNavigation]);

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
                                    {userData.role === 'admin' ? 'Tüm Dosyalar' : 'Dosyalar'}
                                </h1>
                                <p className="text-gray-600">
                                    {userData.role === 'admin' 
                                        ? 'Sistemdeki tüm dosyaları buradan yönetebilirsiniz.'
                                        : 'Size atanan dosyaları buradan görüntüleyebilirsiniz.'}
                                </p>
                            </motion.div>
                        </div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <FileList files={sampleFiles} userRole={userData.role} />
                        </motion.div>
                    </div>
                </motion.main>
            </div>
        </div>
    );
} 