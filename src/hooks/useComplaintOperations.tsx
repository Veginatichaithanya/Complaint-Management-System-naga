
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ComplaintData {
  title: string;
  category: string;
  priority: string;
  description: string;
  attachment?: string;
}

export function useComplaintOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const updateComplaint = async (complaintId: string, complaintData: ComplaintData) => {
    if (!user) {
      toast.error('You must be logged in to update complaints');
      return null;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('complaints')
        .update({
          ...complaintData,
          updated_at: new Date().toISOString()
        })
        .eq('complaint_id', complaintId)
        .eq('user_id', user.id)
        .in('status', ['Pending', 'Accepted'])
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Complaint not found or cannot be edited');
      }

      toast.success('Complaint updated successfully!', {
        description: `Your complaint "${data.title}" has been updated`,
      });

      return data;
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      toast.error('Failed to update complaint', {
        description: error.message || 'Please try again later'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComplaint = async (complaintId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete complaints');
      return false;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('complaint_id', complaintId)
        .eq('user_id', user.id)
        .eq('status', 'Pending');

      if (error) throw error;

      toast.success('Complaint deleted successfully!', {
        description: 'Your complaint has been removed from the system',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint', {
        description: error.message || 'Only pending complaints can be deleted'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = (status: string) => {
    return ['Pending', 'Accepted'].includes(status);
  };

  const canDelete = (status: string) => {
    return status === 'Pending';
  };

  return {
    updateComplaint,
    deleteComplaint,
    canEdit,
    canDelete,
    isLoading
  };
}
