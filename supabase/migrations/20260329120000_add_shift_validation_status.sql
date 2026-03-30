-- Sprint 2.3: Add validation_status to calendar_shifts for 3-state validation
-- States: pending (default), validated, invalidated

ALTER TABLE calendar_shifts
ADD COLUMN IF NOT EXISTS validation_status TEXT
  CHECK (validation_status IN ('pending', 'validated', 'invalidated'))
  DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_calendar_shifts_validation
ON calendar_shifts(org_id, validation_status);
