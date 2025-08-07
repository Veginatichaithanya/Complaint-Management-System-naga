
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Video, Users, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useMeetingIntegration } from '@/hooks/useMeetingIntegration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserSearchResult {
  id: string;
  full_name: string;
  email: string;
  employee_id?: string;
  complaint_id?: string;
  complaint_title?: string;
}

export default function MeetingScheduler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { scheduleMeeting } = useMeetingIntegration();
  
  const [formData, setFormData] = useState({
    userEmail: '',
    title: '',
    description: '',
    scheduleTime: '',
    meetLink: ''
  });
  
  const [userSearchResult, setUserSearchResult] = useState<UserSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load similar issue data if provided
  useEffect(() => {
    const similarIssueParam = searchParams.get('similarIssue');
    if (similarIssueParam) {
      try {
        const similarIssue = JSON.parse(decodeURIComponent(similarIssueParam));
        setFormData(prev => ({
          ...prev,
          title: `Group Meeting: ${similarIssue.issue_keywords}`,
          description: `Discussion for ${similarIssue.complaint_count} similar complaints in category: ${similarIssue.category}`
        }));
      } catch (error) {
        console.error('Error parsing similar issue data:', error);
      }
    }
  }, [searchParams]);

  // Enhanced user search with complaint association
  const searchUser = async (email: string) => {
    if (!email.trim()) {
      setUserSearchResult(null);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching for user with email:', email);

      // First check profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', email.trim())
        .maybeSingle();

      if (profileError) {
        console.error('Profile search error:', profileError);
        toast.error('Error searching for user');
        return;
      }

      if (profileData) {
        console.log('✅ Profile found:', profileData);
        
        // Get additional user data from users table
        const { data: userData } = await supabase
          .from('users')
          .select('employee_id')
          .eq('user_id', profileData.id)
          .maybeSingle();

        // Look for any recent complaints from this user
        const { data: recentComplaint } = await supabase
          .from('complaints')
          .select('complaint_id, title')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const userResult: UserSearchResult = {
          id: profileData.id,
          full_name: profileData.full_name || 'Unknown User',
          email: profileData.email || email,
          employee_id: userData?.employee_id || 'N/A',
          complaint_id: recentComplaint?.complaint_id || undefined,
          complaint_title: recentComplaint?.title || undefined
        };

        setUserSearchResult(userResult);
        console.log('✅ User search result:', userResult);
      } else {
        setUserSearchResult(null);
        console.log('❌ User not found for email:', email);
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Failed to search for user');
      setUserSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle email input change with debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.userEmail) {
        searchUser(formData.userEmail);
      } else {
        setUserSearchResult(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userSearchResult) {
      toast.error('Please enter a valid user email and wait for user verification');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    if (!formData.scheduleTime) {
      toast.error('Please select a schedule time');
      return;
    }

    if (!formData.meetLink.trim()) {
      toast.error('Please enter a Google Meet link');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Submitting meeting with user:', userSearchResult);
      
      const meetingData = {
        invited_user_id: userSearchResult.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        schedule_time: formData.scheduleTime,
        meet_link: formData.meetLink.trim(),
        complaint_id: userSearchResult.complaint_id // Associate with complaint if available
      };

      console.log('📅 Meeting data to submit:', meetingData);

      await scheduleMeeting(meetingData);
      
      toast.success('✅ Meeting scheduled successfully! User has been notified.');
      
      // Reset form
      setFormData({
        userEmail: '',
        title: '',
        description: '',
        scheduleTime: '',
        meetLink: ''
      });
      setUserSearchResult(null);
      
      // Navigate back to meetings tab after successful scheduling
      setTimeout(() => {
        navigate('/admin#meetings');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error in form submission:', error);
      // Error handling is done in scheduleMeeting function
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin#meetings')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Meetings
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Video className="w-8 h-8 text-blue-600" />
            Schedule Google Meet
          </h1>
          <p className="text-gray-600 mt-2">
            Schedule a live support session with a user
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Meeting Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Email */}
                <div className="space-y-2">
                  <Label htmlFor="userEmail">User Email *</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={formData.userEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                    placeholder="Enter user email to search..."
                    required
                  />
                  
                  {/* User Search Result */}
                  {isSearching && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      Searching and validating user...
                    </div>
                  )}
                  
                  {formData.userEmail && !isSearching && userSearchResult && (
                    <div className="flex flex-col gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">User Found: {userSearchResult.full_name}</span>
                      </div>
                      <div className="text-sm text-green-700 ml-6">
                        <div>Email: {userSearchResult.email}</div>
                        <div>Employee ID: {userSearchResult.employee_id}</div>
                        {userSearchResult.complaint_title && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <div className="font-medium text-blue-800">Recent Complaint Found:</div>
                            <div className="text-blue-700">"{userSearchResult.complaint_title}"</div>
                            <div className="text-xs text-blue-600 mt-1">Meeting will be associated with this complaint</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {formData.userEmail && !isSearching && !userSearchResult && formData.userEmail.includes('@') && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800">User not found with this email. Please verify the email address.</span>
                    </div>
                  )}
                </div>

                {/* Meeting Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Support Session - Login Issues"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what will be discussed..."
                    rows={3}
                  />
                </div>

                {/* Schedule Time */}
                <div className="space-y-2">
                  <Label htmlFor="scheduleTime">Schedule Time *</Label>
                  <Input
                    id="scheduleTime"
                    type="datetime-local"
                    value={formData.scheduleTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduleTime: e.target.value }))}
                    required
                  />
                </div>

                {/* Google Meet Link */}
                <div className="space-y-2">
                  <Label htmlFor="meetLink">Google Meet Link *</Label>
                  <Input
                    id="meetLink"
                    type="url"
                    value={formData.meetLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetLink: e.target.value }))}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin#meetings')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!userSearchResult || isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Schedule Meeting
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
