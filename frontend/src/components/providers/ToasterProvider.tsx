'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        success: {
          style: {
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#ecfdf5',
          },
        },
        error: {
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fef2f2',
          },
        },
        loading: {
          style: {
            background: '#f0f9ff',
            color: '#1e40af',
            border: '1px solid #bfdbfe',
          },
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#f0f9ff',
          },
        },
      }}
    />
  );
}
