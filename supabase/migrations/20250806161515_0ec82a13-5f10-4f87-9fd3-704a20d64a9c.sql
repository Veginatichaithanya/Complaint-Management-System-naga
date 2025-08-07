
-- Drop and recreate the complaint_category enum with exact matching values
DROP TYPE IF EXISTS complaint_category CASCADE;
CREATE TYPE complaint_category AS ENUM (
  'software_bug',
  'login_issue',
  'performance', 
  'network',
  'technical_support',
  'other'
);

-- Recreate the complaints table category column with the corrected enum
ALTER TABLE complaints 
  ALTER COLUMN category TYPE complaint_category USING 
    CASE 
      WHEN LOWER(category::text) = 'software bug' THEN 'software_bug'::complaint_category
      WHEN LOWER(category::text) = 'login issue' THEN 'login_issue'::complaint_category
      WHEN LOWER(category::text) = 'performance' THEN 'performance'::complaint_category
      WHEN LOWER(category::text) = 'network' THEN 'network'::complaint_category
      WHEN LOWER(category::text) = 'technical support' THEN 'technical_support'::complaint_category
      ELSE 'other'::complaint_category
    END;

-- Set the default value
ALTER TABLE complaints 
  ALTER COLUMN category SET DEFAULT 'other'::complaint_category;
