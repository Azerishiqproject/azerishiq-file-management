'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const LoadingSpinner = () => (
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
);

export default function LoginPage() {
    const { login, authStatus } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authStatus === 'authenticated') {
            router.replace('/dashboard');
        }
    }, [authStatus, router]);

    // Loading durumunda spinner göster
    if (authStatus === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
                <LoadingSpinner />
            </div>
        );
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            router.replace('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full"
            >
                <div className="bg-white p-8 rounded-2xl shadow-xl space-y-8">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 className="text-center text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text">
                                Azerishiq
                            </h1>
                        </motion.div>
                        <h2 className="text-center text-2xl font-medium text-gray-700">
                            Hesabınıza giriş yapın
                        </h2>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    E-posta
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    disabled={isSubmitting}
                                    className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out text-gray-900 text-base"
                                    placeholder="E-posta adresinizi girin"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Şifre
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    disabled={isSubmitting}
                                    className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out text-gray-900 text-base"
                                    placeholder="Şifrenizi girin"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3 px-4 text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl ${
                                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Giriş yapılıyor...
                                </div>
                            ) : (
                                'Giriş Yap'
                            )}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
} 