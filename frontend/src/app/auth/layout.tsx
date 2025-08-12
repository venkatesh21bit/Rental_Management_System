import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Rental Management System',
  description: 'Sign in or create an account to access the rental management platform',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
