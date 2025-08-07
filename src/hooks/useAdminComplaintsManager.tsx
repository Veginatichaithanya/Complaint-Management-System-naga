import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ComplaintWithUser {
  complaint_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  attachment: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user: {
    full_name: string;
    employee_id: string;
    department: string;
    email?: string;
  };
}

export function useAdminComplaintsManager() {
  const [complaints, setComplaints] = useState<ComplaintWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComplaintsCount, setNewComplaintsCount] = useState(0);

  // Fetch complaints with user details for admin dashboard
  const fetchComplaints = async () => {
    try {
      console.log('Fetching complaints for admin dashboard...');
      
      // Get complaints with user details
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select(`
          complaint_id,
          title,
          description,
          category,
          priority,
          status,
          attachment,
          created_at,
          updated_at,
          user_id
        `)
        .in('status', ['Pending', 'Accepted', 'In Progress'])
        .order('created_at', { ascending: false });

      if (complaintsError) {
        throw complaintsError;
      }

      console.log('Fetched complaints data:', complaintsData?.length || 0);

      // Get user details for each complaint
      const complaintsWithUsers = await Promise.all(
        (complaintsData || []).map(async (complaint) => {
          // Try users table first
          let userData = null;
          const { data: userFromUsers } = await supabase
            .from('users')
            .select('full_name, employee_id, department')
            .eq('user_id', complaint.user_id)
            .maybeSingle();

          if (userFromUsers) {
            userData = userFromUsers;
          } else {
            // Fallback to profiles table
            const { data: userFromProfiles } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', complaint.user_id)
              .maybeSingle();

            if (userFromProfiles) {
              userData = {
                full_name: userFromProfiles.full_name || 'Unknown User',
                employee_id: 'N/A',
                department: 'N/A',
                email: userFromProfiles.email
              };
            }
          }

          return {
            ...complaint,
            priority: complaint.priority as 'low' | 'medium' | 'high' | 'urgent',
            user: userData || {
              full_name: 'Unknown User',
              employee_id: 'N/A',
              department: 'N/A'
            }
          };
        })
      );

      setComplaints(complaintsWithUsers);
      console.log('Set complaints with users:', complaintsWithUsers.length);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  // Update complaint status
  const updateComplaintStatus = async (complaintId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('complaint_id', complaintId);

      if (error) throw error;

      // Update local state
      setComplaints(prev => 
        prev.map(complaint => 
          complaint.complaint_id === complaintId 
            ? { ...complaint, status: newStatus, updated_at: new Date().toISOString() }
            : complaint
        )
      );

      toast.success(`Complaint status updated to ${newStatus}`);
      
      return true;
    } catch (error) {
      console.error('Error updating complaint status:', error);
      toast.error('Failed to update complaint status');
      return false;
    }
  };

  useEffect(() => {
    fetchComplaints();

    // Set up real-time subscription for complaints
    const complaintsChannel = supabase
      .channel('admin-complaints-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints',
        },
        (payload) => {
          console.log('New complaint received via realtime:', payload);
          fetchComplaints(); // Refetch to get user data
          setNewComplaintsCount(prev => prev + 1);
          
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
          console.log('Complaint updated via realtime:', payload);
          fetchComplaints(); // Refetch to get updated data
        }
      )
      .subscribe();

    return () => {
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
    updateComplaintStatus,
    refetch: fetchComplaints
  };
}