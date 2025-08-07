
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Video, ExternalLink, CheckCircle, XCircle, AlertCircle, FileText, Shield } from 'lucide-react';
import { useMeetingIntegration } from '@/hooks/useMeetingIntegration';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export function AdminMeetingsPage() {
  const { meetings, loading } = useMeetingIntegration();
  const { user } = useAuth();

  // Secure filtering: Only show meetings where the current user is the invited user
  const userMeetings = meetings.filter(meeting => {
    // Only show meetings where the current user is explicitly invited
    return meeting.invited_user_id === user?.id;
  });

  console.log('🔐 Filtered meetings for user:', user?.id, 'Found:', userMeetings.length);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header with Security Notice */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Scheduled Meetings</h1>
            <div className="flex items-center space-x-2 text-gray-600">
              <Shield className="w-4 h-4" />
              <p>Only meetings scheduled specifically for you are displayed here</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Meetings</p>
                    <p className="text-2xl font-bold text-gray-900">{userMeetings.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Scheduled</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userMeetings.filter(m => m.status === 'scheduled').length}
                    </p>
                  </div>
                  <Video className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userMeetings.filter(m => m.status === 'completed').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meetings List */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Meeting Sessions Scheduled for You
                {userMeetings.length > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800">
                    {userMeetings.length} meeting{userMeetings.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userMeetings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Meetings Scheduled</h3>
                  <p className="text-gray-500">You don't have any meetings scheduled specifically for you at this time.</p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center text-blue-700">
                      <Shield className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Secure Access: Only your invited meetings are shown</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {userMeetings
                    .sort((a, b) => new Date(b.schedule_time).getTime() - new Date(a.schedule_time).getTime())
                    .map((meeting, index) => (
                      <motion.div
                        key={meeting.meeting_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-6 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                              {getStatusIcon(meeting.status)}
                              <span className="ml-2">
                                {meeting.title || 'Admin Meeting Session'}
                              </span>
                            </h3>
                            
                            {/* Meeting Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                <span>
                                  {format(new Date(meeting.schedule_time), 'MMM dd, yyyy HH:mm')}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                <span>Scheduled by Admin</span>
                              </div>
                            </div>

                            {/* Description if available */}
                            {meeting.description && (
                              <div className="flex items-start text-sm text-gray-600 mb-3">
                                <FileText className="w-4 h-4 mr-2 mt-0.5" />
                                <span>{meeting.description}</span>
                              </div>
                            )}

                            {/* Related complaint info */}
                            {meeting.complaint?.title && (
                              <div className="flex items-start text-sm text-gray-600 mb-3">
                                <AlertCircle className="w-4 h-4 mr-2 mt-0.5" />
                                <span>Related to complaint: {meeting.complaint.title}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={`${getStatusColor(meeting.status)} font-medium`}>
                              {meeting.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-500">
                            <span>
                              Scheduled {formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          
                          {meeting.status === 'scheduled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(meeting.meet_link, '_blank')}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Join Meeting
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
