-- Add headcount column to jobs table
-- Stores how many employees work in a given role (set during onboarding)

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS headcount INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.jobs.headcount IS 'Number of employees assigned to this job role';
