
-- Fix infinite recursion in admin_users table policies
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can view admin users" ON public.admin_users;

-- Create a security definer function to check if user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id 
    AND role = 'admin'::user_role
  );
$$;

-- Create a security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_user_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = check_user_id 
    AND role = 'super_admin'
  );
$$;

-- Create new non-recursive policies using the functions
CREATE POLICY "Users can view their own admin record" 
  ON public.admin_users 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view admin users via role check" 
  ON public.admin_users 
  FOR SELECT 
  USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin users" 
  ON public.admin_users 
  FOR ALL 
  USING (public.is_user_super_admin(auth.uid()));

-- Allow service role to manage admin users
CREATE POLICY "Service role can manage admin users" 
  ON public.admin_users 
  FOR ALL 
  USING ((auth.jwt() ->> 'role') = 'service_role');

-- Also fix any remaining user_roles policies that might cause issues
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles via function" 
  ON public.user_roles 
  FOR ALL 
  USING (public.is_user_admin(auth.uid()));
