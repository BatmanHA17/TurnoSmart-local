-- Add night_rotation_index to org_engine_config for cross-period persistence
-- of the night coverage round-robin index (ensures FDA equity across generations)
ALTER TABLE public.org_engine_config
ADD COLUMN IF NOT EXISTS night_rotation_index integer DEFAULT 0;
