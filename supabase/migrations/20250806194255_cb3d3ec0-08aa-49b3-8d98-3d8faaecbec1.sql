
-- Query to fetch all complaints with complete user information for admin portal
-- This is the main query used in the admin dashboard to show tickets with user details
SELECT 
  c.complaint_id,
  c.title,
  c.description,
  c.category,
  c.priority,
  c.status,
  c.attachment,
  c.created_at,
  c.updated_at,
  c.ai_resolved,
  c.user_id,
  -- User information from profiles table
  p.full_name as user_full_name,
  p.email as user_email,
  -- User information from users table (if available)
  u.employee_id as user_employee_id,
  u.department as user_department,
  -- Ticket information (if ticket exists)
  t.id as ticket_id,
  t.ticket_number,
  t.status as ticket_status,
  t.assigned_to
FROM complaints c
LEFT JOIN profiles p ON c.user_id = p.id
LEFT JOIN users u ON c.user_id = u.user_id  
LEFT JOIN tickets t ON c.complaint_id = t.complaint_id
ORDER BY c.created_at DESC;

-- Query to automatically create tickets for new complaints
-- This ensures every complaint gets a corresponding ticket
INSERT INTO tickets (complaint_id, ticket_number, status)
SELECT 
  c.complaint_id,
  'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_number_seq')::TEXT, 4, '0'),
  'open'
FROM complaints c
WHERE NOT EXISTS (
  SELECT 1 FROM tickets t WHERE t.complaint_id = c.complaint_id
)
AND c.ai_resolved = false;

-- Query for real-time updates - get latest complaints with user details
SELECT 
  c.*,
  p.full_name,
  p.email,
  u.employee_id,
  u.department
FROM complaints c
LEFT JOIN profiles p ON c.user_id = p.id
LEFT JOIN users u ON c.user_id = u.user_id
WHERE c.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY c.created_at DESC;

-- Query to get complaint statistics for admin dashboard
SELECT 
  COUNT(*) as total_complaints,
  COUNT(*) FILTER (WHERE status = 'Pending') as pending_complaints,
  COUNT(*) FILTER (WHERE status = 'Accepted') as accepted_complaints,
  COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_complaints,
  COUNT(*) FILTER (WHERE status = 'Resolved') as resolved_complaints,
  COUNT(*) FILTER (WHERE ai_resolved = true) as ai_resolved_complaints,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_complaints
FROM complaints;

-- Query to update complaint status from admin portal
UPDATE complaints 
SET 
  status = $1,
  updated_at = NOW()
WHERE complaint_id = $2;
