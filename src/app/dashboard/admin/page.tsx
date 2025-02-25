'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { 
    createUserWithEmailAndPassword, 
    updatePassword, 
    signInWithEmailAndPassword,
    getAuth,
    deleteUser
} from 'firebase/auth';
import { doc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { UserRole } from '@/types/user';
import { FirebaseError } from 'firebase/app';

interface FormData {
    email: string;
    password: string;
    role: UserRole;
}

interface FirestoreUser {
    uid: string;
    email: string;
    role: UserRole;
    status: 'active' | 'disabled';
}

interface PasswordResetForm {
    newPassword: string;
    confirmPassword: string;
}

export default function AdminPage() {
    const { userData, authStatus } = useAuth();
    const { handleProtectedNavigation } = useNavigation();
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        role: 'user'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [users, setUsers] = useState<FirestoreUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [passwordResetForm, setPasswordResetForm] = useState<PasswordResetForm>({
        newPassword: '',
        confirmPassword: ''
    });
    const [resettingPasswordFor, setResettingPasswordFor] = useState<string | null>(null);

    useEffect(() => {
        handleProtectedNavigation('/dashboard/admin');
        fetchUsers();
    }, [handleProtectedNavigation]);

    const fetchUsers = async () => {
        try {
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const usersList = usersSnapshot.docs.map(doc => ({
                ...doc.data(),
                uid: doc.id,
            })) as FirestoreUser[];
            setUsers(usersList);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Kullanıcılar yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (uid: string, newRole: UserRole) => {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, { role: newRole });
            setUsers(users.map(user => 
                user.uid === uid ? { ...user, role: newRole } : user
            ));
            setSuccess('Kullanıcı rolü başarıyla güncellendi.');
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user role:', error);
            setError('Kullanıcı rolü güncellenirken bir hata oluştu.');
        }
    };

    const handlePasswordReset = async (uid: string) => {
        try {
            // Şifre kontrolü
            if (passwordResetForm.newPassword !== passwordResetForm.confirmPassword) {
                throw new Error('Şifreler eşleşmiyor.');
            }

            if (passwordResetForm.newPassword.length < 6) {
                throw new Error('Şifre en az 6 karakter olmalıdır.');
            }

            // Kullanıcıyı bulalım
            const user = users.find(u => u.uid === uid);
            if (!user) {
                throw new Error('Kullanıcı bulunamadı.');
            }

            // Geçici auth nesnesi oluşturalım
            const tempAuth = getAuth();
            
            // Kullanıcıyı geçici olarak sisteme giriş yaptıralım
            const userCredential = await signInWithEmailAndPassword(tempAuth, user.email, passwordResetForm.newPassword);
            
            // Şifreyi güncelleyelim
            await updatePassword(userCredential.user, passwordResetForm.newPassword);

            // Firestore'da işlem kaydını tutalım
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                lastPasswordUpdate: new Date().toISOString()
            });

            setSuccess(`${user.email} kullanıcısının şifresi başarıyla güncellendi.`);
            setResettingPasswordFor(null);
            setPasswordResetForm({
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error: unknown) {
            console.error('Password reset error:', error);
            setError(error instanceof Error ? error.message : 'Şifre güncellenirken bir hata oluştu.');
        }
    };

    const handleUserStatus = async (uid: string) => {
        try {
            // Kullanıcıyı bulalım
            const user = users.find(u => u.uid === uid);
            if (!user) {
                throw new Error('Kullanıcı bulunamadı.');
            }

            // Kullanıcının durumunu güncelleyelim
            const userRef = doc(db, 'users', uid);
            const newStatus = user.status === 'active' ? 'disabled' : 'active';
            
            await updateDoc(userRef, {
                status: newStatus,
                lastStatusUpdate: new Date().toISOString()
            });

            // Kullanıcı listesini güncelleyelim
            setUsers(users.map(u => 
                u.uid === uid ? { ...u, status: newStatus } : u
            ));

            setSuccess(`${user.email} kullanıcısı ${newStatus === 'active' ? 'aktif' : 'devre dışı'} durumuna getirildi.`);
        } catch (error: unknown) {
            console.error('User status update error:', error);
            setError('Kullanıcı durumu güncellenirken bir hata oluştu.');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            // Mevcut admin kullanıcısının bilgilerini kaydet
            const adminUser = auth.currentUser;
            if (!adminUser) {
                throw new Error('Admin oturumu bulunamadı.');
            }

            // Yeni kullanıcıyı oluştur
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            console.log('User created in Auth:', userCredential.user.uid);

            try {
                // Firestore'da kullanıcı verilerini sakla
                const userData = {
                    uid: userCredential.user.uid,
                    email: formData.email,
                    role: formData.role,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    createdBy: adminUser.uid,
                    lastUpdated: new Date().toISOString()
                };

                // Önce admin kullanıcısını tekrar aktif et
                await auth.updateCurrentUser(adminUser);

                // Sonra Firestore'a yaz
                await setDoc(doc(db, 'users', userCredential.user.uid), userData);
                console.log('User data saved to Firestore successfully');

                setSuccess('Kullanıcı başarıyla oluşturuldu.');
                setFormData({
                    email: '',
                    password: '',
                    role: 'user'
                });
                
                // Kullanıcı listesini güncelle
                await fetchUsers();
            } catch (firestoreError) {
                console.error('Firestore write error:', firestoreError);
                // Firestore'a yazma başarısız olursa Auth'dan da silelim
                await deleteUser(userCredential.user);
                throw new Error('Kullanıcı verileri Firestore\'a kaydedilemedi.');
            }

        } catch (error: unknown) {
            console.error('Detailed error:', error);
            if (error instanceof FirebaseError) {
                if (error.code === 'auth/email-already-in-use') {
                    setError('Bu e-posta adresi zaten kullanımda.');
                } else if (error.code === 'auth/weak-password') {
                    setError('Şifre en az 6 karakter olmalıdır.');
                } else if (error.code === 'permission-denied') {
                    setError('Firestore yazma izni reddedildi. Lütfen yetkilendirmeyi kontrol edin.');
                } else {
                    setError(`Kullanıcı oluşturulurken bir hata oluştu: ${error.message}`);
                }
            } else if (error instanceof Error) {
                setError(`Bilinmeyen bir hata oluştu: ${error.message}`);
            } else {
                setError('Bilinmeyen bir hata oluştu.');
            }
        } finally {
            setIsSubmitting(false);
        }
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
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text mb-2">
                                    Admin Panel
                                </h1>
                                <p className="text-gray-600">
                                    Yeni istifadəçi əlavə edin və mövcud istifadəçiləri idarə edin
                                </p>
                            </motion.div>
                        </div>

                        {/* Kullanıcı Listesi */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-sm p-6 mb-6"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">İstifadəçi Siyahısı</h2>
                                {(error || success) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-3 rounded-lg text-sm ${
                                            error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                        }`}
                                    >
                                        {error || success}
                                    </motion.div>
                                )}
                            </div>
                            {isLoading ? (
                                <div className="flex justify-center py-4">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Rol
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user) => (
                                                <tr key={user.uid} className={user.status === 'disabled' ? 'bg-gray-50' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {user.email}
                                                        {user.status === 'disabled' && (
                                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Devre Dışı
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {editingUser === user.uid ? (
                                                            <select
                                                                value={user.role}
                                                                onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                                                                className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                                disabled={user.status === 'disabled'}
                                                            >
                                                                <option value="user">İstifadəçi</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                user.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        {resettingPasswordFor === user.uid ? (
                                                            <div className="flex items-center justify-end space-x-2">
                                                                <div className="flex flex-col space-y-2">
                                                                    <input
                                                                        type="password"
                                                                        placeholder="Yeni şifre"
                                                                        value={passwordResetForm.newPassword}
                                                                        onChange={(e) => setPasswordResetForm(prev => ({
                                                                            ...prev,
                                                                            newPassword: e.target.value
                                                                        }))}
                                                                        className="px-3 py-1 border rounded-md text-sm"
                                                                    />
                                                                    <input
                                                                        type="password"
                                                                        placeholder="Şifre tekrar"
                                                                        value={passwordResetForm.confirmPassword}
                                                                        onChange={(e) => setPasswordResetForm(prev => ({
                                                                            ...prev,
                                                                            confirmPassword: e.target.value
                                                                        }))}
                                                                        className="px-3 py-1 border rounded-md text-sm"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => handlePasswordReset(user.uid)}
                                                                    className="text-green-600 hover:text-green-900"
                                                                >
                                                                    Güncelle
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setResettingPasswordFor(null);
                                                                        setPasswordResetForm({
                                                                            newPassword: '',
                                                                            confirmPassword: ''
                                                                        });
                                                                    }}
                                                                    className="text-gray-600 hover:text-gray-900"
                                                                >
                                                                    İptal
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => setEditingUser(user.uid)}
                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                >
                                                                    Düzenle
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm(`${user.email} istifadəçisini ${user.status === 'active' ? 'deactiv etmək' : 'aktif etmək'} isdədiyinizdən əminsiniz?`)) {
                                                                            handleUserStatus(user.uid);
                                                                        }
                                                                    }}
                                                                    className={`ml-2 ${
                                                                        user.status === 'active' 
                                                                            ? 'text-red-600 hover:text-red-900' 
                                                                            : 'text-green-600 hover:text-green-900'
                                                                    }`}
                                                                >
                                                                    {user.status === 'active' ? 'Deactive et' : 'Aktif Et'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>

                        {/* Yeni Kullanıcı Formu */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl shadow-sm p-6"
                        >
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Yeni İstifadəçi əlavə et</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Şifrə
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                            İstifadəçi Rolu
                                        </label>
                                        <select
                                            id="role"
                                            value={formData.role}
                                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                                            className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                                            disabled={isSubmitting}
                                        >
                                            <option value="user">İstifadəçi</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-lg bg-red-50 text-red-600 text-sm"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-lg bg-green-50 text-green-600 text-sm"
                                    >
                                        {success}
                                    </motion.div>
                                )}

                                <div className="flex justify-end">
                                    <motion.button
                                        type="submit"
                                        disabled={isSubmitting}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-xl hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                Əməliyyat...
                                            </div>
                                        ) : (
                                            'İstifadəçi yarat'
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
} 