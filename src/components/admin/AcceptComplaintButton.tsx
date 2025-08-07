
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAcceptComplaint } from '@/hooks/useAcceptComplaint';

interface AcceptComplaintButtonProps {
  complaintId: string;
  status: string;
  onAccepted?: () => void;
}

export function AcceptComplaintButton({ 
  complaintId, 
  status, 
  onAccepted 
}: AcceptComplaintButtonProps) {
  const { acceptComplaint, accepting } = useAcceptComplaint();

  const handleAccept = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔄 Accept button clicked for complaint:', complaintId, 'Status:', status);
    
    if (status !== 'Pending') {
      console.log('⚠️ Complaint is not pending, current status:', status);
      return;
    }

    const success = await acceptComplaint(complaintId);
    if (success && onAccepted) {
      console.log('✅ Complaint accepted, refreshing data...');
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        onAccepted();
      }, 500);
    }
  };

  // Don't show button if already accepted or processed
  if (status !== 'Pending') {
    return null;
  }

  const isAccepting = accepting === complaintId;

  return (
    <Button
      onClick={handleAccept}
      disabled={isAccepting || status !== 'Pending'}
      size="sm"
      className="bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
    >
      {isAccepting ? (
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          Accepting...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-1" />
          Accept
        </>
      )}
    </Button>
  );
}
