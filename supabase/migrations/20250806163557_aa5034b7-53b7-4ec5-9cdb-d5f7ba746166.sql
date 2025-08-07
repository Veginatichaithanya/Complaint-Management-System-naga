
-- Drop all complaint-related tables and their dependencies
DROP TABLE IF EXISTS meeting_attendees CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS ticket_assignments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;

-- Drop related sequences if they exist
DROP SEQUENCE IF EXISTS ticket_number_seq CASCADE;

-- Drop custom types that were used by the complaint system
DROP TYPE IF EXISTS complaint_category CASCADE;
DROP TYPE IF EXISTS complaint_priority CASCADE;
DROP TYPE IF EXISTS complaint_status CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create the new IBM complaints table as specified
CREATE TABLE public.ibm_complaints (
  complaint_id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  employee_id VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  issue_title TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  status VARCHAR(20) DEFAULT 'Pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on the new table
ALTER TABLE public.ibm_complaints ENABLE ROW LEVEL SECURITY;

-- Create RLS policies as specified
CREATE POLICY "Users can insert their own complaints"
  ON public.ibm_complaints
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can read all complaints"
  ON public.ibm_complaints
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Users can view their own complaints"
  ON public.ibm_complaints
  FOR SELECT
  USING (auth.uid() = user_id);
