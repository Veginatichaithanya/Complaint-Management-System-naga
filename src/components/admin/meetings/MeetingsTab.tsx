
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MeetingsList } from './MeetingsList';
import { SimilarIssuesDetector } from './SimilarIssuesDetector';
import { MeetingScheduler } from './MeetingScheduler';
import { useMeetingIntegration } from '@/hooks/useMeetingIntegration';
import { useMeetings } from '@/hooks/useMeetings';
import { Calendar, Users, Clock, CheckCircle, Plus } from 'lucide-react';

export function MeetingsTab() {
  const { meetings, loading, updateMeetingStatus, deleteMeeting } = useMeetingIntegration();
  const { similarIssues, loading: issuesLoading } = useMeetings();

  const totalMeetings = meetings.length;
  const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length;
  const completedMeetings = meetings.filter(m => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header with Create Meeting Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings Management</h1>
          <p className="text-gray-600 mt-1">Manage scheduled meetings and similar issues</p>
        </div>
        <MeetingScheduler 
          trigger={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Meeting
            </Button>
          }
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{totalMeetings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledMeetings}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedMeetings}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(meetings.map(m => m.invited_user_id).filter(Boolean)).size}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Similar Issues Detector */}
      <SimilarIssuesDetector 
        issues={similarIssues || []} 
        loading={issuesLoading} 
      />

      {/* Meetings List */}
      <MeetingsList
        meetings={meetings}
        loading={loading}
        onStatusUpdate={updateMeetingStatus}
        onDeleteMeeting={deleteMeeting}
      />
    </div>
  );
}
