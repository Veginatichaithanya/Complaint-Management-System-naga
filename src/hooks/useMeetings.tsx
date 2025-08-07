
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Meeting {
  meeting_id: string;
  complaint_id: string;
  admin_id: string;
  meet_link: string;
  schedule_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export interface SimilarIssue {
  issue_keywords: string;
  complaint_count: number;
  user_ids: string[];
  complaint_ids: string[];
  category: string;
  priority: string;
  latest_created_at: string;
}

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [similarIssues, setSimilarIssues] = useState<SimilarIssue[]>([]);

  // Fetch meetings for user's complaints
  const fetchMeetings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          meeting_id,
          complaint_id,
          admin_id,
          meet_link,
          schedule_time,
          status,
          created_at
        `)
        .order('schedule_time', { ascending: true });

      if (error) throw error;
      setMeetings((data as Meeting[]) || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    }
  };

  // Create meeting (admin only)
  const createMeeting = async (meetingData: {
    complaint_id: string;
    admin_id: string;
    meet_link: string;
    schedule_time: string;
  }) => {
    try {
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          complaint_id: meetingData.complaint_id,
          admin_id: meetingData.admin_id,
          meet_link: meetingData.meet_link,
          schedule_time: meetingData.schedule_time,
          status: 'scheduled'
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      toast.success('Meeting scheduled successfully');
      await fetchMeetings();
      return meeting;
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to schedule meeting');
      throw error;
    }
  };

  // Update meeting status
  const updateMeetingStatus = async (meetingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status })
        .eq('meeting_id', meetingId);

      if (error) throw error;

      toast.success('Meeting status updated');
      await fetchMeetings();
    } catch (error) {
      console.error('Error updating meeting status:', error);
      toast.error('Failed to update meeting status');
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    let meetingsChannel: any;

    const setupRealtimeSubscription = async () => {
      try {
        // Initial load
        await fetchMeetings();
        setLoading(false);

        // Set up real-time subscription for meetings
        meetingsChannel = supabase
          .channel('meetings-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'meetings',
            },
            () => {
              fetchMeetings();
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error setting up meetings subscription:', error);
        setLoading(false);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (meetingsChannel) {
        supabase.removeChannel(meetingsChannel);
      }
    };
  }, [user]);

  return {
    meetings,
    loading,
    createMeeting,
    updateMeetingStatus,
    refetch: fetchMeetings,
    similarIssues
  };
}
