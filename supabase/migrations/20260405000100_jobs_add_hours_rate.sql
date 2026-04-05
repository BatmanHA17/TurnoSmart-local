-- Add hours and rate_unit columns to jobs table
-- These were expected by the UI (JobsSettings.tsx) but missing from the schema

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS hours NUMERIC(4,1) DEFAULT 8;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS rate_unit NUMERIC(4,3) DEFAULT 1.000;
