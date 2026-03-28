-- KM 0 Complete Schema - Create all tables + setup in one migration
-- This is the foundation for TurnoSmart KM 0 cleanup

-- ============================================
-- 1. Create organizations table
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT DEFAULT 'ES',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Create profiles table
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Create memberships table
-- ============================================
CREATE TYPE app_role_canonical AS ENUM ('OWNER', 'ADMIN', 'USER', 'GUEST');

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role_canonical DEFAULT 'USER',
  "primary" BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, org_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Create job_departments table
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name, org_id)
);

ALTER TABLE public.job_departments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Create job_titles table
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  seniority_level INTEGER,
  department_id UUID REFERENCES public.job_departments(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name, department_id, org_id)
);

ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create colaboradores table
-- ============================================
CREATE TABLE IF NOT EXISTS public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT,
  department TEXT DEFAULT 'Recepción',
  status TEXT DEFAULT 'activo',
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Create jobs table
-- ============================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  job_title_id UUID REFERENCES public.job_titles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. Create invites table
-- ============================================
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role_canonical DEFAULT 'USER',
  token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '7 days'
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. Create super_admins table for DIOS level
-- ============================================
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. Create is_super_admin() function
-- ============================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.super_admins
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. Create Recepción organization
-- ============================================
INSERT INTO public.organizations (name, slug, country, created_at)
VALUES ('Recepción', 'recepcion', 'ES', now())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 12. Create Recepción job_department
-- ============================================
INSERT INTO public.job_departments (name, org_id)
SELECT 'Recepción', organizations.id
FROM public.organizations
WHERE slug = 'recepcion'
ON CONFLICT (name, org_id) DO NOTHING;

-- ============================================
-- 13. Create 7 Reception job_titles
-- ============================================
INSERT INTO public.job_titles (name, seniority_level, department_id, org_id)
SELECT title, level, job_departments.id, organizations.id
FROM (VALUES
  ('Jefe/a de Recepción', 3),
  ('2ndo/a Jefe/a de Recepción', 2),
  ('Recepcionista #1', 1),
  ('Recepcionista #2', 1),
  ('Recepcionista #3', 1),
  ('Recepcionista #4', 1),
  ('GEX - Guest Experience Agent', 2)
) AS titles(title, level)
CROSS JOIN public.job_departments
CROSS JOIN public.organizations
WHERE job_departments.name = 'Recepción'
  AND organizations.slug = 'recepcion'
ON CONFLICT (name, department_id, org_id) DO NOTHING;

-- ============================================
-- 14. RLS Policies - Super Admin Bypass
-- ============================================

-- Organizations
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (
    public.is_super_admin() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=organizations.id AND m.user_id=auth.uid())
  );

CREATE POLICY "org_update" ON public.organizations
  FOR UPDATE USING (
    public.is_super_admin() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=organizations.id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN'))
  );

-- Memberships
CREATE POLICY "mem_select" ON public.memberships
  FOR SELECT USING (
    public.is_super_admin() OR
    user_id=auth.uid() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=memberships.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "mem_insert" ON public.memberships
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    user_id=auth.uid() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=memberships.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "mem_update" ON public.memberships
  FOR UPDATE USING (
    public.is_super_admin() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=memberships.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "mem_delete" ON public.memberships
  FOR DELETE USING (
    public.is_super_admin() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=memberships.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN'))
  );

-- Invites
CREATE POLICY "inv_select" ON public.invites
  FOR SELECT USING (
    public.is_super_admin() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=invites.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "inv_insert" ON public.invites
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=invites.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "inv_update" ON public.invites
  FOR UPDATE USING (
    public.is_super_admin() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=invites.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "inv_delete" ON public.invites
  FOR DELETE USING (
    public.is_super_admin() OR
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.org_id=invites.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN'))
  );

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    public.is_super_admin() OR
    auth.uid() = id
  );

-- Colaboradores
CREATE POLICY "colaboradores_select" ON public.colaboradores
  FOR SELECT USING (
    public.is_super_admin() OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "colaboradores_insert" ON public.colaboradores
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "colaboradores_update" ON public.colaboradores
  FOR UPDATE USING (
    public.is_super_admin() OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );

CREATE POLICY "colaboradores_delete" ON public.colaboradores
  FOR DELETE USING (
    public.is_super_admin() OR
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
  );

-- Super admins table policy
CREATE POLICY "super_admin_select" ON public.super_admins
  FOR SELECT USING (true);
