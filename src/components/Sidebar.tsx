'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { motion } from 'framer-motion';

export default function Sidebar() {
    const { navigateTo } = useNavigation();

    const menuItems = [
        {
            name: 'Ana Səhifə',
            path: '/dashboard',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            name: 'Fayl Yükle',
            path: '/dashboard/upload',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
            )
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-64 bg-white shadow-sm min-h-screen h-full p-4"
        >
            <nav className="space-y-1 ">
                {menuItems.map((item) => (
                    <motion.button
                        key={item.path}
                        onClick={() => navigateTo(item.path)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors duration-200"
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </motion.button>
                ))}
            </nav>
        </motion.div>
    );
} 