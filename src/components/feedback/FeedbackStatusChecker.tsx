
import React, { useEffect, useState } from 'react';
import { CheckCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FeedbackForm } from './FeedbackForm';
import { toast } from 'sonner';

interface FeedbackStatusCheckerProps {
  complaintId: string;
  complaintTitle: string;
  complaintStatus: string;
  ticketNumber?: string;
}

export function FeedbackStatusChecker({ 
  complaintId, 
  complaintTitle, 
  complaintStatus,
  ticketNumber 
}: FeedbackStatusCheckerProps) {
  const { user } = useAuth();
  const [feedbackExists, setFeedbackExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  // Check if user exists in users table and if feedback already submitted
  const checkFeedbackStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error checking user existence:', userError);
        setUserExists(false);
      } else {
        setUserExists(!!userData);
      }

      // Check if feedback already exists for this complaint
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('feedback_id')
        .eq('complaint_id', complaintId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (feedbackError) {
        console.error('Error checking feedback existence:', feedbackError);
        setFeedbackExists(null);
      } else {
        setFeedbackExists(!!feedbackData);
      }
    } catch (error) {
      console.error('Error in checkFeedbackStatus:', error);
      setFeedbackExists(null);
      setUserExists(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFeedbackStatus();
  }, [user, complaintId]);

  // Only show feedback form if:
  // 1. User is authenticated
  // 2. User exists in users table
  // 3. Complaint/ticket is closed
  // 4. Feedback hasn't been submitted yet
  const shouldShowFeedbackForm = 
    user && 
    userExists && 
    (complaintStatus === 'Closed' || complaintStatus === 'Resolved') && 
    feedbackExists === false;

  const shouldShowFeedbackSubmitted = 
    user && 
    userExists && 
    feedbackExists === true;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking feedback status...</span>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return null;
  }

  // User doesn't exist in users table
  if (userExists === false) {
    return (
      <Card className="bg-yellow-50 border-yellow-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center">
            <MessageSquare className="w-6 h-6 text-yellow-600 mr-3" />
            <div>
              <h3 className="font-semibold text-yellow-900">Profile Setup Required</h3>
              <p className="text-yellow-800 text-sm mt-1">
                Please complete your user profile setup to provide feedback on resolved complaints.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Complaint/ticket not closed yet
  if (complaintStatus !== 'Closed' && complaintStatus !== 'Resolved') {
    return null;
  }

  // Feedback already submitted
  if (shouldShowFeedbackSubmitted) {
    return (
      <Card className="bg-green-50 border-green-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-900 flex items-center">
                Feedback Submitted
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-300">
                  Thank You
                </Badge>
              </h3>
              <p className="text-green-800 text-sm mt-1">
                You have already provided feedback for this complaint. Thank you for helping us improve our service quality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show feedback form
  if (shouldShowFeedbackForm) {
    return (
      <FeedbackForm
        complaintId={complaintId}
        complaintTitle={complaintTitle}
        ticketNumber={ticketNumber}
        onSubmitted={() => {
          setFeedbackExists(true);
          toast.success('Feedback submitted successfully!');
        }}
      />
    );
  }

  return null;
}
