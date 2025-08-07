
-- First, let's ensure the complaints table has proper structure and policies
-- Drop any problematic policies that might cause recursion
DROP POLICY IF EXISTS "Users can create their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can update their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins and agents can view all complaints" ON public.complaints;

-- Recreate simple, non-recursive policies for complaints
CREATE POLICY "Users can insert their own complaints" 
  ON public.complaints 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own complaints" 
  ON public.complaints 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own complaints" 
  ON public.complaints 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow service role and authenticated users to view complaints for admin purposes
CREATE POLICY "Service role can manage all complaints" 
  ON public.complaints 
  FOR ALL 
  USING ((auth.jwt() ->> 'role') = 'service_role');

-- Simple policy for admins without recursion
CREATE POLICY "Authenticated admins can view all complaints" 
  ON public.complaints 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Ensure tickets table policies work correctly with complaints
DROP POLICY IF EXISTS "Users can view tickets for their complaints" ON public.tickets;
DROP POLICY IF EXISTS "Admins and agents can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins and agents can update tickets" ON public.tickets;

CREATE POLICY "Users can view their complaint tickets" 
  ON public.tickets 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.complaints 
    WHERE complaints.id = tickets.complaint_id 
    AND complaints.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage all tickets" 
  ON public.tickets 
  FOR ALL 
  USING ((auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Authenticated users can view tickets" 
  ON public.tickets 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Ensure profiles table works correctly for complaint submission
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow authenticated users to view other profiles for admin purposes
CREATE POLICY "Authenticated users can view profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Ensure the trigger functions work properly
-- Drop and recreate the complaint ticket creation trigger function
DROP FUNCTION IF EXISTS public.create_ticket_for_complaint() CASCADE;

CREATE OR REPLACE FUNCTION public.create_ticket_for_complaint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create ticket if it's not AI resolved
  IF NOT NEW.ai_resolved THEN
    INSERT INTO public.tickets (complaint_id, ticket_number, status)
    VALUES (NEW.id, generate_ticket_number(), 'open');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_ticket_after_complaint_insert ON public.complaints;
CREATE TRIGGER create_ticket_after_complaint_insert
  AFTER INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ticket_for_complaint();

-- Ensure storage bucket policies are correct for file uploads
DROP POLICY IF EXISTS "Users can upload complaint attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view complaint attachments" ON storage.objects;

CREATE POLICY "Users can upload to complaint-attachments bucket" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'complaint-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view complaint attachments" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'complaint-attachments' AND auth.role() = 'authenticated');
