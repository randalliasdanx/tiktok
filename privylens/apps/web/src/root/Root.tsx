'use client';
import React from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { App } from './App';
import { Landing } from '../screens/Landing';

export function Root() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#1b1b1b] text-gray-300">
        <div className="animate-pulse text-center">
          <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-[#10a37f]" />
          <div>Loading…</div>
        </div>
      </div>
    );
  }
  return user ? <App /> : <Landing />;
}
