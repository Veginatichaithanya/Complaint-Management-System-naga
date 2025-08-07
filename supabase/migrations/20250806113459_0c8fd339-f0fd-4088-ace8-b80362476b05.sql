
-- Create meetings table for Google Meet sessions
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  agenda TEXT,
  meet_link TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  issue_category TEXT,
  issue_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting attendees table
CREATE TABLE public.meeting_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  complaint_id UUID REFERENCES public.complaints(id),
  invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined')),
  attendance_status TEXT DEFAULT 'not_attended' CHECK (attendance_status IN ('attended', 'not_attended', 'partial')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS on meetings table
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- RLS policies for meetings
CREATE POLICY "Admins and agents can manage all meetings" 
  ON public.meetings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

CREATE POLICY "Users can view meetings they're invited to" 
  ON public.meetings 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM meeting_attendees ma 
      WHERE ma.meeting_id = meetings.id 
      AND ma.user_id = auth.uid()
    )
  );

-- Enable RLS on meeting_attendees table
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;

-- RLS policies for meeting_attendees
CREATE POLICY "Admins and agents can manage all attendees" 
  ON public.meeting_attendees 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

CREATE POLICY "Users can view and update their own attendance" 
  ON public.meeting_attendees 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create function to group similar complaints
CREATE OR REPLACE FUNCTION get_similar_complaints(
  hours_limit INTEGER DEFAULT 24,
  min_similar_count INTEGER DEFAULT 2
)
RETURNS TABLE (
  issue_keywords TEXT,
  complaint_count INTEGER,
  user_ids UUID[],
  complaint_ids UUID[],
  category complaint_category,
  priority complaint_priority,
  latest_created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH similar_issues AS (
    SELECT 
      LOWER(TRIM(c.title)) as normalized_title,
      c.category,
      c.priority,
      c.status,
      array_agg(c.user_id) as user_list,
      array_agg(c.id) as complaint_list,
      COUNT(*) as issue_count,
      MAX(c.created_at) as latest_complaint
    FROM complaints c
    WHERE 
      c.created_at >= NOW() - INTERVAL '1 hour' * hours_limit
      AND c.status IN ('open', 'in_progress')
    GROUP BY 
      LOWER(TRIM(c.title)), 
      c.category, 
      c.priority, 
      c.status
    HAVING COUNT(*) >= min_similar_count
  )
  SELECT 
    si.normalized_title,
    si.issue_count::INTEGER,
    si.user_list,
    si.complaint_list,
    si.category,
    si.priority,
    si.latest_complaint
  FROM similar_issues si
  ORDER BY si.issue_count DESC, si.latest_complaint DESC;
END;
$$;

-- Create function to send meeting notifications
CREATE OR REPLACE FUNCTION create_meeting_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attendee_record RECORD;
  meeting_record RECORD;
BEGIN
  -- Get meeting details
  SELECT * INTO meeting_record FROM meetings WHERE id = NEW.meeting_id;
  
  IF TG_OP = 'INSERT' THEN
    -- Send notification to invited user
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      metadata
    ) VALUES (
      NEW.user_id,
      'Google Meet Session Scheduled',
      'You have been invited to a live support session: "' || meeting_record.title || '" scheduled for ' || 
      TO_CHAR(meeting_record.scheduled_date, 'DD-MM-YYYY at HH24:MI') || '. Join link: ' || meeting_record.meet_link,
      'info',
      jsonb_build_object(
        'meeting_id', NEW.meeting_id,
        'meet_link', meeting_record.meet_link,
        'scheduled_date', meeting_record.scheduled_date,
        'issue_category', meeting_record.issue_category
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for meeting notifications
CREATE TRIGGER meeting_attendee_notification_trigger
  AFTER INSERT OR UPDATE ON meeting_attendees
  FOR EACH ROW EXECUTE FUNCTION create_meeting_notification();

-- Enable realtime for meetings and attendees
ALTER TABLE public.meetings REPLICA IDENTITY FULL;
ALTER TABLE public.meeting_attendees REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.meetings;
ALTER publication supabase_realtime ADD TABLE public.meeting_attendees;
