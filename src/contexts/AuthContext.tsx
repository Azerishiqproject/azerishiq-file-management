'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    User,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    getAuth,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type UserRole = 'admin' | 'user';

interface UserData {
    uid: string;
    email: string | null;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    authStatus: AuthStatus;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
    const pathname = usePathname();
    const router = useRouter();

    // Firebase persistence ayarı ve token yenileme
    useEffect(() => {
        const initAuth = async () => {
            await setPersistence(auth, browserLocalPersistence);
            
            if (auth.currentUser) {
                try {
                    const token = await auth.currentUser.getIdToken(true);
                    Cookies.set('__session', token, { expires: 14 });
                } catch (error) {
                    console.error('Token refresh error:', error);
                    Cookies.remove('__session');
                }
            }
        };
        
        initAuth().catch(console.error);

        // Token yenileme için interval
        const tokenRefreshInterval = setInterval(async () => {
            if (auth.currentUser) {
                try {
                    const token = await auth.currentUser.getIdToken(true);
                    Cookies.set('__session', token, { expires: 14 });
                } catch (error) {
                    console.error('Token refresh error:', error);
                }
            }
        }, 10 * 60 * 1000); // Her 10 dakikada bir

        return () => clearInterval(tokenRefreshInterval);
    }, []);

    // Firestore'dan kullanıcı verilerini al
    const getUserData = async (user: User) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data() as UserData;
            } else {
                const newUserData: UserData = {
                    uid: user.uid,
                    email: user.email,
                    role: 'user'
                };
                await setDoc(userRef, newUserData);
                return newUserData;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    };

    // Auth state değişikliklerini izle
    useEffect(() => {
        let isSubscribed = true;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user?.email);
            
            if (!isSubscribed) return;

            if (user) {
                try {
                    // Kullanıcı durumunu kontrol et
                    const userRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userRef);
                    const userData = userDoc.data();

                    if (userData?.status === 'disabled') {
                        // Devre dışı kullanıcıyı çıkış yaptır
                        await signOut(auth);
                        setUser(null);
                        setUserData(null);
                        setAuthStatus('unauthenticated');
                        Cookies.remove('__session');
                        return;
                    }

                    const token = await user.getIdToken(true);
                    Cookies.set('__session', token, { expires: 14 });
                    
                    setUser(user);
                    setUserData(userData as UserData);
                    setAuthStatus('authenticated');
                } catch (error) {
                    console.error('Error setting user data:', error);
                    setAuthStatus('unauthenticated');
                    Cookies.remove('__session');
                }
            } else {
                setUser(null);
                setUserData(null);
                setAuthStatus('unauthenticated');
                Cookies.remove('__session');
            }
        });

        return () => {
            isSubscribed = false;
            unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setAuthStatus('loading');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful:', userCredential.user.email);
            
            // Kullanıcı durumunu Firestore'dan kontrol et
            const userRef = doc(db, 'users', userCredential.user.uid);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();

            if (userData?.status === 'disabled') {
                // Eğer kullanıcı devre dışı ise, oturumu kapat ve hata fırlat
                await signOut(auth);
                setAuthStatus('unauthenticated');
                Cookies.remove('__session');
                throw new Error('Bu hesap devre dışı bırakılmış.');
            }
            
            const token = await userCredential.user.getIdToken(true);
            Cookies.set('__session', token, { expires: 14 });
            
            if (userData) {
                setUser(userCredential.user);
                setUserData(userData as UserData);
                setAuthStatus('authenticated');
                router.replace('/dashboard');
            } else {
                throw new Error('Kullanıcı verileri alınamadı.');
            }
        } catch (error: any) {
            setAuthStatus('unauthenticated');
            Cookies.remove('__session');
            
            // Firebase hata kodlarını kontrol et
            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                    throw new Error('E-posta veya şifre hatalı.');
                case 'auth/invalid-email':
                    throw new Error('Geçersiz e-posta adresi.');
                case 'auth/user-disabled':
                    throw new Error('Bu hesap devre dışı bırakılmış.');
                case 'auth/too-many-requests':
                    throw new Error('Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.');
                case 'auth/network-request-failed':
                    throw new Error('Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.');
                default:
                    if (error.message) {
                        throw error;
                    }
                    console.error("Login error:", error);
                    throw new Error('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
            }
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserData(null);
            setAuthStatus('unauthenticated');
            Cookies.remove('__session');
        } catch (error: any) {
            console.error("Logout error:", error);
            throw new Error('Çıkış yapılırken bir hata oluştu.');
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, authStatus, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 