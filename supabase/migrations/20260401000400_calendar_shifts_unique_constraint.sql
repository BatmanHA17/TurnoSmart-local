-- Fix duplicate shifts: add UNIQUE constraint on (employee_id, date, org_id)
-- This ensures upsert via persistShiftToSupabase works correctly and prevents
-- duplicate rows when generating/applying a schedule multiple times.

-- Remove any existing duplicates (keep most recent per employee+date+org)
DELETE FROM calendar_shifts
WHERE id NOT IN (
  SELECT DISTINCT ON (employee_id, date, org_id) id
  FROM calendar_shifts
  ORDER BY employee_id, date, org_id, created_at DESC
);

-- Add the unique constraint
ALTER TABLE calendar_shifts
  ADD CONSTRAINT uq_employee_date_org UNIQUE (employee_id, date, org_id);
