
-- Add user_id column to meetings table to specify who the meeting is for
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS invited_user_id uuid REFERENCES auth.users(id);

-- Add additional fields for meeting details
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS description text;

-- Update the meeting notification function to handle invited users
CREATE OR REPLACE FUNCTION public.notify_meeting_scheduled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  invited_user_record RECORD;
  complaint_data RECORD;
BEGIN
  -- Get invited user data from profiles
  SELECT p.*, u.full_name as user_full_name, u.employee_id 
  INTO invited_user_record 
  FROM profiles p
  LEFT JOIN users u ON p.id = u.user_id
  WHERE p.id = NEW.invited_user_id;
  
  -- Get complaint data if complaint_id exists
  IF NEW.complaint_id IS NOT NULL THEN
    SELECT * INTO complaint_data 
    FROM complaints 
    WHERE complaint_id = NEW.complaint_id;
  END IF;
  
  -- Notify invited user about scheduled meeting
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    metadata
  ) VALUES (
    NEW.invited_user_id,
    'Google Meet Scheduled',
    CASE 
      WHEN NEW.complaint_id IS NOT NULL THEN
        'A Google Meet has been scheduled for your complaint "' || COALESCE(complaint_data.title, 'N/A') || '" on ' || 
        TO_CHAR(NEW.schedule_time, 'DD-MM-YYYY at HH24:MI')
      ELSE
        'A Google Meet has been scheduled: "' || COALESCE(NEW.title, 'Meeting') || '" on ' || 
        TO_CHAR(NEW.schedule_time, 'DD-MM-YYYY at HH24:MI')
    END,
    'meeting_scheduled',
    jsonb_build_object(
      'meeting_id', NEW.meeting_id,
      'meet_link', NEW.meet_link,
      'schedule_time', NEW.schedule_time,
      'meeting_title', NEW.title,
      'complaint_id', NEW.complaint_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for meeting notifications
DROP TRIGGER IF EXISTS trigger_notify_meeting_scheduled ON public.meetings;
CREATE TRIGGER trigger_notify_meeting_scheduled
  AFTER INSERT ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION notify_meeting_scheduled();

-- Update RLS policies for meetings to allow users to see meetings they're invited to
DROP POLICY IF EXISTS "Users can view meetings they are invited to" ON public.meetings;
CREATE POLICY "Users can view meetings they are invited to"
ON public.meetings
FOR SELECT
TO authenticated
USING (auth.uid() = invited_user_id OR EXISTS (
  SELECT 1 FROM complaints 
  WHERE complaints.complaint_id = meetings.complaint_id 
  AND complaints.user_id = auth.uid()
));
