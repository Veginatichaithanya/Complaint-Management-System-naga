
-- First, let's check if we have the proper trigger for meeting notifications
-- This trigger should create notifications when meetings are scheduled

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS notify_meeting_scheduled_trigger ON meetings;

-- Create the trigger function for meeting notifications
CREATE OR REPLACE FUNCTION public.notify_meeting_scheduled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

-- Create the trigger
CREATE TRIGGER notify_meeting_scheduled_trigger
  AFTER INSERT ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION notify_meeting_scheduled();

-- Enable realtime for meetings table
ALTER TABLE meetings REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE meetings;

-- Enable realtime for notifications table  
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE notifications;
