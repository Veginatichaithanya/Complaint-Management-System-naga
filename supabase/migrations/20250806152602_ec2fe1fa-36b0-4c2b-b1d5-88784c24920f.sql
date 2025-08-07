
-- First, let's see the current enum values
-- Then update the complaint_category enum to match the form options

-- Drop the existing enum and recreate it with the correct values
DROP TYPE IF EXISTS complaint_category CASCADE;

CREATE TYPE complaint_category AS ENUM (
  'software_bug',
  'login_issue', 
  'performance',
  'network',
  'technical_support',
  'other'
);

-- Recreate the complaints table category column with the new enum
ALTER TABLE complaints 
ALTER COLUMN category TYPE complaint_category 
USING 'other'::complaint_category;

-- Set default value
ALTER TABLE complaints 
ALTER COLUMN category SET DEFAULT 'other'::complaint_category;
