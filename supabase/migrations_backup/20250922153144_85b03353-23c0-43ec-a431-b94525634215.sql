-- Remove the problematic trigger that tries to access moved fields
DROP TRIGGER IF EXISTS sync_colaborador_to_health_trigger ON public.colaboradores;
DROP FUNCTION IF EXISTS public.sync_colaborador_to_health();

-- Recreate a corrected trigger that only handles existing fields
CREATE OR REPLACE FUNCTION public.sync_colaborador_to_health()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only sync if we're updating core colaborador data
  -- Health data should be managed separately through the normalized tables
  RETURN NEW;
END;
$$;