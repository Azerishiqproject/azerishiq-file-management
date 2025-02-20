'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

interface NavigationContextType {
    navigateTo: (path: string) => void;
    isProtectedRoute: (path: string) => boolean;
    handleProtectedNavigation: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Protected routes configuration
const PROTECTED_ROUTES = {
    DASHBOARD: '/dashboard',
    UPLOAD: '/dashboard/upload',
    ADMIN: '/dashboard/admin',
} as const;

const PUBLIC_ROUTES = {
    LOGIN: '/login',
    HOME: '/',
} as const;

export function NavigationProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { authStatus, userData } = useAuth();

    const isProtectedRoute = (path: string): boolean => {
        return path.startsWith(PROTECTED_ROUTES.DASHBOARD);
    };

    const isAdminRoute = (path: string): boolean => {
        return path.startsWith(PROTECTED_ROUTES.ADMIN);
    };

    const isUploadRoute = (path: string): boolean => {
        return path.startsWith(PROTECTED_ROUTES.UPLOAD);
    };

    const canAccessRoute = (path: string): boolean => {
        if (!isProtectedRoute(path)) return true;
        if (authStatus !== 'authenticated') return false;
        if (isAdminRoute(path) && userData?.role !== 'admin') return false;
        if (isUploadRoute(path) && userData?.role !== 'admin') return false;
        return true;
    };

    const navigateTo = (path: string) => {
        console.log('Navigating to:', path);
        
        // Prevent navigation to login if already authenticated
        if (path === PUBLIC_ROUTES.LOGIN && authStatus === 'authenticated') {
            router.replace(PROTECTED_ROUTES.DASHBOARD);
            return;
        }

        // Handle protected route navigation
        if (isProtectedRoute(path)) {
            if (authStatus === 'authenticated') {
                if (canAccessRoute(path)) {
                    router.push(path);
                } else {
                    console.log('Access denied to:', path);
                    router.replace(PROTECTED_ROUTES.DASHBOARD);
                }
            } else {
                console.log('Redirecting to login');
                const loginPath = `${PUBLIC_ROUTES.LOGIN}?callbackUrl=${encodeURIComponent(path)}`;
                router.replace(loginPath);
            }
            return;
        }

        // Default navigation
        router.push(path);
    };

    const handleProtectedNavigation = (path: string) => {
        if (authStatus === 'loading') {
            console.log('Auth loading, waiting...');
            return;
        }

        if (!canAccessRoute(path)) {
            console.log('Cannot access route:', path);
            if (authStatus === 'authenticated') {
                router.replace(PROTECTED_ROUTES.DASHBOARD);
            } else {
                router.replace(PUBLIC_ROUTES.LOGIN);
            }
            return;
        }

        // Handle current path protection
        if (pathname === PUBLIC_ROUTES.LOGIN && authStatus === 'authenticated') {
            const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
            if (callbackUrl && canAccessRoute(callbackUrl)) {
                router.replace(callbackUrl);
            } else {
                router.replace(PROTECTED_ROUTES.DASHBOARD);
            }
        }
    };

    const value = {
        navigateTo,
        isProtectedRoute,
        handleProtectedNavigation,
    };

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
} 