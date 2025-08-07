
-- Create user sessions table for real-time tracking
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  logout_time TIMESTAMP WITH TIME ZONE,
  session_duration INTEGER DEFAULT 0, -- in seconds
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user activity log table
CREATE TABLE public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  page_url TEXT,
  time_spent INTEGER DEFAULT 0, -- in seconds
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add account status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'deactivated', 'suspended'));

-- Add role information to profiles
ALTER TABLE public.profiles 
ADD COLUMN role_type TEXT DEFAULT 'employee' CHECK (role_type IN ('employee', 'admin', 'support'));

-- Create real-time notifications table for admin
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sessions
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON public.user_sessions
  FOR ALL TO authenticated
  USING (true);

-- RLS policies for user_activity_log
CREATE POLICY "Admins can view all activity" ON public.user_activity_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can log activity" ON public.user_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS policies for admin_notifications
CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_sessions 
  SET 
    last_activity = now(),
    session_duration = EXTRACT(EPOCH FROM (now() - login_time))::INTEGER,
    updated_at = now()
  WHERE user_id = NEW.user_id AND is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session on activity
CREATE TRIGGER update_session_on_activity
  AFTER INSERT ON public.user_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Function to create admin notifications
CREATE OR REPLACE FUNCTION create_admin_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New complaint notification
    IF TG_TABLE_NAME = 'complaints' THEN
      INSERT INTO public.admin_notifications (
        notification_type,
        title,
        message,
        user_id,
        metadata
      ) VALUES (
        'new_complaint',
        'New Complaint Received',
        'New complaint "' || NEW.title || '" from ' || (SELECT email FROM profiles WHERE id = NEW.user_id),
        NEW.user_id,
        jsonb_build_object('complaint_id', NEW.id, 'priority', NEW.priority, 'category', NEW.category)
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for complaint notifications
CREATE TRIGGER admin_notification_on_complaint
  AFTER INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_notification();

-- Enable realtime for admin dashboard tables
ALTER TABLE public.user_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.user_activity_log REPLICA IDENTITY FULL;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
