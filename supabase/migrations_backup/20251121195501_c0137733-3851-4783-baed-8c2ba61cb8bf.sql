-- Fix security warnings: Function Search Path and Extension in Public
-- This migration addresses SUPA_function_search_path_mutable and SUPA_extension_in_public

-- ============================================
-- PART 1: Fix Function Search Paths (16 functions)
-- ============================================

-- Add SET search_path = public to all functions missing it
ALTER FUNCTION public.cleanup_old_rate_limits() SET search_path = public;
ALTER FUNCTION public.ensure_single_active_agreement() SET search_path = public;
ALTER FUNCTION public.ensure_single_default_establishment() SET search_path = public;
ALTER FUNCTION public.insert_extracted_categories(uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.migrate_roles_to_canonical() SET search_path = public;
ALTER FUNCTION public.set_primary_org_on_first_membership() SET search_path = public;
ALTER FUNCTION public.sync_colaborador_to_user_role() SET search_path = public;
ALTER FUNCTION public.sync_job_department_to_teams() SET search_path = public;
ALTER FUNCTION public.sync_onboarding_completed() SET search_path = public;
ALTER FUNCTION public.update_colaborador_departments_updated_at() SET search_path = public;
ALTER FUNCTION public.update_colaborador_org_access_updated_at() SET search_path = public;
ALTER FUNCTION public.update_operation_backup_updated_at() SET search_path = public;
ALTER FUNCTION public.update_rate_limit_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_collective_agreements() SET search_path = public;
ALTER FUNCTION public.verify_phase2_migration() SET search_path = public;
ALTER FUNCTION public.verify_phase3_migration() SET search_path = public;

-- ============================================
-- PART 2: Move pg_net Extension from public to extensions schema
-- ============================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_net extension to extensions schema
-- Note: This requires dropping and recreating the extension
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

COMMENT ON SCHEMA extensions IS 'Schema for Supabase extensions to keep public schema clean';