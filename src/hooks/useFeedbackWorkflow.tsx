
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface FeedbackEntry {
  feedback_id: string;
  complaint_id: string;
  user_id: string;
  rating: number;
  comments: string | null;
  submitted_at: string;
  complaint: {
    title: string;
    status: string;
  };
  user: {
    full_name: string;
    employee_id?: string;
  };
}

export interface FeedbackEligibilityCheck {
  canSubmitFeedback: boolean;
  reason?: string;
  hasExistingFeedback: boolean;
}

export function useFeedbackWorkflow() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch feedback with complaint and user data
  const fetchFeedback = async () => {
    try {
      console.log('📝 Fetching feedback data...');

      const { data: feedbackData, error } = await supabase
        .from('feedback')
        .select(`
          feedback_id,
          complaint_id,
          user_id,
          rating,
          comments,
          submitted_at
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Get related complaint and user data
      const feedbackWithDetails = await Promise.all(
        (feedbackData || []).map(async (feedback) => {
          // Get complaint data
          const { data: complaintData } = await supabase
            .from('complaints')
            .select('title, status')
            .eq('complaint_id', feedback.complaint_id)
            .maybeSingle();

          // Get user data
          let userData = { full_name: 'Unknown User', employee_id: 'N/A' };
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', feedback.user_id)
            .maybeSingle();

          if (profileData) {
            userData.full_name = profileData.full_name || 'Unknown User';
          }

          const { data: userTableData } = await supabase
            .from('users')
            .select('full_name, employee_id')
            .eq('user_id', feedback.user_id)
            .maybeSingle();

          if (userTableData) {
            userData.full_name = userTableData.full_name || userData.full_name;
            userData.employee_id = userTableData.employee_id || 'N/A';
          }

          return {
            ...feedback,
            complaint: complaintData || { title: 'Unknown Complaint', status: 'Unknown' },
            user: userData
          };
        })
      );

      setFeedbacks(feedbackWithDetails);
      console.log('✅ Feedback data loaded:', feedbackWithDetails.length);
    } catch (error) {
      console.error('❌ Error fetching feedback:', error);
      toast.error('Failed to load feedback data');
    }
  };

  // Check if user can submit feedback for a specific complaint
  const checkFeedbackEligibility = async (complaintId: string): Promise<FeedbackEligibilityCheck> => {
    if (!user) {
      return {
        canSubmitFeedback: false,
        reason: 'User not authenticated',
        hasExistingFeedback: false
      };
    }

    try {
      // Check if user exists in users table
      const { data: userData } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!userData) {
        return {
          canSubmitFeedback: false,
          reason: 'User profile not found in users table',
          hasExistingFeedback: false
        };
      }

      // Check if complaint exists and is closed/resolved
      const { data: complaintData } = await supabase
        .from('complaints')
        .select('complaint_id, status, user_id')
        .eq('complaint_id', complaintId)
        .maybeSingle();

      if (!complaintData) {
        return {
          canSubmitFeedback: false,
          reason: 'Complaint not found',
          hasExistingFeedback: false
        };
      }

      if (complaintData.user_id !== user.id) {
        return {
          canSubmitFeedback: false,
          reason: 'You can only provide feedback for your own complaints',
          hasExistingFeedback: false
        };
      }

      if (complaintData.status !== 'Closed' && complaintData.status !== 'Resolved') {
        return {
          canSubmitFeedback: false,
          reason: 'Feedback can only be provided after complaint is closed/resolved',
          hasExistingFeedback: false
        };
      }

      // Check if feedback already exists
      const { data: existingFeedback } = await supabase
        .from('feedback')
        .select('feedback_id')
        .eq('complaint_id', complaintId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingFeedback) {
        return {
          canSubmitFeedback: false,
          reason: 'Feedback already submitted for this complaint',
          hasExistingFeedback: true
        };
      }

      return {
        canSubmitFeedback: true,
        hasExistingFeedback: false
      };
    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
      return {
        canSubmitFeedback: false,
        reason: 'Error checking eligibility',
        hasExistingFeedback: false
      };
    }
  };

  // Handle feedback submission and close ticket
  const processFeedbackSubmission = async (complaintId: string, feedbackData: {
    rating: number;
    comments?: string;
  }) => {
    try {
      console.log('🔄 Processing feedback submission for complaint:', complaintId);

      // 1. Update complaint status to 'Closed'
      const { error: complaintError } = await supabase
        .from('complaints')
        .update({ 
          status: 'Closed',
          updated_at: new Date().toISOString()
        })
        .eq('complaint_id', complaintId);

      if (complaintError) throw complaintError;

      // 2. Close related ticket if exists
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ 
          status: 'closed',
          resolved_at: new Date().toISOString(),
          resolution_notes: `Ticket closed after user feedback. Rating: ${feedbackData.rating}/5`
        })
        .eq('complaint_id', complaintId);

      if (ticketError) {
        console.warn('⚠️ No ticket found or error updating ticket:', ticketError);
      }

      // 3. Create notification for admin
      const { data: complaintData } = await supabase
        .from('complaints')
        .select('title, user_id')
        .eq('complaint_id', complaintId)
        .single();

      if (complaintData) {
        await supabase
          .from('admin_notifications')
          .insert({
            notification_type: 'feedback_received',
            title: 'Feedback Received',
            message: `User feedback received for complaint "${complaintData.title}". Rating: ${feedbackData.rating}/5`,
            metadata: {
              complaint_id: complaintId,
              rating: feedbackData.rating,
              has_comments: !!feedbackData.comments
            }
          });
      }

      console.log('✅ Feedback processing completed');
      toast.success('✅ Complaint closed and feedback processed');
      
      // Refresh feedback list
      await fetchFeedback();
      
      return true;
    } catch (error) {
      console.error('❌ Error processing feedback:', error);
      toast.error('Failed to process feedback submission');
      return false;
    }
  };

  // Set up real-time subscription for feedback
  useEffect(() => {
    fetchFeedback();
    setLoading(false);

    const feedbackChannel = supabase
      .channel('feedback-workflow')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback',
        },
        async (payload) => {
          console.log('📝 New feedback submitted:', payload);
          const newFeedback = payload.new as any;
          
          // Process the feedback submission
          await processFeedbackSubmission(newFeedback.complaint_id, {
            rating: newFeedback.rating,
            comments: newFeedback.comments
          });
          
          toast.info('📝 New Feedback Received', {
            description: `User submitted feedback with ${newFeedback.rating}/5 rating`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedbackChannel);
    };
  }, []);

  return {
    feedbacks,
    loading,
    checkFeedbackEligibility,
    processFeedbackSubmission,
    refetch: fetchFeedback
  };
}
