'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/user';
import Image from 'next/image';

interface NavbarProps {
    user: User;
    isSidebarOpen?: boolean;
    onSidebarToggle?: () => void;
}

export default function Navbar({ user, isSidebarOpen, onSidebarToggle }: NavbarProps) {
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
        <nav className="bg-white shadow-sm h-16 sm:h-20">
            <div className="h-full px-3 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-full gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        {user.role === 'admin' && onSidebarToggle && (
                            <motion.button
                                onClick={onSidebarToggle}
                                className="block lg:hidden p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                    />
                                </svg>
                            </motion.button>
                        )}
                        <div className="flex-shrink-0">
                            <Image 
                                src="/azerishiqLogo.png" 
                                alt="Azerishiq Logo" 
                                className="h-8 sm:h-10 w-auto" 
                                width={128} 
                                height={32} 
                                priority
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <motion.button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center space-x-3 px-3 sm:px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-medium text-gray-900">
                                    {user.username}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                    {user.role}
                                </div>
                            </div>
                            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
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
                                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50"
                                >
                                    <div className="px-4 py-2 text-sm text-gray-500 border-b sm:hidden">
                                        <div className="font-medium text-gray-900">{user.username}</div>
                                        <div className="capitalize">{user.role}</div>
                                    </div>
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