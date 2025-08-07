
-- Create users table to track complaint counts
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  employee_id TEXT UNIQUE,
  department TEXT,
  total_complaints INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'agent'::user_role])
  ));

-- Update ibm_complaints table to add edit/delete tracking
ALTER TABLE public.ibm_complaints 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT TRUE;

-- Create function to handle complaint submission
CREATE OR REPLACE FUNCTION handle_complaint_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment user's total complaints count
  INSERT INTO public.users (user_id, name, employee_id, department, total_complaints)
  VALUES (NEW.user_id, NEW.full_name, NEW.employee_id, NEW.department, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_complaints = users.total_complaints + 1,
    name = COALESCE(users.name, NEW.full_name),
    employee_id = COALESCE(users.employee_id, NEW.employee_id),
    department = COALESCE(users.department, NEW.department),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle complaint deletion
CREATE OR REPLACE FUNCTION handle_complaint_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement user's total complaints count
  UPDATE public.users 
  SET total_complaints = GREATEST(total_complaints - 1, 0), updated_at = NOW()
  WHERE user_id = OLD.user_id;
  
  -- Remove associated admin notifications
  DELETE FROM public.admin_notifications 
  WHERE metadata->>'complaint_id' = OLD.complaint_id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for complaint management
DROP TRIGGER IF EXISTS trigger_complaint_submission ON public.ibm_complaints;
CREATE TRIGGER trigger_complaint_submission
  AFTER INSERT ON public.ibm_complaints
  FOR EACH ROW EXECUTE FUNCTION handle_complaint_submission();

DROP TRIGGER IF EXISTS trigger_complaint_deletion ON public.ibm_complaints;
CREATE TRIGGER trigger_complaint_deletion
  BEFORE DELETE ON public.ibm_complaints
  FOR EACH ROW EXECUTE FUNCTION handle_complaint_deletion();

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS trigger_update_timestamp ON public.ibm_complaints;
CREATE TRIGGER trigger_update_timestamp
  BEFORE UPDATE ON public.ibm_complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update RLS policies for ibm_complaints to allow delete
DROP POLICY IF EXISTS "Users can delete their own IBM complaints" ON public.ibm_complaints;
CREATE POLICY "Users can delete their own IBM complaints" ON public.ibm_complaints
  FOR DELETE USING (auth.uid() = user_id AND status = 'Pending');

-- Enable realtime for tables
ALTER TABLE public.ibm_complaints REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ibm_complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Create function to get user complaint stats
CREATE OR REPLACE FUNCTION get_user_complaint_stats(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_complaints', COALESCE(u.total_complaints, 0),
    'pending_complaints', COALESCE(pending.count, 0),
    'under_review_complaints', COALESCE(under_review.count, 0),
    'resolved_complaints', COALESCE(resolved.count, 0)
  ) INTO result
  FROM public.users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM public.ibm_complaints 
    WHERE status = 'Pending' AND user_id = target_user_id
    GROUP BY user_id
  ) pending ON u.user_id = pending.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM public.ibm_complaints 
    WHERE status = 'Under Review' AND user_id = target_user_id
    GROUP BY user_id
  ) under_review ON u.user_id = under_review.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count 
    FROM public.ibm_complaints 
    WHERE status IN ('Resolved', 'Closed') AND user_id = target_user_id
    GROUP BY user_id
  ) resolved ON u.user_id = resolved.user_id
  WHERE u.user_id = target_user_id;
  
  IF result IS NULL THEN
    result := json_build_object(
      'total_complaints', 0,
      'pending_complaints', 0,
      'under_review_complaints', 0,
      'resolved_complaints', 0
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
