
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SimilarIssue } from '@/hooks/useMeetings';

interface MeetingSchedulerProps {
  similarIssue?: SimilarIssue;
  trigger?: React.ReactNode;
}

export function MeetingScheduler({ similarIssue, trigger }: MeetingSchedulerProps) {
  const navigate = useNavigate();

  const handleScheduleMeeting = () => {
    const params = new URLSearchParams();
    if (similarIssue) {
      params.set('similarIssue', encodeURIComponent(JSON.stringify(similarIssue)));
    }
    navigate(`/schedule-meeting?${params.toString()}`);
  };

  const defaultTrigger = (
    <Button 
      onClick={handleScheduleMeeting}
      className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
    >
      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      <Sparkles className="w-4 h-4 mr-2" />
      Schedule Meeting
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={handleScheduleMeeting}>
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}
    </>
  );
}
