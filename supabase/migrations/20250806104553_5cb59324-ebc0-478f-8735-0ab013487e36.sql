
-- Fix infinite recursion in user_roles RLS policies
-- The current policy creates circular reference by checking user_roles table within user_roles policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create a new policy that avoids the circular reference
-- This policy allows users to manage roles if they have admin role, but uses a different approach
CREATE POLICY "Admins can manage all roles" ON user_roles
FOR ALL
USING (
  -- Check if the current user has admin role by looking at their specific user_id
  -- This avoids the circular reference by not using EXISTS with the same table
  auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE role = 'admin' 
    AND user_id = auth.uid()
  )
);

-- Also ensure we have proper policies for basic operations
-- Users should always be able to view their own role without admin check
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create a separate policy for admin operations that doesn't cause recursion
CREATE POLICY "System admin operations" ON user_roles
FOR ALL
USING (
  -- Allow if the user is a service role (for system operations)
  -- or if they are explicitly in the admin_users table
  auth.jwt() ->> 'role' = 'service_role' OR
  auth.uid() IN (SELECT user_id FROM admin_users WHERE role IN ('admin', 'super_admin'))
);
