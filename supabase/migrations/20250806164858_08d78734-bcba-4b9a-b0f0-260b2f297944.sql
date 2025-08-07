
-- Create the ibm_complaints table
CREATE TABLE public.ibm_complaints (
  complaint_id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  issue_title TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  user_id UUID REFERENCES auth.users NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ibm_complaints ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own IBM complaints" 
  ON public.ibm_complaints 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own IBM complaints" 
  ON public.ibm_complaints 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own IBM complaints" 
  ON public.ibm_complaints 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all IBM complaints" 
  ON public.ibm_complaints 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'agent')
  ));

CREATE POLICY "Admins can update all IBM complaints" 
  ON public.ibm_complaints 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'agent')
  ));

-- Create index for better performance
CREATE INDEX idx_ibm_complaints_user_id ON public.ibm_complaints(user_id);
CREATE INDEX idx_ibm_complaints_status ON public.ibm_complaints(status);
CREATE INDEX idx_ibm_complaints_submitted_at ON public.ibm_complaints(submitted_at);
