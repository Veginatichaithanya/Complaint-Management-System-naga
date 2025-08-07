-- Fix missing ai_resolved column in complaints table
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS ai_resolved boolean DEFAULT false;

-- Add missing RLS policies for chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_messages
CREATE POLICY "Users can view messages for their complaints" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.complaints 
    WHERE complaint_id = chat_messages.complaint_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
  )
);

CREATE POLICY "Users can send messages for their complaints" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.complaints 
    WHERE complaint_id = chat_messages.complaint_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can send messages to any complaint" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
  )
);

-- Update get_dashboard_metrics function to handle ai_resolved column properly
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  
  -- Get AI resolved complaints (handle case where column doesn't exist)
  BEGIN
    SELECT COUNT(*) INTO ai_resolved_complaints 
    FROM public.complaints 
    WHERE ai_resolved = true;
  EXCEPTION
    WHEN undefined_column THEN
      ai_resolved_complaints := 0;
  END;
  
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
$function$;