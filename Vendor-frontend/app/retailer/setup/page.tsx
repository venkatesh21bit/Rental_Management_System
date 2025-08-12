"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Profile setup is no longer required - redirect to dashboard
const RetailerSetup = () => {
  const router = useRouter();

  useEffect(() => {
    // Immediate redirect to dashboard since profile setup is not needed
    router.replace('/retailer/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-white">Redirecting to dashboard...</div>
    </div>
  );
};

export default RetailerSetup;
