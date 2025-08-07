
-- Create trigger function for IBM complaint notifications
CREATE OR REPLACE FUNCTION public.create_ibm_complaint_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  admin_user RECORD;
  complaint_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get complaint user_id
    complaint_user_id := NEW.user_id;
    
    -- Notify all admins and agents about new IBM complaint
    FOR admin_user IN 
      SELECT DISTINCT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        metadata
      ) VALUES (
        admin_user.user_id,
        'New IBM Complaint Received',
        'A new IBM complaint "' || NEW.issue_title || '" has been submitted and requires attention.',
        'complaint_created',
        jsonb_build_object(
          'complaint_id', NEW.id,
          'priority', NEW.priority, 
          'category', NEW.category,
          'employee_id', NEW.employee_id,
          'department', NEW.department
        )
      );
    END LOOP;

  ELSIF TG_OP = 'UPDATE' THEN
    complaint_user_id := NEW.user_id;
    
    -- Check if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        metadata
      ) VALUES (
        complaint_user_id,
        'IBM Complaint Status Updated',
        'Your IBM complaint "' || NEW.issue_title || '" status has been updated to "' || NEW.status || '".',
        'status_updated',
        jsonb_build_object(
          'complaint_id', NEW.id,
          'old_status', OLD.status, 
          'new_status', NEW.status,
          'employee_id', NEW.employee_id
        )
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for IBM complaints
DROP TRIGGER IF EXISTS ibm_complaint_notification_trigger ON public.ibm_complaints;
CREATE TRIGGER ibm_complaint_notification_trigger
  AFTER INSERT OR UPDATE ON public.ibm_complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ibm_complaint_notification();

-- Enable realtime for ibm_complaints table
ALTER TABLE public.ibm_complaints REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ibm_complaints;
