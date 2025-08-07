
-- Create a function to safely delete complaints (admin only)
CREATE OR REPLACE FUNCTION public.delete_complaint_permanently(
    complaint_id_param UUID,
    admin_user_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    complaint_record RECORD;
    affected_rows INTEGER;
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = admin_user_id 
        AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
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
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.delete_complaint_permanently(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_complaint_permanently(UUID, UUID) TO service_role;

-- Fix the accept_complaint function to handle edge cases better
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
$$;
