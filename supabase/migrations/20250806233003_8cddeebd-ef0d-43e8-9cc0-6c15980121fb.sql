-- Check current foreign key constraints on meetings table
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'meetings'
  AND tc.constraint_name = 'meetings_admin_id_fkey';

-- Check if admin_id values in meetings table exist in the referenced table
SELECT 
    m.admin_id,
    COUNT(*) as meeting_count,
    CASE 
        WHEN au.user_id IS NOT NULL THEN 'EXISTS in admin_users'
        WHEN ur.user_id IS NOT NULL THEN 'EXISTS in user_roles as admin'
        ELSE 'MISSING - needs to be fixed'
    END as admin_status
FROM meetings m
LEFT JOIN admin_users au ON m.admin_id = au.user_id
LEFT JOIN user_roles ur ON m.admin_id = ur.user_id AND ur.role = 'admin'
WHERE m.admin_id IS NOT NULL
GROUP BY m.admin_id, au.user_id, ur.user_id
ORDER BY admin_status;

-- Fix the foreign key constraint issue
-- Option 1: Drop the existing constraint and recreate it properly
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_admin_id_fkey;

-- Option 2: Add proper foreign key constraint to admin_users table
-- (This is likely where it should reference based on the schema)
ALTER TABLE meetings 
ADD CONSTRAINT meetings_admin_id_fkey 
FOREIGN KEY (admin_id) 
REFERENCES admin_users(user_id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Option 3: Ensure admin_id column can be null (for cases where no admin is assigned)
ALTER TABLE meetings ALTER COLUMN admin_id DROP NOT NULL;

-- Option 4: Insert missing admin users if needed
-- First, let's ensure any user with admin role has an entry in admin_users
INSERT INTO admin_users (user_id, role)
SELECT DISTINCT ur.user_id, 'admin'
FROM user_roles ur
WHERE ur.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = ur.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Option 5: For any meetings with admin_id that don't exist, set to null
UPDATE meetings 
SET admin_id = NULL 
WHERE admin_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = meetings.admin_id
  );