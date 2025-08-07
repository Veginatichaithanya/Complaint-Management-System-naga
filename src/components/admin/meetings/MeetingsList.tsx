import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Video, ExternalLink, CheckCircle, XCircle, FileText, Trash2 } from 'lucide-react';
import { Meeting } from '@/hooks/useMeetings';
import { motion } from 'framer-motion';

interface MeetingsListProps {
  meetings: Meeting[];
  loading: boolean;
  onStatusUpdate: (meetingId: string, status: string) => void;
  onDeleteMeeting?: (meetingId: string) => void;
}

export function MeetingsList({ meetings, loading, onStatusUpdate, onDeleteMeeting }: MeetingsListProps) {
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-GB'),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };
  };

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

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Scheduled Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-gray-900">
          <span className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Scheduled Meetings
          </span>
          {meetings.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800">
              {meetings.filter(m => m.status === 'scheduled').length} upcoming
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No meetings scheduled</p>
            <p className="text-sm text-gray-400 mt-1">Create meetings from similar issues detection</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings
              .sort((a, b) => new Date(a.schedule_time).getTime() - new Date(b.schedule_time).getTime())
              .map((meeting, index) => {
                const { date, time } = formatDateTime(meeting.schedule_time);
                return (
                  <motion.div
                    key={meeting.meeting_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {meeting.complaint_id ? 
                            `Meeting for Complaint ${meeting.complaint_id}` : 
                            'Admin Meeting Session'
                          }
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {date}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {time}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(meeting.meet_link, '_blank')}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Join Meeting
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2">
                        {meeting.status === 'scheduled' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onStatusUpdate(meeting.meeting_id, 'completed')}
                              className="border-green-300 text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onStatusUpdate(meeting.meeting_id, 'cancelled')}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        
                        {onDeleteMeeting && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteMeeting(meeting.meeting_id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
