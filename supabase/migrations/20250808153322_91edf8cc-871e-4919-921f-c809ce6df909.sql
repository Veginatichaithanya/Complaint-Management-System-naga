
-- 1. Fix RLS policies for user_sessions table
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;

-- Create more restrictive policies for user_sessions
CREATE POLICY "Service role can manage sessions" ON public.user_sessions
FOR ALL USING (
    (auth.jwt() ->> 'role'::text) = 'service_role'::text
);

CREATE POLICY "Users can view own sessions" ON public.user_sessions
FOR SELECT USING (
    auth.uid() = user_id
);

-- 2. Fix RLS policies for admin_notifications table
DROP POLICY IF EXISTS "Authenticated users can view admin notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Authenticated users can update admin notifications" ON public.admin_notifications;

-- Replace with admin-only policies
CREATE POLICY "Admins can view admin notifications" ON public.admin_notifications
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
);

CREATE POLICY "Admins can update admin notifications" ON public.admin_notifications
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
);

-- 3. Fix RLS policies for profiles table - remove public access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- 4. Add authorization checks to SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.ensure_admin_permissions(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only allow service role or super admin users
    IF NOT (
        (auth.jwt() ->> 'role'::text) = 'service_role'::text OR
        is_user_super_admin(auth.uid()) = true
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to modify admin permissions';
    END IF;
    
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
$$;

CREATE OR REPLACE FUNCTION public.accept_complaint(complaint_id_param uuid, admin_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    complaint_record RECORD;
    affected_rows INTEGER;
BEGIN
    -- Verify admin permissions first
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = COALESCE(admin_user_id, auth.uid())
        AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to accept complaints';
    END IF;

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
            'accepted_by_admin', COALESCE(admin_user_id::text, auth.uid()::text),
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
        COALESCE(admin_user_id, auth.uid()),
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

CREATE OR REPLACE FUNCTION public.update_complaint_status(target_complaint_id uuid, new_status text, admin_user_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    complaint_record RECORD;
    affected_rows INTEGER;
    calling_user_id uuid;
BEGIN
    calling_user_id := COALESCE(admin_user_id, auth.uid());
    
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = calling_user_id
        AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to update complaint status';
    END IF;

    -- Get complaint details
    SELECT * INTO complaint_record 
    FROM complaints 
    WHERE complaint_id = target_complaint_id;
    
    IF complaint_record IS NULL THEN
        RAISE EXCEPTION 'Complaint not found';
    END IF;
    
    -- Update the complaint status
    UPDATE complaints 
    SET 
        status = new_status,
        updated_at = NOW()
    WHERE complaint_id = target_complaint_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Create notification for the user
    IF affected_rows > 0 THEN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            complaint_id,
            metadata
        ) VALUES (
            complaint_record.user_id,
            'Complaint Status Updated',
            'Your complaint "' || complaint_record.title || '" status has been updated to "' || new_status || '".',
            'status_updated',
            target_complaint_id,
            jsonb_build_object(
                'old_status', complaint_record.status,
                'new_status', new_status,
                'updated_by_admin', calling_user_id
            )
        );
    END IF;
    
    RETURN affected_rows > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_emoji_feedback(rating_emoji text, description_text text DEFAULT NULL::text, request_id_param uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rating_value INTEGER;
  feedback_id UUID;
  user_id_param UUID;
BEGIN
  -- Get user ID from auth context instead of parameter
  user_id_param := auth.uid();
  
  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to submit feedback';
  END IF;
  
  -- Convert emoji rating to numeric value
  CASE rating_emoji
    WHEN 'good' THEN rating_value := 5;
    WHEN 'bad' THEN rating_value := 3;
    WHEN 'worst' THEN rating_value := 1;
    ELSE rating_value := 3; -- default to neutral
  END CASE;
  
  -- Insert feedback
  INSERT INTO feedback (
    user_id,
    rating,
    comments,
    request_id,
    feedback_type
  ) VALUES (
    user_id_param,
    rating_value,
    description_text,
    request_id_param,
    'emoji_feedback'
  ) RETURNING feedback_id INTO feedback_id;
  
  -- Mark request as completed if it exists
  IF request_id_param IS NOT NULL THEN
    UPDATE feedback_requests 
    SET status = 'completed' 
    WHERE id = request_id_param;
  END IF;
  
  -- Create admin notification
  INSERT INTO admin_notifications (
    notification_type,
    title,
    message,
    user_id,
    metadata
  ) VALUES (
    'emoji_feedback_received',
    'Emoji Feedback Received',
    'User submitted emoji feedback with rating: ' || rating_emoji,
    user_id_param,
    jsonb_build_object(
      'feedback_id', feedback_id,
      'rating_emoji', rating_emoji,
      'rating_value', rating_value,
      'has_description', description_text IS NOT NULL,
      'request_id', request_id_param
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'feedback_id', feedback_id,
    'message', 'Feedback submitted successfully'
  );
END;
$$;

-- 5. Make complaint-attachments bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'complaint-attachments';

-- 6. Add search_path to remaining SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.delete_complaint_permanently(complaint_id_param uuid, admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- 7. Add RLS policies for storage.objects to control file access
CREATE POLICY "Users can upload their own complaint attachments" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'complaint-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own complaint attachments" ON storage.objects
FOR SELECT USING (
    bucket_id = 'complaint-attachments' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
        )
    )
);

CREATE POLICY "Admins can view all complaint attachments" ON storage.objects
FOR SELECT USING (
    bucket_id = 'complaint-attachments' AND
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
);
