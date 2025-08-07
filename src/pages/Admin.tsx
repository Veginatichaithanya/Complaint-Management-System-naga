
import React from 'react';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="bg-white border border-gray-200 shadow-lg max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need to be logged in to access the admin panel.</p>
            <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              Go to Login
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is admin
  if (user.email !== 'admin@gmail.com') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="bg-white border border-gray-200 shadow-lg max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have admin privileges.</p>
            <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              Go to Home
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminPanel />;
}
