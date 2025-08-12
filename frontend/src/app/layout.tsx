import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ToasterProvider } from '../components/providers/ToasterProvider';
import { QueryProvider } from '../components/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rental Management System',
  description: 'Professional rental management platform for businesses and customers',
  keywords: 'rental, management, equipment, booking, reservation',
  authors: [{ name: 'Rental Management Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
        <QueryProvider>
          <AuthProvider>
            <ToasterProvider />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
