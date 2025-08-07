-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('complaint_created', 'status_updated', 'assignment_made', 'response_received', 'info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT false,
  complaint_id UUID REFERENCES public.complaints(id),
  ticket_id UUID REFERENCES public.tickets(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
  ));

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notifications for complaint events
CREATE OR REPLACE FUNCTION public.create_complaint_notification()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  complaint_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get complaint user_id
    complaint_user_id := NEW.user_id;
    
    -- Notify all admins and agents about new complaint
    FOR admin_user IN 
      SELECT DISTINCT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        complaint_id,
        metadata
      ) VALUES (
        admin_user.user_id,
        'New Complaint Received',
        'A new complaint "' || NEW.title || '" has been submitted and requires attention.',
        'complaint_created',
        NEW.id,
        jsonb_build_object('priority', NEW.priority, 'category', NEW.category)
      );
    END LOOP;

  ELSIF TG_OP = 'UPDATE' THEN
    complaint_user_id := NEW.user_id;
    
    -- Check if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        complaint_id,
        metadata
      ) VALUES (
        complaint_user_id,
        'Complaint Status Updated',
        'Your complaint "' || NEW.title || '" status has been updated to "' || NEW.status || '".',
        'status_updated',
        NEW.id,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications for ticket events
CREATE OR REPLACE FUNCTION public.create_ticket_notification()
RETURNS TRIGGER AS $$
DECLARE
  complaint_record RECORD;
  assigned_user_id UUID;
BEGIN
  -- Get complaint details
  SELECT c.*, p.full_name, p.email 
  INTO complaint_record 
  FROM complaints c
  LEFT JOIN profiles p ON c.user_id = p.id
  WHERE c.id = NEW.complaint_id;

  IF TG_OP = 'INSERT' THEN
    -- Notify user that ticket was created
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      complaint_id,
      ticket_id,
      metadata
    ) VALUES (
      complaint_record.user_id,
      'Support Ticket Created',
      'A support ticket #' || NEW.ticket_number || ' has been created for your complaint "' || complaint_record.title || '".',
      'info',
      NEW.complaint_id,
      NEW.id,
      jsonb_build_object('ticket_number', NEW.ticket_number)
    );

  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if assignment changed
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      assigned_user_id := NEW.assigned_to;
      
      -- Notify assigned user
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        complaint_id,
        ticket_id,
        metadata
      ) VALUES (
        assigned_user_id,
        'Ticket Assigned to You',
        'Ticket #' || NEW.ticket_number || ' for complaint "' || complaint_record.title || '" has been assigned to you.',
        'assignment_made',
        NEW.complaint_id,
        NEW.id,
        jsonb_build_object('ticket_number', NEW.ticket_number, 'priority', complaint_record.priority)
      );

      -- Notify complaint owner about assignment
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        complaint_id,
        ticket_id,
        metadata
      ) VALUES (
        complaint_record.user_id,
        'Support Engineer Assigned',
        'A support engineer has been assigned to your ticket #' || NEW.ticket_number || '.',
        'info',
        NEW.complaint_id,
        NEW.id,
        jsonb_build_object('ticket_number', NEW.ticket_number)
      );
    END IF;

    -- Check if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        complaint_id,
        ticket_id,
        metadata
      ) VALUES (
        complaint_record.user_id,
        'Ticket Status Updated',
        'Your ticket #' || NEW.ticket_number || ' status has been updated to "' || NEW.status || '".',
        CASE 
          WHEN NEW.status = 'resolved' THEN 'success'
          WHEN NEW.status = 'in_progress' THEN 'info'
          ELSE 'info'
        END,
        NEW.complaint_id,
        NEW.id,
        jsonb_build_object('ticket_number', NEW.ticket_number, 'old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications for chat messages
CREATE OR REPLACE FUNCTION public.create_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
  complaint_record RECORD;
  target_user_id UUID;
BEGIN
  -- Get complaint details
  SELECT c.*, p.full_name, p.email 
  INTO complaint_record 
  FROM complaints c
  LEFT JOIN profiles p ON c.user_id = p.id
  WHERE c.id = NEW.complaint_id;

  -- Determine who to notify based on sender type
  IF NEW.sender_type = 'user' THEN
    -- User sent message, notify admins/agents
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      complaint_id,
      metadata
    )
    SELECT 
      ur.user_id,
      'New Message Received',
      'New message from ' || COALESCE(complaint_record.full_name, complaint_record.email, 'User') || ' on complaint "' || complaint_record.title || '".',
      'response_received',
      NEW.complaint_id,
      jsonb_build_object('sender_type', NEW.sender_type)
    FROM user_roles ur 
    WHERE ur.role = ANY(ARRAY['admin'::user_role, 'agent'::user_role]);
    
  ELSE
    -- Admin/agent sent message, notify complaint owner
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      complaint_id,
      metadata
    ) VALUES (
      complaint_record.user_id,
      'New Reply Received',
      'You have received a new reply on your complaint "' || complaint_record.title || '".',
      'response_received',
      NEW.complaint_id,
      jsonb_build_object('sender_type', NEW.sender_type)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER complaint_notification_trigger
  AFTER INSERT OR UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.create_complaint_notification();

CREATE TRIGGER ticket_notification_trigger
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ticket_notification();

CREATE TRIGGER chat_notification_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_chat_notification();

-- Create updated_at trigger for notifications
CREATE TRIGGER notifications_updated_at_trigger
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to get user notification stats
CREATE OR REPLACE FUNCTION public.get_user_notification_stats(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  unread_count INTEGER;
  total_count INTEGER;
  result JSONB;
BEGIN
  -- Get counts
  SELECT 
    COUNT(*) FILTER (WHERE NOT read) as unread,
    COUNT(*) as total
  INTO unread_count, total_count
  FROM public.notifications
  WHERE user_id = target_user_id;
  
  result := jsonb_build_object(
    'unread_count', COALESCE(unread_count, 0),
    'total_count', COALESCE(total_count, 0)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications 
  SET read = true, updated_at = now()
  WHERE id = ANY(notification_ids)
  AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all user notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications 
  SET read = true, updated_at = now()
  WHERE user_id = auth.uid()
  AND NOT read;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;