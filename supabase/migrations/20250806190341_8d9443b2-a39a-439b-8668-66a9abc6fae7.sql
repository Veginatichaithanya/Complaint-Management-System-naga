
-- First, let's ensure the complaints table has all necessary fields and proper structure
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS employee_id text,
ADD COLUMN IF NOT EXISTS department text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at);

-- Enable realtime for complaints table
ALTER TABLE public.complaints REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;

-- Create or replace function to handle new complaint notifications
CREATE OR REPLACE FUNCTION public.notify_admin_new_complaint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user RECORD;
  user_data RECORD;
BEGIN
  -- Get user data from profiles or users table
  SELECT p.full_name, p.email, u.employee_id, u.department
  INTO user_data
  FROM profiles p
  LEFT JOIN users u ON p.id = u.user_id
  WHERE p.id = NEW.user_id;
  
  -- If no data in profiles, try to get from users table directly
  IF user_data IS NULL THEN
    SELECT full_name, employee_id, department
    INTO user_data
    FROM users
    WHERE user_id = NEW.user_id;
  END IF;
  
  -- Update complaint with user info if available
  IF user_data IS NOT NULL THEN
    UPDATE complaints 
    SET 
      full_name = COALESCE(user_data.full_name, full_name),
      email = COALESCE(user_data.email, email),
      employee_id = COALESCE(user_data.employee_id, employee_id),
      department = COALESCE(user_data.department, department)
    WHERE complaint_id = NEW.complaint_id;
  END IF;
  
  -- Notify all admins about new complaint
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
      complaint_id,
      metadata
    ) VALUES (
      admin_user.user_id,
      'New Complaint Received',
      'New complaint "' || NEW.title || '" from ' || COALESCE(user_data.full_name, 'Unknown User'),
      'complaint_created',
      NEW.complaint_id,
      jsonb_build_object(
        'priority', NEW.priority,
        'category', NEW.category,
        'employee_id', COALESCE(user_data.employee_id, 'N/A'),
        'department', COALESCE(user_data.department, 'N/A')
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new complaints
DROP TRIGGER IF EXISTS trigger_notify_admin_new_complaint ON public.complaints;
CREATE TRIGGER trigger_notify_admin_new_complaint
  AFTER INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_complaint();

-- Create or replace function to handle complaint status updates
CREATE OR REPLACE FUNCTION public.notify_complaint_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      complaint_id,
      metadata
    ) VALUES (
      NEW.user_id,
      'Complaint Status Updated',
      'Your complaint "' || NEW.title || '" status has been updated to "' || NEW.status || '"',
      'status_updated',
      NEW.complaint_id,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'priority', NEW.priority
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for complaint updates
DROP TRIGGER IF EXISTS trigger_notify_complaint_status_change ON public.complaints;
CREATE TRIGGER trigger_notify_complaint_status_change
  AFTER UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.notify_complaint_status_change();

-- Ensure RLS policies allow proper access
DROP POLICY IF EXISTS "Service role can manage complaints" ON public.complaints;
CREATE POLICY "Service role can manage complaints"
  ON public.complaints
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a view for admin dashboard that joins all necessary data
CREATE OR REPLACE VIEW public.admin_complaints_view AS
SELECT 
  c.*,
  COALESCE(c.full_name, p.full_name, u.full_name) as user_full_name,
  COALESCE(c.email, p.email) as user_email,
  COALESCE(c.employee_id, u.employee_id) as user_employee_id,
  COALESCE(c.department, u.department) as user_department,
  c.created_at as submission_time
FROM complaints c
LEFT JOIN profiles p ON c.user_id = p.id
LEFT JOIN users u ON c.user_id = u.user_id
ORDER BY c.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.admin_complaints_view TO authenticated;
GRANT SELECT ON public.admin_complaints_view TO service_role;
