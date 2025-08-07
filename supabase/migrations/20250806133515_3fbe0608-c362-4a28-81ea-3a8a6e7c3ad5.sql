
-- Fix the infinite recursion in admin_users policies by dropping and recreating them properly
DROP POLICY IF EXISTS "Admin users can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

-- Create non-recursive policies for admin_users
CREATE POLICY "Allow admin users to view admin users" 
  ON admin_users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Allow admin users to manage admin users" 
  ON admin_users 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Ensure the complaints table has proper policies that don't reference admin_users
DROP POLICY IF EXISTS "Users can view their own complaints" ON complaints;
DROP POLICY IF EXISTS "Users can create complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON complaints;

CREATE POLICY "Users can view their own complaints" 
  ON complaints 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create complaints" 
  ON complaints 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and agents can view all complaints" 
  ON complaints 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'agent')
    )
  );

CREATE POLICY "Admins and agents can update complaints" 
  ON complaints 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'agent')
    )
  );

-- Ensure tickets table has proper policies
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view their complaint tickets" ON tickets;

CREATE POLICY "Users can view their complaint tickets" 
  ON tickets 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM complaints c 
      WHERE c.id = tickets.complaint_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and agents can view all tickets" 
  ON tickets 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'agent')
    )
  );
