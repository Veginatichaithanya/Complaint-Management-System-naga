
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserComplaintStats {
  total_complaints: number;
  pending_complaints: number;
  accepted_complaints: number;
  resolved_complaints: number;
}

export function useUserComplaintStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserComplaintStats>({
    total_complaints: 0,
    pending_complaints: 0,
    accepted_complaints: 0,
    resolved_complaints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      
      // Set up real-time subscription for user stats
      const channel = supabase
        .channel('user-complaint-stats')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchUserStats();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchUserStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all complaints for the user
      const { data: complaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('status')
        .eq('user_id', user.id);

      if (complaintsError) throw complaintsError;

      // Calculate stats from complaints data
      const totalComplaints = complaints?.length || 0;
      const pendingComplaints = complaints?.filter(c => c.status === 'Pending').length || 0;
      const acceptedComplaints = complaints?.filter(c => c.status === 'Accepted').length || 0;
      const resolvedComplaints = complaints?.filter(c => c.status === 'Resolved').length || 0;

      setStats({
        total_complaints: totalComplaints,
        pending_complaints: pendingComplaints,
        accepted_complaints: acceptedComplaints,
        resolved_complaints: resolvedComplaints
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load complaint statistics');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchUserStats };
}
