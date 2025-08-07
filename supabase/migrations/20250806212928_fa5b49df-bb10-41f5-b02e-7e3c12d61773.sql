
-- Drop the existing function to recreate it with better error handling
DROP FUNCTION IF EXISTS public.accept_complaint(uuid, uuid);

-- Create an improved accept_complaint function
CREATE OR REPLACE FUNCTION public.accept_complaint(
    complaint_id_param UUID,
    admin_user_id UUID DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  complaint_record RECORD;
  user_record RECORD;
  affected_rows INTEGER;
BEGIN
  -- Get complaint details with user information
  SELECT 
    c.*,
    u.full_name,
    u.employee_id,
    u.department,
    p.email
  INTO complaint_record
  FROM complaints c
  LEFT JOIN users u ON c.user_id = u.user_id
  LEFT JOIN profiles p ON c.user_id = p.id
  WHERE c.complaint_id = complaint_id_param 
  AND c.status = 'Pending';
  
  -- Check if complaint exists and is pending
  IF complaint_record IS NULL THEN
    RAISE EXCEPTION 'Complaint not found or already processed';
  END IF;
  
  -- Update complaint status to Accepted
  UPDATE complaints 
  SET 
    status = 'Accepted',
    updated_at = NOW()
  WHERE complaint_id = complaint_id_param;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Verify the update was successful
  IF affected_rows = 0 THEN
    RAISE EXCEPTION 'Failed to update complaint status';
  END IF;
  
  -- Create notification for the user who submitted the complaint
  INSERT INTO notifications (
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
    complaint_record.user_id,
    'Complaint Accepted',
    'Your complaint titled "' || complaint_record.title || '" has been accepted by the admin team and is now being processed.',
    'complaint_accepted',
    complaint_record.complaint_id,
    jsonb_build_object(
      'complaint_title', complaint_record.title,
      'accepted_by_admin', COALESCE(admin_user_id::text, 'system'),
      'accepted_at', NOW(),
      'employee_id', complaint_record.employee_id,
      'department', complaint_record.department
    ),
    false,
    NOW(),
    NOW()
  );
  
  -- Log the action for audit purposes
  INSERT INTO analytics_events (
    event_type,
    user_id,
    complaint_id,
    metadata
  ) VALUES (
    'complaint_accepted',
    admin_user_id,
    complaint_record.complaint_id,
    jsonb_build_object(
      'complaint_title', complaint_record.title,
      'complaint_owner', complaint_record.user_id,
      'accepted_at', NOW()
    )
  );
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details for debugging
    RAISE LOG 'Error in accept_complaint: % %', SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.accept_complaint(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_complaint(UUID, UUID) TO service_role;
