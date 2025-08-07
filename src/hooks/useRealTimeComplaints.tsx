
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Complaint = {
  complaint_id: string;
  user_id: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  attachment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function useRealTimeComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComplaintsCount, setNewComplaintsCount] = useState(0);

  // Fetch initial complaints with better error handling
  const fetchComplaints = async () => {
    try {
      console.log('🔍 Fetching complaints from database...');
      
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          complaint_id,
          user_id,
          title,
          category,
          priority,
          description,
          attachment,
          status,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('📋 Raw complaints data:', data);
      setComplaints(data || []);
      console.log('✅ Successfully fetched complaints:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    // Set up real-time subscription for new complaints
    console.log('🔔 Setting up real-time subscription...');
    const complaintsChannel = supabase
      .channel('complaints-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints',
        },
        (payload) => {
          console.log('🚨 New complaint received via realtime:', payload);
          
          const newComplaint = payload.new as Complaint;
          
          // Add new complaint to the list
          setComplaints(prev => [newComplaint, ...prev]);
          
          // Increment new complaints counter
          setNewComplaintsCount(prev => prev + 1);
          
          // Show real-time notification
          toast.info('🚨 New Complaint Received!', {
            description: `"${newComplaint.title}" - Priority: ${newComplaint.priority}`,
            duration: 6000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
        },
        (payload) => {
          console.log('📝 Complaint updated via realtime:', payload);
          
          const updatedComplaint = payload.new as Complaint;
          
          // Update existing complaint in the list
          setComplaints(prev => 
            prev.map(complaint => 
              complaint.complaint_id === updatedComplaint.complaint_id ? updatedComplaint : complaint
            )
          );
          
          // Show update notification
          toast.info('📝 Complaint Updated', {
            description: `"${updatedComplaint.title}" status: ${updatedComplaint.status}`,
            duration: 4000,
          });
        }
      )
      .subscribe();

    console.log('✅ Real-time subscription established');

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(complaintsChannel);
    };
  }, []);

  // Reset new complaints counter
  const resetNewComplaintsCount = () => {
    setNewComplaintsCount(0);
  };

  return {
    complaints,
    loading,
    newComplaintsCount,
    resetNewComplaintsCount,
    refetch: fetchComplaints
  };
}
