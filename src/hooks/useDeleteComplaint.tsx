
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function useDeleteComplaint() {
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user } = useAuth();

  const deleteComplaint = async (complaintId: string) => {
    try {
      setDeleting(complaintId);
      console.log('🗑️ Deleting complaint:', complaintId);
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

      // Use the RPC function to delete complaint permanently
      const { data, error } = await supabase
        .rpc('delete_complaint_permanently', {
          complaint_id_param: complaintId,
          admin_user_id: user.id
        });

      if (error) {
        console.error('❌ Error deleting complaint:', error);
        throw error;
      }

      if (data) {
        toast.success('✅ Complaint deleted permanently');
        console.log('✅ Complaint deleted:', complaintId);
        return true;
      } else {
        toast.error('Failed to delete complaint - unexpected error occurred');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error in deleteComplaint:', error);
      
      // Provide more specific error messages based on error details
      if (error.message?.includes('Insufficient permissions')) {
        toast.error('You do not have permission to delete complaints');
      } else if (error.message?.includes('Complaint not found')) {
        toast.error('This complaint no longer exists');
      } else if (error.message?.includes('authenticated')) {
        toast.error('Please log in to delete complaints');
      } else if (error.code === '23503') {
        toast.error('Cannot delete complaint due to database constraints');
      } else if (error.code === '42883') {
        toast.error('Database function error. Please contact system administrator.');
      } else {
        toast.error('Failed to delete complaint. Please refresh and try again.');
      }
      
      return false;
    } finally {
      setDeleting(null);
    }
  };

  return {
    deleteComplaint,
    deleting
  };
}
