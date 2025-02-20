'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <NavigationProvider>
                {children}
            </NavigationProvider>
        </AuthProvider>
    );
} 