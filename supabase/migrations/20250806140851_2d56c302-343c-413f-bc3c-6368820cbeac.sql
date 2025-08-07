
-- Fix the recursive RLS policy issue on admin_users table
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Create non-recursive policies for admin_users
CREATE POLICY "Admins can view all admin users" ON admin_users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

CREATE POLICY "Super admins can manage admin users" ON admin_users 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::user_role
    )
  );

-- Fix notifications policies to avoid recursion
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;

CREATE POLICY "Admins can view all notifications" ON notifications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

-- Fix complaints policies to avoid recursion  
DROP POLICY IF EXISTS "Admins and agents can view all complaints" ON complaints;

CREATE POLICY "Admins and agents can view all complaints" ON complaints 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

-- Enable realtime for all relevant tables
ALTER TABLE complaints REPLICA IDENTITY FULL;
ALTER TABLE tickets REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE admin_notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- Create triggers for real-time notifications
DROP TRIGGER IF EXISTS complaint_notification_trigger ON complaints;
CREATE TRIGGER complaint_notification_trigger
  AFTER INSERT OR UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION create_complaint_notification();

DROP TRIGGER IF EXISTS admin_notification_trigger ON complaints;  
CREATE TRIGGER admin_notification_trigger
  AFTER INSERT ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_notification();

DROP TRIGGER IF EXISTS ticket_notification_trigger ON tickets;
CREATE TRIGGER ticket_notification_trigger
  AFTER INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_ticket_notification();

-- Ensure the admin user exists (add admin@gmail.com as admin)
INSERT INTO user_roles (user_id, role) 
SELECT auth.uid(), 'admin'::user_role
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::user_role
);
