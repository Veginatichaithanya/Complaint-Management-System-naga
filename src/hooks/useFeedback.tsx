
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Feedback {
  feedback_id: string;
  complaint_id: string;
  user_id: string;
  rating: number;
  comments: string;
  submitted_at: string;
}

export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  // Fetch user's feedback
  const fetchFeedback = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setFeedback((data as Feedback[]) || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  // Submit feedback
  const submitFeedback = async (feedbackData: {
    complaint_id: string;
    rating: number;
    comments: string;
  }) => {
    if (!user) {
      toast.error('You must be logged in to submit feedback');
      return null;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          complaint_id: feedbackData.complaint_id,
          user_id: user.id,
          rating: feedbackData.rating,
          comments: feedbackData.comments
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Feedback submitted successfully!', {
        description: 'Thank you for your feedback',
      });

      await fetchFeedback();
      return data;
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback', {
        description: error.message || 'Please try again later'
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user]);

  return {
    feedback,
    loading,
    submitting,
    submitFeedback,
    refetch: fetchFeedback
  };
}
