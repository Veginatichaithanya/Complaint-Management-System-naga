
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function useAcceptComplaint() {
  const [accepting, setAccepting] = useState<string | null>(null);
  const { user } = useAuth();

  const acceptComplaint = async (complaintId: string) => {
    try {
      setAccepting(complaintId);
      console.log('🔄 Accepting complaint:', complaintId);
      console.log('🔄 Admin user ID:', user?.id);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // First ensure admin permissions
      const { error: permissionError } = await supabase
        .rpc('ensure_admin_permissions', {
          target_user_id: user.id
        });

      if (permissionError) {
        console.warn('⚠️ Permission setup warning:', permissionError.message);
      }

      // First check if complaint exists and is still pending
      const { data: complaintCheck, error: checkError } = await supabase
        .from('complaints')
        .select('status')
        .eq('complaint_id', complaintId)
        .single();

      if (checkError) {
        console.error('❌ Error checking complaint:', checkError);
        throw new Error('Complaint not found');
      }

      if (complaintCheck.status !== 'Pending') {
        throw new Error(`Complaint is already ${complaintCheck.status.toLowerCase()}`);
      }

      // Use the RPC function to accept complaint
      const { data, error } = await supabase
        .rpc('accept_complaint', {
          complaint_id_param: complaintId,
          admin_user_id: user.id
        });

      if (error) {
        console.error('❌ RPC Error accepting complaint:', error);
        throw new Error(error.message || 'Failed to accept complaint');
      }

      console.log('✅ Accept complaint RPC result:', data);

      if (data === true) {
        toast.success('✅ Complaint accepted successfully');
        console.log('✅ Complaint accepted:', complaintId);
        return true;
      } else {
        console.error('❌ RPC function returned:', data);
        throw new Error('Failed to accept complaint - unexpected response');
      }
    } catch (error: any) {
      console.error('❌ Error in acceptComplaint:', error);
      
      if (error.message?.includes('already accepted') || error.message?.includes('already processed')) {
        toast.error('This complaint has already been accepted by another admin');
      } else if (error.message?.includes('not found')) {
        toast.error('This complaint no longer exists');
      } else if (error.message?.includes('Pending')) {
        toast.error('This complaint is no longer pending');
      } else if (error.message?.includes('authenticated')) {
        toast.error('Please log in to accept complaints');
      } else {
        toast.error(`Failed to accept complaint: ${error.message}`);
      }
      
      return false;
    } finally {
      setAccepting(null);
    }
  };

  return {
    acceptComplaint,
    accepting
  };
}
