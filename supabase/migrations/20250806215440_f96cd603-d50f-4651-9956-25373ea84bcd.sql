
-- First, let's check and fix the notifications table constraint
-- Drop the existing constraint if it's too restrictive
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add a more comprehensive constraint that includes all valid notification types
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'complaint_created',
  'complaint_accepted', 
  'status_updated',
  'response_received',
  'meeting_scheduled',
  'assignment_made',
  'info',
  'success',
  'warning',
  'error'
));

-- Update the accept_complaint function to handle errors better
CREATE OR REPLACE FUNCTION public.accept_complaint(complaint_id_param uuid, admin_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    complaint_record RECORD;
    affected_rows INTEGER;
BEGIN
    -- Get complaint details with user information
    SELECT 
        c.*,
        u.full_name as user_full_name,
        u.employee_id,
        u.department,
        p.email as user_email
    INTO complaint_record
    FROM complaints c
    LEFT JOIN users u ON c.user_id = u.user_id
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.complaint_id = complaint_id_param;
    
    -- Check if complaint exists
    IF complaint_record IS NULL THEN
        RAISE EXCEPTION 'Complaint not found';
    END IF;
    
    -- Check if complaint is already processed
    IF complaint_record.status != 'Pending' THEN
        RAISE EXCEPTION 'Complaint has already been processed (current status: %)', complaint_record.status;
    END IF;
    
    -- Update complaint status to Accepted
    UPDATE complaints 
    SET 
        status = 'Accepted',
        updated_at = NOW()
    WHERE complaint_id = complaint_id_param
    AND status = 'Pending';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Verify the update was successful
    IF affected_rows = 0 THEN
        RAISE EXCEPTION 'Failed to update complaint status - complaint may have been processed by another admin';
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
        RAISE LOG 'Error in accept_complaint: % %', SQLERRM, SQLSTATE;
        RETURN FALSE;
END;
$function$;

-- Update the delete_complaint_permanently function to be more permissive for admins
CREATE OR REPLACE FUNCTION public.delete_complaint_permanently(complaint_id_param uuid, admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    complaint_record RECORD;
    affected_rows INTEGER;
BEGIN
    -- Verify admin permissions - allow both admin and agent roles
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = admin_user_id 
        AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    ) AND NOT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = admin_user_id
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to delete complaints';
    END IF;

    -- Get complaint details before deletion
    SELECT * INTO complaint_record
    FROM complaints 
    WHERE complaint_id = complaint_id_param;
    
    IF complaint_record IS NULL THEN
        RAISE EXCEPTION 'Complaint not found';
    END IF;
    
    -- Delete related records first (to avoid foreign key conflicts)
    DELETE FROM notifications WHERE complaint_id = complaint_id_param;
    DELETE FROM chat_messages WHERE complaint_id = complaint_id_param;
    DELETE FROM feedback WHERE complaint_id = complaint_id_param;
    DELETE FROM analytics_events WHERE complaint_id = complaint_id_param;
    DELETE FROM meetings WHERE complaint_id = complaint_id_param;
    DELETE FROM tickets WHERE complaint_id = complaint_id_param;
    
    -- Delete the complaint
    DELETE FROM complaints WHERE complaint_id = complaint_id_param;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        RAISE EXCEPTION 'Failed to delete complaint';
    END IF;
    
    -- Log the deletion for audit purposes
    INSERT INTO analytics_events (
        event_type,
        user_id,
        metadata
    ) VALUES (
        'complaint_deleted',
        admin_user_id,
        jsonb_build_object(
            'deleted_complaint_id', complaint_id_param,
            'complaint_title', complaint_record.title,
            'original_user_id', complaint_record.user_id,
            'deleted_at', NOW(),
            'deleted_by', admin_user_id
        )
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in delete_complaint_permanently: % %', SQLERRM, SQLSTATE;
        RETURN FALSE;
END;
$function$;

-- Create a function to ensure admin permissions are properly set
CREATE OR REPLACE FUNCTION public.ensure_admin_permissions(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Insert admin role if it doesn't exist
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Insert admin user record if it doesn't exist
    INSERT INTO admin_users (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN TRUE;
END;
$function$;
