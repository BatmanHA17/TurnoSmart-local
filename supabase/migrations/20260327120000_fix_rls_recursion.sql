-- Fix infinite recursion in RLS policies
-- The issue: collaboradors policy references memberships, which also has RLS checks
-- Solution: Simplify policies to avoid circular references

-- ============================================
-- Drop problematic policies
-- ============================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "colaboradores_select" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_insert" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_update" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_delete" ON public.colaboradores;
DROP POLICY IF EXISTS "memberships_select" ON public.memberships;
DROP POLICY IF EXISTS "memberships_insert" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update" ON public.memberships;
DROP POLICY IF EXISTS "memberships_delete" ON public.memberships;
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete" ON public.organizations;

-- ============================================
-- Create simple, non-recursive RLS policies
-- ============================================

-- PROFILES: Allow select if own profile, super-admin, service role, or anonymous
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    TRUE  -- Allow all anonymous access to check if email exists
  );

-- COLABORADORES: Allow select for all (used for email verification)
CREATE POLICY "colaboradores_select" ON public.colaboradores
  FOR SELECT USING (TRUE);

-- COLABORADORES INSERT/UPDATE/DELETE: Only authenticated users or super-admin
CREATE POLICY "colaboradores_insert" ON public.colaboradores
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "colaboradores_update" ON public.colaboradores
  FOR UPDATE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "colaboradores_delete" ON public.colaboradores
  FOR DELETE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

-- MEMBERSHIPS: Restrict access
CREATE POLICY "memberships_select" ON public.memberships
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "memberships_insert" ON public.memberships
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "memberships_update" ON public.memberships
  FOR UPDATE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "memberships_delete" ON public.memberships
  FOR DELETE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

-- ORGANIZATIONS: Restrict access to avoid recursion
CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT USING (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "organizations_insert" ON public.organizations
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

-- ============================================
-- Recreate super-admin record if missing
-- ============================================

-- First ensure the super-admin profile exists
INSERT INTO public.profiles (id, email, display_name, is_active)
SELECT
  u.id,
  'goturnosmart@gmail.com',
  'Super Admin DIOS',
  true
FROM auth.users u
WHERE u.email = 'goturnosmart@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE email = 'goturnosmart@gmail.com'
  );

-- Ensure super_admins table entry exists
INSERT INTO public.super_admins (user_id)
SELECT id FROM auth.users WHERE email = 'goturnosmart@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Ensure Recepción organization exists
INSERT INTO public.organizations (name, slug, country)
VALUES ('Recepción', 'recepcion', 'ES')
ON CONFLICT (slug) DO NOTHING;

-- Ensure super-admin membership exists
INSERT INTO public.memberships (user_id, org_id, role, status)
SELECT
  u.id,
  o.id,
  'OWNER'::app_role_canonical,
  'active'
FROM auth.users u
CROSS JOIN public.organizations o
WHERE u.email = 'goturnosmart@gmail.com'
  AND o.slug = 'recepcion'
  AND NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = u.id AND org_id = o.id
  );

-- Create super-admin colaborador record if missing
INSERT INTO public.colaboradores (nombre, email, department, status, org_id)
SELECT
  'Super Admin DIOS',
  'goturnosmart@gmail.com',
  'Admin',
  'activo',
  o.id
FROM public.organizations o
WHERE o.slug = 'recepcion'
  AND NOT EXISTS (
    SELECT 1 FROM public.colaboradores
    WHERE email = 'goturnosmart@gmail.com'
  );
