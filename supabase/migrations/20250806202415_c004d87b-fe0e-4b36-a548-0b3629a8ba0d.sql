
-- First, let's ensure we have the proper structure for complaints with user associations
-- and add any missing columns for comprehensive ticket management

-- Add missing columns to complaints table if they don't exist
DO $$ 
BEGIN
    -- Add ai_resolved column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'complaints' AND column_name = 'ai_resolved') THEN
        ALTER TABLE complaints ADD COLUMN ai_resolved BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Ensure proper indexes for performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_complaints_user_id') THEN
        CREATE INDEX idx_complaints_user_id ON complaints(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_complaints_status') THEN
        CREATE INDEX idx_complaints_status ON complaints(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_complaints_created_at') THEN
        CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);
    END IF;
END $$;

-- Create a comprehensive view for admin dashboard with all user details
CREATE OR REPLACE VIEW admin_complaints_with_users AS
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
    -- User information from profiles table (auth)
    p.email as user_email,
    p.full_name as profile_full_name
FROM complaints c
LEFT JOIN users u ON c.user_id = u.user_id
LEFT JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC;

-- Create a function to get pending complaints count for notification badges
CREATE OR REPLACE FUNCTION get_pending_complaints_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM complaints 
        WHERE status = 'Pending'
    );
END;
$$;

-- Create a function to get user's complaints with full details
CREATE OR REPLACE FUNCTION get_user_complaints(target_user_id UUID)
RETURNS TABLE (
    complaint_id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    priority TEXT,
    status TEXT,
    attachment TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    ai_resolved BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.complaint_id,
        c.title,
        c.description,
        c.category,
        c.priority,
        c.status,
        c.attachment,
        c.created_at,
        c.updated_at,
        c.ai_resolved
    FROM complaints c
    WHERE c.user_id = target_user_id
    ORDER BY c.created_at DESC;
END;
$$;

-- Create a function to update complaint status with proper notifications
CREATE OR REPLACE FUNCTION update_complaint_status(
    target_complaint_id UUID,
    new_status TEXT,
    admin_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    complaint_record RECORD;
    affected_rows INTEGER;
BEGIN
    -- Get complaint details
    SELECT * INTO complaint_record 
    FROM complaints 
    WHERE complaint_id = target_complaint_id;
    
    IF complaint_record IS NULL THEN
        RETURN FALSE;
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
                'updated_by_admin', admin_user_id IS NOT NULL
            )
        );
    END IF;
    
    RETURN affected_rows > 0;
END;
$$;

-- Enable realtime for complaints table
ALTER TABLE complaints REPLICA IDENTITY FULL;

-- Add complaints to realtime publication if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'complaints'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT ON admin_complaints_with_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_complaints_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_complaints(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_complaint_status(UUID, TEXT, UUID) TO authenticated;
