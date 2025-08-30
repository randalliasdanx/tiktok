import React from 'react';
import ReactDOM from 'react-dom/client';
import './app/globals.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './root/App';
import History from '@/screens/History';
import { Landing } from '@/screens/Landing';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-gray-300">Loading…</div>;
  return user ? <>{children}</> : <Landing />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RequireAuth><App /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
