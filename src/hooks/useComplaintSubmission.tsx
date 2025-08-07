
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ComplaintData {
  full_name: string;
  employee_id: string;
  department: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  attachment?: string;
}

export function useComplaintSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitComplaint = async (complaintData: ComplaintData) => {
    if (!user) {
      toast.error('You must be logged in to submit a complaint');
      return null;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting complaint with user ID:', user.id);
      
      // Ensure user exists in users table
      const { data: existingUser, error: userFetchError } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userFetchError) {
        console.error('Error checking user:', userFetchError);
      }

      if (!existingUser) {
        console.log('Creating user profile...');
        const { error: userCreateError } = await supabase
          .from('users')
          .insert({
            user_id: user.id,
            full_name: complaintData.full_name,
            employee_id: complaintData.employee_id,
            department: complaintData.department
          });

        if (userCreateError) {
          console.error('Error creating user:', userCreateError);
          throw userCreateError;
        }
      }

      // Submit complaint
      const { data: complaint, error: complaintError } = await supabase
        .from('complaints')
        .insert({
          user_id: user.id,
          title: complaintData.title,
          category: complaintData.category,
          priority: complaintData.priority,
          description: complaintData.description,
          attachment: complaintData.attachment || null,
          status: 'Pending'
        })
        .select()
        .single();

      if (complaintError) {
        console.error('Error submitting complaint:', complaintError);
        throw complaintError;
      }

      console.log('Complaint submitted successfully:', complaint);
      
      // Enhanced success notification with more details
      toast.success('✅ Complaint Submitted Successfully!', {
        description: `Your complaint "${complaint.title}" has been received and assigned ID: ${complaint.complaint_id}. An admin will review it shortly.`,
        duration: 8000,
        action: {
          label: 'View My Complaints',
          onClick: () => window.location.href = '/user#my-complaints'
        }
      });

      // Create user notification
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            title: 'Complaint Submitted Successfully',
            message: `Your complaint "${complaint.title}" has been submitted and is now being reviewed by our team.`,
            type: 'complaint_submitted',
            complaint_id: complaint.complaint_id,
            metadata: {
              complaint_id: complaint.complaint_id,
              priority: complaint.priority,
              category: complaint.category
            }
          });
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError);
        // Don't fail the whole submission if notification fails
      }

      return complaint;
    } catch (error: any) {
      console.error('Error in complaint submission:', error);
      
      let errorMessage = 'Failed to submit complaint';
      if (error.message?.includes('duplicate key')) {
        errorMessage = 'A user with this employee ID already exists.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        description: 'If the problem persists, please contact support',
      });
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitComplaint,
    isSubmitting
  };
}
