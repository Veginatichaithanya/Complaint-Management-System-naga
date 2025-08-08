
import React from 'react';
import { Navigate } from 'react-router-dom';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { useAuth } from '@/hooks/useAuth';

export default function Admin() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/user-auth" replace />;
  }

  // Check if user is admin
  if (user.email !== 'admin@gmail.com') {
    return <Navigate to="/" replace />;
  }

  return <AdminPanel />;
}
