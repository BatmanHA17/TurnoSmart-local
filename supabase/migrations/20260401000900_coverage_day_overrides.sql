-- Coverage per-day overrides: allow FOM to set different M/T/N minimums per day of week
-- Format: { "1": { "M": 3 }, "5": { "M": 1, "T": 3 } }
-- Keys: 1=Monday...7=Sunday. Only days with overrides are stored.

ALTER TABLE public.schedule_criteria
  ADD COLUMN IF NOT EXISTS day_overrides JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.schedule_criteria.day_overrides IS 'Per-day-of-week coverage overrides. Keys 1-7 (Mon-Sun), values { M: int, T: int, N: int }';
