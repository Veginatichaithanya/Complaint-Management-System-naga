
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ComplaintWithUser {
  complaint_id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  attachment: string | null;
  created_at: string;
  updated_at: string;
  ai_resolved: boolean;
  // User details from the optimized view
  user_full_name: string | null;
  user_employee_id: string | null;
  user_department: string | null;
  user_email: string | null;
  profile_full_name: string | null;
}

export function useRealTimeComplaintSync() {
  const [complaints, setComplaints] = useState<ComplaintWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch complaints using the optimized admin view
  const fetchComplaints = async () => {
    try {
      console.log('🔍 Fetching complaints from admin_complaints_with_users view...');
      
      const { data, error } = await supabase
        .from('admin_complaints_with_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching complaints:', error);
        throw error;
      }

      console.log('✅ Fetched complaints:', data?.length || 0);
      
      // Transform data to match our interface, ensuring priority is typed correctly
      const transformedData: ComplaintWithUser[] = (data || []).map(item => ({
        ...item,
        priority: item.priority as 'low' | 'medium' | 'high' | 'urgent'
      }));
      
      setComplaints(transformedData);
      
      // Update pending count
      const pending = transformedData.filter(c => c.status === 'Pending').length;
      setPendingCount(pending);
      
    } catch (error) {
      console.error('❌ Error in fetchComplaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  // Update complaint status using the database function
  const updateComplaintStatus = async (complaintId: string, newStatus: string) => {
    try {
      console.log(`🔄 Updating complaint ${complaintId} to status: ${newStatus}`);
      
      const { data, error } = await supabase
        .rpc('update_complaint_status', {
          target_complaint_id: complaintId,
          new_status: newStatus
        });

      if (error) throw error;

      if (data) {
        toast.success(`✅ Complaint status updated to ${newStatus}`);
        // The real-time subscription will handle the UI update
        return true;
      } else {
        toast.error('Failed to update complaint status');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating complaint status:', error);
      toast.error('Failed to update complaint status');
      return false;
    }
  };

  // Get pending complaints count using the database function
  const fetchPendingCount = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_pending_complaints_count');

      if (error) throw error;
      setPendingCount(data || 0);
    } catch (error) {
      console.error('❌ Error fetching pending count:', error);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchComplaints();
    fetchPendingCount();

    // Set up real-time subscription for complaints
    console.log('🔔 Setting up real-time subscription for complaints...');
    const complaintsChannel = supabase
      .channel('complaints-realtime-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints',
        },
        (payload) => {
          console.log('🚨 New complaint received:', payload);
          
          // Refresh data to get complete user information
          fetchComplaints();
          fetchPendingCount();
          
          const newComplaint = payload.new as any;
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
          console.log('📝 Complaint updated:', payload);
          
          // Refresh data to ensure consistency
          fetchComplaints();
          fetchPendingCount();
          
          const updatedComplaint = payload.new as any;
          toast.info('📝 Complaint Updated', {
            description: `"${updatedComplaint.title}" status: ${updatedComplaint.status}`,
            duration: 4000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'complaints',
        },
        () => {
          console.log('🗑️ Complaint deleted');
          fetchComplaints();
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(complaintsChannel);
    };
  }, []);

  return {
    complaints,
    loading,
    pendingCount,
    updateComplaintStatus,
    refreshData: fetchComplaints
  };
}
