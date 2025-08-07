
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RealTimeComplaint {
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

export function useRealTimeAdminDashboard() {
  const [complaints, setComplaints] = useState<RealTimeComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComplaintsCount, setNewComplaintsCount] = useState(0);

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
      
      // Transform data to match our interface
      const transformedData: RealTimeComplaint[] = (data || []).map(item => ({
        ...item,
        priority: item.priority as 'low' | 'medium' | 'high' | 'urgent'
      }));
      
      setComplaints(transformedData);
      
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
        // Refresh data to ensure consistency
        await fetchComplaints();
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

  // Reset new complaints counter
  const resetNewComplaintsCount = () => {
    setNewComplaintsCount(0);
  };

  useEffect(() => {
    // Initial data fetch
    fetchComplaints();

    // Set up real-time subscription for complaints
    console.log('🔔 Setting up real-time subscription for complaints...');
    const complaintsChannel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints',
        },
        (payload) => {
          console.log('🚨 New complaint received:', payload);
          
          // Increment new complaints counter
          setNewComplaintsCount(prev => prev + 1);
          
          // Refresh data to get complete user information
          fetchComplaints();
          
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
          
          const updatedComplaint = payload.new as any;
          toast.info('📝 Complaint Updated', {
            description: `"${updatedComplaint.title}" status: ${updatedComplaint.status}`,
            duration: 4000,
          });
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
    newComplaintsCount,
    resetNewComplaintsCount,
    updateComplaintStatus,
    refetch: fetchComplaints
  };
}
