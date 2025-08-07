
-- Ensure the ticket_status enum exists
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create sequence for ticket numbers if it doesn't exist
DO $$ BEGIN
  CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ensure tickets table has proper structure
ALTER TABLE tickets 
ALTER COLUMN status TYPE ticket_status USING status::ticket_status;

-- Create trigger to automatically create tickets for new complaints
CREATE OR REPLACE FUNCTION create_ticket_for_complaint()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create ticket if it's not AI resolved and no ticket exists yet
  IF NOT NEW.ai_resolved AND NOT EXISTS (
    SELECT 1 FROM tickets WHERE complaint_id = NEW.complaint_id
  ) THEN
    INSERT INTO tickets (complaint_id, ticket_number, status, created_at)
    VALUES (
      NEW.complaint_id,
      generate_ticket_number(),
      'open'::ticket_status,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS create_ticket_on_complaint ON complaints;
CREATE TRIGGER create_ticket_on_complaint
  AFTER INSERT ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION create_ticket_for_complaint();

-- Also create tickets for existing complaints that don't have them
INSERT INTO tickets (complaint_id, ticket_number, status, created_at)
SELECT 
  c.complaint_id,
  'TKT-' || TO_CHAR(c.created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY c.created_at)::TEXT, 4, '0'),
  'open'::ticket_status,
  c.created_at
FROM complaints c
WHERE NOT EXISTS (
  SELECT 1 FROM tickets t WHERE t.complaint_id = c.complaint_id
)
AND c.ai_resolved = false;
