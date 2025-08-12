'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Header from '../../components/navigation/Header';
import Sidebar from '../../components/navigation/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EndUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user && user.user_type !== 'BUSINESS') {
      router.push('/customer/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || user.user_type !== 'BUSINESS') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant="end-user" />
      <div className="flex">
        <Sidebar variant="end-user" />
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
