
-- Create admin_users table for admin authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create ticket_assignments table for agent assignments
CREATE TABLE public.ticket_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ticket_id)
);

-- Create admin_settings table for system configuration
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_logs table for tracking notifications
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'email', 'sms', 'push'
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics_events table for tracking system events
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'complaint_created', 'ticket_resolved', 'ai_resolution', etc.
  user_id UUID REFERENCES auth.users(id),
  complaint_id UUID REFERENCES public.complaints(id),
  ticket_id UUID REFERENCES public.tickets(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admins can view all admin users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage admin users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'super_admin'
    )
  );

-- RLS Policies for ticket_assignments
CREATE POLICY "Admins and agents can view assignments" ON public.ticket_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'agent')
    )
  );

CREATE POLICY "Admins and agents can manage assignments" ON public.ticket_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'agent')
    )
  );

-- RLS Policies for admin_settings
CREATE POLICY "Admins can view settings" ON public.admin_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage settings" ON public.admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- RLS Policies for notification_logs
CREATE POLICY "Admins can view notification logs" ON public.notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'agent')
    )
  );

CREATE POLICY "System can insert notification logs" ON public.notification_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for analytics_events
CREATE POLICY "Admins can view analytics events" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'agent')
    )
  );

CREATE POLICY "System can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('chatbot_greeting', '{"message": "Hello! I''m here to help you with your complaint. Please describe your issue."}', 'Default chatbot greeting message'),
  ('sla_response_time', '{"hours": 24}', 'SLA response time in hours'),
  ('maintenance_mode', '{"enabled": false, "message": "System is under maintenance. Please try again later."}', 'Maintenance mode settings'),
  ('notification_settings', '{"email_enabled": true, "sms_enabled": false, "push_enabled": true}', 'Notification preferences'),
  ('escalation_rules', '{"high_priority_hours": 2, "medium_priority_hours": 12, "low_priority_hours": 48}', 'Automatic escalation rules');

-- Create function to track analytics events
CREATE OR REPLACE FUNCTION public.track_analytics_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.analytics_events (event_type, user_id, complaint_id, ticket_id, metadata)
    VALUES (
      CASE 
        WHEN TG_TABLE_NAME = 'complaints' THEN 'complaint_created'
        WHEN TG_TABLE_NAME = 'tickets' THEN 'ticket_created'
        ELSE 'unknown_event'
      END,
      COALESCE(NEW.user_id, NEW.assigned_to),
      CASE WHEN TG_TABLE_NAME = 'complaints' THEN NEW.id ELSE NEW.complaint_id END,
      CASE WHEN TG_TABLE_NAME = 'tickets' THEN NEW.id ELSE NULL END,
      jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for analytics tracking
CREATE TRIGGER track_complaint_events
  AFTER INSERT OR UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.track_analytics_event();

CREATE TRIGGER track_ticket_events  
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.track_analytics_event();

-- Create function to get dashboard metrics
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
  total_complaints INTEGER;
  active_tickets INTEGER;
  resolved_tickets INTEGER;
  pending_tickets INTEGER;
  ai_resolved_complaints INTEGER;
  result JSONB;
BEGIN
  -- Get total complaints
  SELECT COUNT(*) INTO total_complaints FROM public.complaints;
  
  -- Get ticket counts
  SELECT COUNT(*) INTO active_tickets 
  FROM public.tickets 
  WHERE status IN ('open', 'in_progress');
  
  SELECT COUNT(*) INTO resolved_tickets 
  FROM public.tickets 
  WHERE status = 'resolved';
  
  SELECT COUNT(*) INTO pending_tickets 
  FROM public.tickets 
  WHERE status = 'open';
  
  -- Get AI resolved complaints
  SELECT COUNT(*) INTO ai_resolved_complaints 
  FROM public.complaints 
  WHERE ai_resolved = true;
  
  -- Build result
  result := jsonb_build_object(
    'total_complaints', total_complaints,
    'active_tickets', active_tickets,
    'resolved_tickets', resolved_tickets,
    'pending_tickets', pending_tickets,
    'ai_resolved_complaints', ai_resolved_complaints,
    'resolution_rate', 
    CASE 
      WHEN total_complaints > 0 THEN 
        ROUND((resolved_tickets::DECIMAL / total_complaints::DECIMAL) * 100, 2)
      ELSE 0 
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at columns
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
