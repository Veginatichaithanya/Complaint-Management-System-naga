
-- Create a function to accept a complaint and create notification
CREATE OR REPLACE FUNCTION accept_complaint(
  complaint_id_param UUID,
  admin_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  complaint_record RECORD;
  user_record RECORD;
BEGIN
  -- Get complaint details
  SELECT * INTO complaint_record 
  FROM complaints 
  WHERE complaint_id = complaint_id_param 
  AND status = 'Pending';
  
  IF complaint_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user details for the complaint owner
  SELECT u.full_name, u.employee_id, p.email, u.department
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
  
  -- Create notification for the user
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    complaint_id,
    metadata
  ) VALUES (
    complaint_record.user_id,
    'Complaint Accepted',
    'Your complaint titled "' || complaint_record.title || '" has been accepted by the admin.',
    'complaint_accepted',
    complaint_record.complaint_id,
    jsonb_build_object(
      'complaint_title', complaint_record.title,
      'accepted_by_admin', COALESCE(admin_user_id, 'system'),
      'accepted_at', NOW()
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Update the admin_complaints_with_users view to ensure it has all necessary user data
DROP VIEW IF EXISTS admin_complaints_with_users;

CREATE VIEW admin_complaints_with_users AS
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
  -- User details from users table
  u.full_name as user_full_name,
  u.employee_id as user_employee_id,
  u.department as user_department,
  -- Email from profiles table
  p.email as user_email,
  -- Fallback full name from profiles if not in users
  COALESCE(u.full_name, p.full_name) as profile_full_name
FROM complaints c
LEFT JOIN users u ON c.user_id = u.user_id
LEFT JOIN profiles p ON c.user_id = p.id;
