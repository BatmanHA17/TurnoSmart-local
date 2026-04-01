-- Add locked column to calendar_shifts for manual cell locking (T1-4)
-- FOM can lock cells via right-click → the engine will respect locked shifts

ALTER TABLE public.calendar_shifts
  ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.calendar_shifts.locked IS 'When true, the SMART engine will not overwrite this shift during generation';
