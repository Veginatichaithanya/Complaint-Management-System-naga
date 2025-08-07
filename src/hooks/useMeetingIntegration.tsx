import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface MeetingSchedule {
  meeting_id: string;
  complaint_id: string | null;
  admin_id: string | null;
  invited_user_id: string | null;
  title: string | null;
  description: string | null;
  schedule_time: string;
  meet_link: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  complaint: {
    title: string;
    user_id: string;
  } | null;
  user: {
    full_name: string;
    employee_id?: string;
    email?: string;
  };
}

export function useMeetingIntegration() {
  const [meetings, setMeetings] = useState<MeetingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch meetings with user and complaint details
  const fetchMeetings = async () => {
    try {
      console.log('📅 Fetching meeting schedules...');

      const { data: meetingsData, error } = await supabase
        .from('meetings')
        .select(`
          meeting_id,
          complaint_id,
          admin_id,
          invited_user_id,
          title,
          description,
          schedule_time,
          meet_link,
          status,
          created_at
        `)
        .order('schedule_time', { ascending: false });

      if (error) throw error;

      // Get complaint and user data for each meeting
      const meetingsWithDetails = await Promise.all(
        (meetingsData || []).map(async (meeting) => {
          let complaintData = null;
          let userData = { 
            full_name: 'Admin User', 
            employee_id: 'ADMIN',
            email: 'admin@company.com'
          };

          // Get complaint data if complaint_id exists
          if (meeting.complaint_id) {
            const { data: complaint } = await supabase
              .from('complaints')
              .select('title, user_id')
              .eq('complaint_id', meeting.complaint_id)
              .maybeSingle();
            
            complaintData = complaint;
          }

          // Get invited user data if invited_user_id exists
          if (meeting.invited_user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', meeting.invited_user_id)
              .maybeSingle();

            if (profileData) {
              userData.full_name = profileData.full_name || 'Unknown User';
              userData.email = profileData.email || 'unknown@example.com';
            }

            const { data: userTableData } = await supabase
              .from('users')
              .select('full_name, employee_id')
              .eq('user_id', meeting.invited_user_id)
              .maybeSingle();

            if (userTableData) {
              userData.full_name = userTableData.full_name || userData.full_name;
              userData.employee_id = userTableData.employee_id || 'N/A';
            }
          }

          return {
            ...meeting,
            status: meeting.status as 'scheduled' | 'completed' | 'cancelled',
            complaint: complaintData,
            user: userData
          };
        })
      );

      setMeetings(meetingsWithDetails);
      console.log('✅ Meetings loaded:', meetingsWithDetails.length);
    } catch (error) {
      console.error('❌ Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    }
  };

  // Schedule a new meeting with proper validation
  const scheduleMeeting = async (meetingData: {
    complaint_id?: string;
    invited_user_id: string;
    title: string;
    description?: string;
    schedule_time: string;
    meet_link: string;
    admin_id?: string;
  }) => {
    try {
      console.log('📅 Starting meeting scheduling process...');
      console.log('📅 Meeting data received:', meetingData);

      // Step 1: Validate required fields
      if (!meetingData.invited_user_id) {
        throw new Error('Invited user ID is required');
      }
      if (!meetingData.title || meetingData.title.trim() === '') {
        throw new Error('Meeting title is required');
      }
      if (!meetingData.schedule_time) {
        throw new Error('Schedule time is required');
      }
      if (!meetingData.meet_link || meetingData.meet_link.trim() === '') {
        throw new Error('Meet link is required');
      }

      // Step 2: Verify the invited user exists in profiles
      console.log('🔍 Verifying invited user exists:', meetingData.invited_user_id);
      const { data: userExists, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', meetingData.invited_user_id)
        .maybeSingle();

      if (userCheckError) {
        console.error('❌ Error checking user existence:', userCheckError);
        throw new Error('Error validating user: ' + userCheckError.message);
      }

      if (!userExists) {
        throw new Error('Invited user does not exist in the system');
      }

      console.log('✅ User exists:', userExists);

      // Step 3: If complaint_id is provided, verify it exists and belongs to the user
      let validatedComplaintId: string | null = null;
      if (meetingData.complaint_id) {
        console.log('🔍 Verifying complaint exists:', meetingData.complaint_id);
        const { data: complaintData, error: complaintError } = await supabase
          .from('complaints')
          .select('complaint_id, user_id, title')
          .eq('complaint_id', meetingData.complaint_id)
          .maybeSingle();

        if (complaintError) {
          console.error('❌ Error checking complaint:', complaintError);
          throw new Error('Error validating complaint: ' + complaintError.message);
        }

        if (!complaintData) {
          console.warn('⚠️ Complaint not found, proceeding without complaint association');
        } else if (complaintData.user_id !== meetingData.invited_user_id) {
          throw new Error('Complaint does not belong to the invited user');
        } else {
          validatedComplaintId = complaintData.complaint_id;
          console.log('✅ Complaint validated:', complaintData);
        }
      }

      // Step 4: Get current admin user ID
      const currentUserId = user?.id || meetingData.admin_id;
      if (!currentUserId) {
        throw new Error('Admin user ID is required');
      }

      console.log('👤 Admin user ID:', currentUserId);

      // Step 5: Ensure admin user exists in admin_users table
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (adminError) {
        console.error('❌ Error checking admin user:', adminError);
      }

      if (!adminUser) {
        console.log('⚙️ Creating admin user record...');
        const { error: insertAdminError } = await supabase
          .from('admin_users')
          .insert({ user_id: currentUserId, role: 'admin' });

        if (insertAdminError) {
          console.error('❌ Error creating admin user:', insertAdminError);
          // Continue anyway, as this might not be critical
        }
      }

      // Step 6: Create meeting record with validated data
      const meetingInsertData = {
        complaint_id: validatedComplaintId,
        admin_id: currentUserId,
        invited_user_id: meetingData.invited_user_id,
        title: meetingData.title.trim(),
        description: meetingData.description?.trim() || null,
        schedule_time: meetingData.schedule_time,
        meet_link: meetingData.meet_link.trim(),
        status: 'scheduled' as const
      };

      console.log('📅 Inserting meeting record:', meetingInsertData);

      const { data: meetingRecord, error: meetingError } = await supabase
        .from('meetings')
        .insert(meetingInsertData)
        .select()
        .single();

      if (meetingError) {
        console.error('❌ Database error creating meeting:', meetingError);
        throw new Error(`Failed to create meeting: ${meetingError.message}`);
      }

      if (!meetingRecord) {
        throw new Error('Meeting record was not created successfully');
      }

      console.log('✅ Meeting created successfully:', meetingRecord);

      // Step 7: Send notification to invited user
      try {
        const notificationMessage = validatedComplaintId 
          ? `A Google Meet has been scheduled for your complaint "${meetingData.title}" on ${new Date(meetingData.schedule_time).toLocaleString()}.`
          : `You have been invited to a Google Meet: "${meetingData.title}" on ${new Date(meetingData.schedule_time).toLocaleString()}.`;

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: meetingData.invited_user_id,
            title: 'Google Meet Scheduled',
            message: notificationMessage,
            type: 'meeting_scheduled',
            metadata: {
              meeting_id: meetingRecord.meeting_id,
              meet_link: meetingData.meet_link,
              schedule_time: meetingData.schedule_time,
              complaint_id: validatedComplaintId
            }
          });

        if (notificationError) {
          console.error('⚠️ Failed to send notification:', notificationError);
          // Don't fail the whole process for notification error
        } else {
          console.log('📬 Notification sent to user');
        }
      } catch (notificationError) {
        console.error('⚠️ Notification error:', notificationError);
        // Continue anyway
      }

      toast.success('✅ Meeting scheduled successfully! User has been notified.');
      
      // Refresh meetings list
      await fetchMeetings();
      
      return meetingRecord;

    } catch (error) {
      console.error('❌ Error scheduling meeting:', error);
      
      if (error instanceof Error) {
        toast.error(`Failed to schedule meeting: ${error.message}`);
        throw error;
      } else {
        const errorMessage = 'Unknown error occurred while scheduling meeting';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    }
  };

  // Update meeting status
  const updateMeetingStatus = async (meetingId: string, status: 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status })
        .eq('meeting_id', meetingId);

      if (error) throw error;

      // Update local state
      setMeetings(prev => 
        prev.map(meeting => 
          meeting.meeting_id === meetingId 
            ? { ...meeting, status }
            : meeting
        )
      );

      toast.success(`✅ Meeting marked as ${status}`);
    } catch (error) {
      console.error('❌ Error updating meeting status:', error);
      toast.error('Failed to update meeting status');
    }
  };

  // Delete meeting function
  const deleteMeeting = async (meetingId: string) => {
    try {
      console.log('🗑️ Deleting meeting:', meetingId);

      // First, get meeting details for notification cleanup
      const { data: meetingData, error: fetchError } = await supabase
        .from('meetings')
        .select('invited_user_id, title')
        .eq('meeting_id', meetingId)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching meeting for deletion:', fetchError);
        throw fetchError;
      }

      // Delete the meeting
      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('meeting_id', meetingId);

      if (deleteError) throw deleteError;

      // Remove from local state
      setMeetings(prev => prev.filter(meeting => meeting.meeting_id !== meetingId));

      // Send notification to invited user about meeting cancellation
      if (meetingData?.invited_user_id) {
        try {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: meetingData.invited_user_id,
              title: 'Meeting Cancelled',
              message: `The meeting "${meetingData.title || 'Admin Meeting'}" has been cancelled by the admin.`,
              type: 'meeting_cancelled',
              metadata: {
                meeting_id: meetingId,
                cancelled_at: new Date().toISOString()
              }
            });

          if (notificationError) {
            console.error('⚠️ Failed to send cancellation notification:', notificationError);
          } else {
            console.log('📬 Cancellation notification sent to user');
          }
        } catch (notificationError) {
          console.error('⚠️ Notification error:', notificationError);
        }
      }

      toast.success('🗑️ Meeting deleted successfully');
      console.log('✅ Meeting deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting meeting:', error);
      if (error instanceof Error) {
        toast.error(`Failed to delete meeting: ${error.message}`);
      } else {
        toast.error('Failed to delete meeting');
      }
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchMeetings();
    setLoading(false);

    const meetingsChannel = supabase
      .channel('meetings-integration')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
        },
        (payload) => {
          console.log('📅 Meeting updated:', payload);
          fetchMeetings();
          
          if (payload.eventType === 'INSERT') {
            toast.info('📅 New Meeting Scheduled', {
              description: 'A new meeting has been scheduled',
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(meetingsChannel);
    };
  }, []);

  return {
    meetings,
    loading,
    scheduleMeeting,
    updateMeetingStatus,
    deleteMeeting,
    refetch: fetchMeetings
  };
}
