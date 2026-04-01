-- Add approval fields to schedule_edit_log for double confirmation (rule C2)
-- Non-consecutive rest days require FOM + employee approval

ALTER TABLE public.schedule_edit_log
  ADD COLUMN IF NOT EXISTS approval_type TEXT,
  ADD COLUMN IF NOT EXISTS approval_reason TEXT,
  ADD COLUMN IF NOT EXISTS approval_fom_confirmed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_employee_informed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Index for querying pending approvals
CREATE INDEX IF NOT EXISTS idx_edit_log_approval_type
  ON public.schedule_edit_log (approval_type)
  WHERE approval_type IS NOT NULL;

COMMENT ON COLUMN public.schedule_edit_log.approval_type IS 'Type of approval: CONSECUTIVE_REST, FORCE_MAJEURE_12H, etc.';
COMMENT ON COLUMN public.schedule_edit_log.approval_reason IS 'FOM reason/justification for the exception';
COMMENT ON COLUMN public.schedule_edit_log.approval_fom_confirmed IS 'FOM explicitly confirmed the exception';
COMMENT ON COLUMN public.schedule_edit_log.approval_employee_informed IS 'Employee was informed and acknowledged';
