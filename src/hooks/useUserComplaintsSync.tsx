
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserComplaint {
  complaint_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  attachment: string | null;
  created_at: string;
  updated_at: string;
  ai_resolved: boolean;
}

export function useUserComplaintsSync() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's complaints using the database function
  const fetchUserComplaints = async () => {
    if (!user) return;

    try {
      console.log('🔍 Fetching user complaints for:', user.id);
      
      const { data, error } = await supabase
        .rpc('get_user_complaints', {
          target_user_id: user.id
        });

      if (error) {
        console.error('❌ Error fetching user complaints:', error);
        throw error;
      }

      console.log('✅ Fetched user complaints:', data?.length || 0);
      setComplaints(data || []);
      
    } catch (error) {
      console.error('❌ Error in fetchUserComplaints:', error);
      toast.error('Failed to load your complaints');
    } finally {
      setLoading(false);
    }
  };

  // Delete complaint (only if status is Pending)
  const deleteComplaint = async (complaintId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('complaint_id', complaintId)
        .eq('user_id', user.id)
        .eq('status', 'Pending');

      if (error) throw error;

      toast.success('✅ Complaint deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
      return false;
    }
  };

  // Update complaint (only if status is Pending or Accepted)
  const updateComplaint = async (complaintId: string, updates: Partial<UserComplaint>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('complaint_id', complaintId)
        .eq('user_id', user.id)
        .in('status', ['Pending', 'Accepted']);

      if (error) throw error;

      toast.success('✅ Complaint updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating complaint:', error);
      toast.error('Failed to update complaint');
      return false;
    }
  };

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchUserComplaints();

    // Set up real-time subscription for user's complaints
    console.log('🔔 Setting up real-time subscription for user complaints...');
    const userComplaintsChannel = supabase
      .channel('user-complaints-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 User complaint updated:', payload);
          fetchUserComplaints(); // Refresh user's complaints
          
          if (payload.eventType === 'UPDATE') {
            toast.success('📝 Your complaint has been updated', {
              description: 'Check the latest status in your tickets'
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up user complaints subscription');
      supabase.removeChannel(userComplaintsChannel);
    };
  }, [user]);

  return {
    complaints,
    loading,
    deleteComplaint,
    updateComplaint,
    refreshData: fetchUserComplaints
  };
}
