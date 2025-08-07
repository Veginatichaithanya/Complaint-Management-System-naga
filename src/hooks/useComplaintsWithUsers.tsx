
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ComplaintWithUserDetails {
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
  // User information from joined tables
  user_full_name: string | null;
  user_email: string | null;
  user_employee_id: string | null;
  user_department: string | null;
}

export function useComplaintsWithUsers() {
  const [complaints, setComplaints] = useState<ComplaintWithUserDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComplaintsCount, setNewComplaintsCount] = useState(0);

  // Fetch complaints with complete user information using proper joins
  const fetchComplaintsWithUsers = async () => {
    try {
      console.log('🔍 Fetching complaints with complete user data...');
      
      // Step 1: Get all complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select(`
          complaint_id,
          user_id,
          title,
          description,
          category,
          priority,
          status,
          attachment,
          created_at,
          updated_at,
          ai_resolved
        `)
        .order('created_at', { ascending: false });

      if (complaintsError) {
        console.error('❌ Error fetching complaints:', complaintsError);
        throw complaintsError;
      }

      if (!complaintsData || complaintsData.length === 0) {
        console.log('ℹ️ No complaints found in database');
        setComplaints([]);
        return;
      }

      console.log('📋 Found complaints:', complaintsData.length);

      // Step 2: For each complaint, get comprehensive user information
      const complaintsWithUserData = await Promise.all(
        complaintsData.map(async (complaint) => {
          let userInfo = {
            user_full_name: 'Unknown User',
            user_email: 'unknown@example.com',
            user_employee_id: 'N/A',
            user_department: 'N/A'
          };

          try {
            // Try to get from users table first (custom users table)
            const { data: customUserData } = await supabase
              .from('users')
              .select('full_name, employee_id, department')
              .eq('user_id', complaint.user_id)
              .maybeSingle();

            if (customUserData) {
              userInfo.user_full_name = customUserData.full_name || 'Unknown User';
              userInfo.user_employee_id = customUserData.employee_id || 'N/A';
              userInfo.user_department = customUserData.department || 'N/A';
              console.log('✅ Found user in custom users table:', customUserData);
            }

            // Then try to get email from profiles table (Supabase auth profiles)
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', complaint.user_id)
              .maybeSingle();

            if (profileData) {
              // Use profile data if we didn't get it from users table
              if (!customUserData?.full_name) {
                userInfo.user_full_name = profileData.full_name || 'Unknown User';
              }
              userInfo.user_email = profileData.email || 'unknown@example.com';
              console.log('✅ Found user in profiles table:', profileData);
            }

            // Log final user info for debugging
            console.log(`👤 User info for complaint ${complaint.complaint_id}:`, userInfo);

          } catch (userError) {
            console.error('❌ Error fetching user data for complaint:', complaint.complaint_id, userError);
          }

          return {
            ...complaint,
            priority: complaint.priority as 'low' | 'medium' | 'high' | 'urgent',
            ...userInfo
          };
        })
      );

      setComplaints(complaintsWithUserData);
      console.log('✅ Successfully loaded complaints with user data:', complaintsWithUserData.length);
      
    } catch (error) {
      console.error('❌ Error in fetchComplaintsWithUsers:', error);
      toast.error('Failed to load complaints with user details');
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

      toast.success(`✅ Complaint status updated to ${newStatus}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating complaint status:', error);
      toast.error('Failed to update complaint status');
      return false;
    }
  };

  // Initialize and set up real-time subscriptions
  useEffect(() => {
    fetchComplaintsWithUsers();

    // Set up real-time subscription for new complaints
    const complaintsChannel = supabase
      .channel('admin-complaints-with-users-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints',
        },
        (payload) => {
          console.log('🔔 New complaint received via realtime:', payload);
          fetchComplaintsWithUsers(); // Refetch to get complete user data
          setNewComplaintsCount(prev => prev + 1);
          
          const newComplaint = payload.new as any;
          toast.info('🚨 New Complaint Received!', {
            description: `"${newComplaint.title}" - Priority: ${newComplaint.priority}`,
            duration: 8000,
            action: {
              label: 'View Dashboard',
              onClick: () => window.location.href = '/admin#complaints'
            }
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
          fetchComplaintsWithUsers(); // Refetch to ensure data consistency
          
          const updatedComplaint = payload.new as any;
          toast.info('📝 Complaint Updated', {
            description: `"${updatedComplaint.title}" status: ${updatedComplaint.status}`,
            duration: 4000,
          });
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
    refetch: fetchComplaintsWithUsers
  };
}
