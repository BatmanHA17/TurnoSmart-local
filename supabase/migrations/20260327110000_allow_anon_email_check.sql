-- Allow anonymous users to check if emails exist in profiles
-- This is needed for the login email verification step

-- Drop existing policy and create a more permissive one for profiles SELECT
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    auth.uid() = id OR
    auth.role() = 'authenticated' OR
    auth.role() IS NULL  -- Allow anonymous (unauthenticated) access for email checks
  );

-- Similar for colaboradores table
DROP POLICY IF EXISTS "colaboradores_select" ON public.colaboradores;

CREATE POLICY "colaboradores_select" ON public.colaboradores
  FOR SELECT USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated' OR
    auth.role() IS NULL OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );
