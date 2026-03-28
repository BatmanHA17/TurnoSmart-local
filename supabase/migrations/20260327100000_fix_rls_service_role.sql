-- Fix RLS policies to allow service role access from edge functions
-- The issue: is_super_admin() relies on auth.uid(), which is NULL for service role
-- Solution: Add explicit service role bypass or modify auth context handling

-- ============================================
-- 1. Drop existing RLS policies that don't work with service role
-- ============================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- ============================================
-- 2. Recreate profiles RLS policies with service role bypass
-- ============================================

-- For SELECT: Allow if super-admin OR own profile OR service role calling from edge functions
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    public.is_super_admin() OR
    auth.uid() = id OR
    auth.role() = 'service_role'
  );

-- For INSERT: Allow if super-admin OR service role
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

-- For UPDATE: Allow if super-admin OR own profile OR service role
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    public.is_super_admin() OR
    auth.uid() = id OR
    auth.role() = 'service_role'
  )
  WITH CHECK (
    public.is_super_admin() OR
    auth.uid() = id OR
    auth.role() = 'service_role'
  );

-- For DELETE: Allow if super-admin OR service role
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

-- ============================================
-- 3. Fix colaboradores policies similarly
-- ============================================

DROP POLICY IF EXISTS "colaboradores_select" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_insert" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_update" ON public.colaboradores;
DROP POLICY IF EXISTS "colaboradores_delete" ON public.colaboradores;

CREATE POLICY "colaboradores_select" ON public.colaboradores
  FOR SELECT USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "colaboradores_insert" ON public.colaboradores
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "colaboradores_update" ON public.colaboradores
  FOR UPDATE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  )
  WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "colaboradores_delete" ON public.colaboradores
  FOR DELETE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );

-- ============================================
-- 4. Fix organizations policies
-- ============================================

DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete" ON public.organizations;

CREATE POLICY "organizations_select" ON public.organizations
  FOR SELECT USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "organizations_insert" ON public.organizations
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  )
  WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role'
  );

-- ============================================
-- 5. Fix memberships policies
-- ============================================

DROP POLICY IF EXISTS "memberships_select" ON public.memberships;
DROP POLICY IF EXISTS "memberships_insert" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update" ON public.memberships;
DROP POLICY IF EXISTS "memberships_delete" ON public.memberships;

CREATE POLICY "memberships_select" ON public.memberships
  FOR SELECT USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    user_id = auth.uid() OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "memberships_insert" ON public.memberships
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "memberships_update" ON public.memberships
  FOR UPDATE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  )
  WITH CHECK (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "memberships_delete" ON public.memberships
  FOR DELETE USING (
    public.is_super_admin() OR
    auth.role() = 'service_role' OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );
