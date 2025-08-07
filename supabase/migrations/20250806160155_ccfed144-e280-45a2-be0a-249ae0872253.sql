
-- First, let's check and fix the complaint_category enum
DROP TYPE IF EXISTS complaint_category CASCADE;
CREATE TYPE complaint_category AS ENUM (
  'software_bug',
  'login_issue', 
  'performance',
  'network',
  'technical_support',
  'other'
);

-- Create department enum for the department field
CREATE TYPE department_type AS ENUM (
  'it',
  'hr', 
  'team_lead',
  'fresher',
  'finance',
  'marketing',
  'operations',
  'other'
);

-- Update the complaints table to use the fixed enum and add department enum
ALTER TABLE complaints 
  ALTER COLUMN category TYPE complaint_category USING category::text::complaint_category,
  ALTER COLUMN department TYPE department_type USING 
    CASE 
      WHEN LOWER(department) = 'it' THEN 'it'::department_type
      WHEN LOWER(department) = 'hr' THEN 'hr'::department_type  
      WHEN LOWER(department) = 'team lead' THEN 'team_lead'::department_type
      WHEN LOWER(department) = 'fresher' THEN 'fresher'::department_type
      WHEN LOWER(department) = 'finance' THEN 'finance'::department_type
      WHEN LOWER(department) = 'marketing' THEN 'marketing'::department_type
      WHEN LOWER(department) = 'operations' THEN 'operations'::department_type
      ELSE 'other'::department_type
    END;

-- Update the default values
ALTER TABLE complaints 
  ALTER COLUMN category SET DEFAULT 'other'::complaint_category,
  ALTER COLUMN department SET DEFAULT 'other'::department_type;
