
-- Drop existing tables and recreate with the new schema
DROP TABLE IF EXISTS meetings, feedback, complaints, users, admins CASCADE;

-- Create users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  department TEXT,
  total_complaints INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own data
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Create policy for users to update their own data
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create policy for users to insert their own data
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Create complaints table
CREATE TABLE complaints (
  complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on complaints table
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Create policies for complaints
CREATE POLICY "Users can view their own complaints" ON complaints
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create complaints" ON complaints
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own pending complaints" ON complaints
  FOR UPDATE USING (auth.uid()::text = user_id::text AND status IN ('Pending', 'Accepted'));

CREATE POLICY "Admins can view all complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

CREATE POLICY "Admins can update all complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

-- Create admins table
CREATE TABLE admins (
  admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin data" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

-- Create meetings table
CREATE TABLE meetings (
  meeting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(admin_id),
  meet_link TEXT NOT NULL,
  schedule_time TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on meetings table
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meetings for their complaints" ON meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM complaints 
      WHERE complaints.complaint_id = meetings.complaint_id 
      AND complaints.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all meetings" ON meetings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

-- Create feedback table
CREATE TABLE feedback (
  feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on feedback table
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create feedback for their complaints" ON feedback
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text AND
    EXISTS (
      SELECT 1 FROM complaints 
      WHERE complaints.complaint_id = feedback.complaint_id 
      AND complaints.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    )
  );

-- Create trigger function to increment complaint count
CREATE OR REPLACE FUNCTION increment_complaint_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET total_complaints = total_complaints + 1,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment complaint count on insert
CREATE TRIGGER trigger_increment_complaints
AFTER INSERT ON complaints
FOR EACH ROW
EXECUTE FUNCTION increment_complaint_count();

-- Create trigger function to decrement complaint count on delete
CREATE OR REPLACE FUNCTION decrement_complaint_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET total_complaints = GREATEST(total_complaints - 1, 0),
      updated_at = NOW()
  WHERE user_id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to decrement complaint count on delete
CREATE TRIGGER trigger_decrement_complaints
AFTER DELETE ON complaints
FOR EACH ROW
EXECUTE FUNCTION decrement_complaint_count();

-- Create notification trigger for new complaints
CREATE OR REPLACE FUNCTION notify_new_complaint()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  user_data RECORD;
BEGIN
  -- Get user data
  SELECT * INTO user_data FROM users WHERE user_id = NEW.user_id;
  
  -- Notify all admins about new complaint
  FOR admin_user IN 
    SELECT DISTINCT ur.user_id 
    FROM user_roles ur 
    WHERE ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
  LOOP
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      metadata
    ) VALUES (
      admin_user.user_id,
      'New Complaint Received',
      'New complaint "' || NEW.title || '" from ' || user_data.full_name || ' (' || user_data.employee_id || ')',
      'complaint_created',
      jsonb_build_object(
        'complaint_id', NEW.complaint_id,
        'priority', NEW.priority,
        'category', NEW.category,
        'employee_id', user_data.employee_id,
        'department', user_data.department
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for complaint notifications
CREATE TRIGGER trigger_notify_complaint
AFTER INSERT ON complaints
FOR EACH ROW
EXECUTE FUNCTION notify_new_complaint();

-- Create notification trigger for status updates
CREATE OR REPLACE FUNCTION notify_complaint_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      metadata
    ) VALUES (
      NEW.user_id,
      'Complaint Status Updated',
      'Your complaint "' || NEW.title || '" status has been updated to "' || NEW.status || '"',
      'status_updated',
      jsonb_build_object(
        'complaint_id', NEW.complaint_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status update notifications
CREATE TRIGGER trigger_notify_status_update
AFTER UPDATE ON complaints
FOR EACH ROW
EXECUTE FUNCTION notify_complaint_status_update();

-- Create notification trigger for meetings
CREATE OR REPLACE FUNCTION notify_meeting_scheduled()
RETURNS TRIGGER AS $$
DECLARE
  complaint_data RECORD;
BEGIN
  -- Get complaint and user data
  SELECT c.*, u.full_name, u.employee_id 
  INTO complaint_data 
  FROM complaints c
  JOIN users u ON c.user_id = u.user_id
  WHERE c.complaint_id = NEW.complaint_id;
  
  -- Notify user about scheduled meeting
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    metadata
  ) VALUES (
    complaint_data.user_id,
    'Google Meet Scheduled',
    'A Google Meet has been scheduled for your complaint "' || complaint_data.title || '" on ' || 
    TO_CHAR(NEW.schedule_time, 'DD-MM-YYYY at HH24:MI'),
    'meeting_scheduled',
    jsonb_build_object(
      'complaint_id', NEW.complaint_id,
      'meeting_id', NEW.meeting_id,
      'meet_link', NEW.meet_link,
      'schedule_time', NEW.schedule_time
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for meeting notifications
CREATE TRIGGER trigger_notify_meeting
AFTER INSERT ON meetings
FOR EACH ROW
EXECUTE FUNCTION notify_meeting_scheduled();

-- Enable realtime for all tables
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE complaints REPLICA IDENTITY FULL;
ALTER TABLE meetings REPLICA IDENTITY FULL;
ALTER TABLE feedback REPLICA IDENTITY FULL;
ALTER TABLE admins REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE admins;
