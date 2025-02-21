import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from '@/components/ClientLayout';
import Providers from '@/components/Providers';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NavigationProvider>
            <Providers>
              <ClientLayout>
                {children}
              </ClientLayout>
            </Providers>
            <Toaster position="top-right" />
          </NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
