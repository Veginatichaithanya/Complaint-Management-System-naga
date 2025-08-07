
-- Fix the accept_complaint function with proper complaint ID reference
CREATE OR REPLACE FUNCTION public.accept_complaint(complaint_id_param uuid, admin_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  complaint_record RECORD;
  user_record RECORD;
  notification_id uuid;
BEGIN
  -- Get complaint details with proper column name
  SELECT * INTO complaint_record 
  FROM complaints 
  WHERE complaint_id = complaint_id_param 
  AND status = 'Pending';
  
  IF complaint_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user details for the complaint owner from both users and profiles tables
  SELECT 
    u.full_name as user_full_name, 
    u.employee_id, 
    u.department,
    p.email,
    p.full_name as profile_full_name
  INTO user_record
  FROM users u
  LEFT JOIN profiles p ON u.user_id = p.id
  WHERE u.user_id = complaint_record.user_id;
  
  -- Update complaint status to Accepted
  UPDATE complaints 
  SET 
    status = 'Accepted',
    updated_at = NOW()
  WHERE complaint_id = complaint_id_param;
  
  -- Create notification for the user with better error handling
  INSERT INTO notifications (
    id,
    user_id,
    title,
    message,
    type,
    complaint_id,
    metadata,
    read,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    complaint_record.user_id,
    'Complaint Accepted',
    'Great news! Your complaint titled "' || complaint_record.title || '" has been accepted by our admin team and is now being processed.',
    'complaint_accepted',
    complaint_record.complaint_id,
    jsonb_build_object(
      'complaint_title', complaint_record.title,
      'accepted_by_admin', COALESCE(admin_user_id::text, 'system'),
      'accepted_at', NOW()::text,
      'user_name', COALESCE(user_record.user_full_name, user_record.profile_full_name, 'User'),
      'employee_id', COALESCE(user_record.employee_id, 'N/A')
    ),
    false,
    NOW(),
    NOW()
  ) RETURNING id INTO notification_id;
  
  -- Log the notification creation for debugging
  INSERT INTO notification_logs (
    type,
    recipient,
    subject,
    content,
    status,
    metadata
  ) VALUES (
    'complaint_accepted',
    COALESCE(user_record.email, 'unknown@example.com'),
    'Complaint Accepted',
    'Your complaint "' || complaint_record.title || '" has been accepted.',
    'sent',
    jsonb_build_object(
      'complaint_id', complaint_record.complaint_id,
      'notification_id', notification_id,
      'user_id', complaint_record.user_id
    )
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    INSERT INTO notification_logs (
      type,
      recipient,
      subject,
      content,
      status,
      metadata
    ) VALUES (
      'complaint_accepted_error',
      'system',
      'Error in accept_complaint function',
      'Error: ' || SQLERRM,
      'failed',
      jsonb_build_object(
        'complaint_id', complaint_id_param,
        'error_message', SQLERRM,
        'error_state', SQLSTATE
      )
    );
    
    RETURN FALSE;
END;
$$;

-- Create an optimized view for admin complaints with user data
CREATE OR REPLACE VIEW public.admin_complaints_with_users AS
SELECT 
    c.complaint_id,
    c.user_id,
    c.title,
    c.description,
    c.category,
    c.priority,
    c.status,
    c.attachment,
    c.created_at,
    c.updated_at,
    c.ai_resolved,
    -- User information from users table
    u.full_name as user_full_name,
    u.employee_id as user_employee_id,
    u.department as user_department,
    -- User information from profiles table as fallback
    p.email as user_email,
    p.full_name as profile_full_name
FROM complaints c
LEFT JOIN users u ON c.user_id = u.user_id
LEFT JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC;

-- Ensure proper RLS policy for the view
DROP POLICY IF EXISTS "Admins can view complaint details" ON admin_complaints_with_users;
CREATE POLICY "Admins can view complaint details" ON admin_complaints_with_users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_status_created ON complaints(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
