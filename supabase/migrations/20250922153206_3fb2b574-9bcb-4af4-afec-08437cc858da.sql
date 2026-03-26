-- Remove the problematic trigger and function that tries to access moved fields
DROP FUNCTION IF EXISTS public.sync_colaborador_to_health() CASCADE;

-- The trigger will be automatically dropped with CASCADE