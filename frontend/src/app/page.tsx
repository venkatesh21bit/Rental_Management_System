'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../components/pages/LandingPage';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their dashboard
      if (user.user_type === 'BUSINESS') {
        router.push('/end-user/dashboard');
      } else {
        router.push('/customer/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <LoadingSpinner />; // Show loading while redirecting
  }

  return <LandingPage />;
}
