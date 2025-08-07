
-- First, let's check if we need to add any missing columns or constraints to the meetings table
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS invited_user_id uuid REFERENCES auth.users(id);

-- Ensure we have proper indexing for performance
CREATE INDEX IF NOT EXISTS idx_meetings_invited_user_id ON meetings(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_schedule_time ON meetings(schedule_time);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- Create a function to validate user exists before scheduling meeting
CREATE OR REPLACE FUNCTION validate_and_schedule_meeting(
  p_complaint_id uuid DEFAULT NULL,
  p_admin_id uuid DEFAULT NULL,
  p_invited_user_email text,
  p_title text,
  p_description text DEFAULT NULL,
  p_meet_link text,
  p_schedule_time timestamp without time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  validated_user_id uuid;
  new_meeting_id uuid;
  result jsonb;
BEGIN
  -- First check profiles table
  SELECT id INTO validated_user_id
  FROM profiles
  WHERE email = LOWER(TRIM(p_invited_user_email))
  LIMIT 1;
  
  -- If not found in profiles, check users table via profiles join
  IF validated_user_id IS NULL THEN
    SELECT u.user_id INTO validated_user_id
    FROM users u
    INNER JOIN profiles p ON u.user_id = p.id
    WHERE p.email = LOWER(TRIM(p_invited_user_email))
    LIMIT 1;
  END IF;
  
  -- If user doesn't exist, return error
  IF validated_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User does not exist in the system',
      'message', 'Please ensure the email address belongs to a registered user'
    );
  END IF;
  
  -- Create the meeting
  INSERT INTO meetings (
    complaint_id,
    admin_id,
    invited_user_id,
    title,
    description,
    meet_link,
    schedule_time,
    status
  ) VALUES (
    p_complaint_id,
    p_admin_id,
    validated_user_id,
    p_title,
    p_description,
    p_meet_link,
    p_schedule_time,
    'scheduled'
  )
  RETURNING meeting_id INTO new_meeting_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'meeting_id', new_meeting_id,
    'invited_user_id', validated_user_id,
    'message', 'Meeting scheduled successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to schedule meeting due to database error'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION validate_and_schedule_meeting TO authenticated;

-- Create RLS policy to allow admins to use this function
CREATE POLICY IF NOT EXISTS "Admins can schedule meetings via function" ON meetings
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
  )
);
