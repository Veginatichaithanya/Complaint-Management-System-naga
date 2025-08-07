
-- First, let's ensure the complaints table has proper foreign key relationships
-- and standardize the user reference system

-- Add missing columns to complaints table if they don't exist
ALTER TABLE complaints 
ADD COLUMN IF NOT EXISTS id SERIAL;

-- Ensure we have a proper primary key setup
ALTER TABLE complaints 
DROP CONSTRAINT IF EXISTS complaints_pkey CASCADE;

ALTER TABLE complaints 
ADD PRIMARY KEY (complaint_id);

-- Create a proper foreign key relationship between complaints and users
-- First, ensure the user_id column exists and references the users table properly
ALTER TABLE complaints 
ADD CONSTRAINT fk_complaints_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the tickets table to ensure it properly references complaints
ALTER TABLE tickets
ADD CONSTRAINT fk_tickets_complaint 
FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE;

-- Create an index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_complaint_id ON tickets(complaint_id);

-- Ensure tickets are automatically created for new complaints
CREATE OR REPLACE FUNCTION create_ticket_for_complaint()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ticket if it's not AI resolved and no ticket exists yet
  IF NOT NEW.ai_resolved AND NOT EXISTS (
    SELECT 1 FROM tickets WHERE complaint_id = NEW.complaint_id
  ) THEN
    INSERT INTO tickets (complaint_id, ticket_number, status)
    VALUES (NEW.complaint_id, generate_ticket_number(), 'open');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_create_ticket_for_complaint ON complaints;
CREATE TRIGGER trigger_create_ticket_for_complaint
  AFTER INSERT ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION create_ticket_for_complaint();

-- Enable realtime for complaints and tickets tables
ALTER TABLE complaints REPLICA IDENTITY FULL;
ALTER TABLE tickets REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
