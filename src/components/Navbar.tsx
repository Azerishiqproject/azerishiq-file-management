'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/user';

interface NavbarProps {
    user: User;
}

export default function Navbar({ user }: NavbarProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Çıkış yapılırken hata oluştu:', error);
        }
    };

    return (
        <nav className="bg-white shadow-sm h-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex justify-between items-center h-full">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text">
                            Azerishiq
                        </h1>
                    </div>

                    <div className="relative">
                        <motion.button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                    {user.username}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                    {user.role}
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </motion.button>

                        <AnimatePresence>
                            {showDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 py-1"
                                >
                                    <motion.button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                        whileHover={{ x: 4 }}
                                    >
                                        Çıkış Yap
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </nav>
    );
} 