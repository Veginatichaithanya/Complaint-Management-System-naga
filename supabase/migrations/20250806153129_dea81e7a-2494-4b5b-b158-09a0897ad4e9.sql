
-- Add new columns to the complaints table
ALTER TABLE public.complaints 
ADD COLUMN full_name TEXT,
ADD COLUMN employee_id TEXT,
ADD COLUMN department TEXT;

-- Make employee_id and department required fields
ALTER TABLE public.complaints 
ALTER COLUMN employee_id SET NOT NULL,
ALTER COLUMN department SET NOT NULL;

-- Set default values for existing records to avoid null constraint violations
UPDATE public.complaints 
SET 
  employee_id = 'TEMP-' || SUBSTRING(id::text, 1, 8),
  department = 'General'
WHERE employee_id IS NULL OR department IS NULL;
