
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthCard } from '@/components/AuthCard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserAuth() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard/user');
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen relative">
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <Button
          onClick={handleBack}
          variant="ghost"
          className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      
      <AuthCard onSuccess={handleSuccess} />
    </div>
  );
}
