-- Fix missing database objects discovered during E2E testing
-- Date: 2026-03-28

-- 1. Create get_user_role_canonical function
CREATE OR REPLACE FUNCTION get_user_role_canonical(_user_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _role text;
BEGIN
  SELECT role::text INTO _role
  FROM memberships
  WHERE user_id = _user_id AND status = 'active'
  ORDER BY
    CASE role::text
      WHEN 'OWNER' THEN 1
      WHEN 'ADMIN' THEN 2
      ELSE 5
    END
  LIMIT 1;

  RETURN COALESCE(_role, 'USER');
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_role_canonical(uuid) TO authenticated, anon;

-- 2. Create get_user_organizations function
DROP FUNCTION IF EXISTS get_user_organizations();
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE(org_id uuid, org_name text, org_slug text, role text)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT m.org_id, o.name::text, o.slug::text, m.role::text
  FROM memberships m
  JOIN organizations o ON o.id = m.org_id
  WHERE m.user_id = auth.uid() AND m.status = 'active';
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_organizations() TO authenticated, anon;

-- 3. Add SELECT policy for job_departments (was missing, only had super_admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'job_departments_select' AND tablename = 'job_departments') THEN
    CREATE POLICY job_departments_select ON job_departments FOR SELECT USING (
      is_super_admin()
      OR auth.role() = 'service_role'
      OR org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- 4. Add SELECT policy for jobs table (was missing, only had super_admin)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'jobs_select' AND tablename = 'jobs') THEN
    CREATE POLICY jobs_select ON jobs FOR SELECT USING (
      is_super_admin()
      OR auth.role() = 'service_role'
      OR org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- 5. Create colaborador_full view
CREATE OR REPLACE VIEW colaborador_full AS
SELECT
  c.*,
  NULL::uuid AS job_id
FROM colaboradores c;

GRANT SELECT ON colaborador_full TO authenticated, anon;

-- 6. Create colaborador_roles table
CREATE TABLE IF NOT EXISTS colaborador_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'empleado',
  departamento text,
  activo boolean DEFAULT true,
  asignado_en timestamptz DEFAULT now()
);

ALTER TABLE colaborador_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'colaborador_roles_select' AND tablename = 'colaborador_roles') THEN
    CREATE POLICY colaborador_roles_select ON colaborador_roles FOR SELECT USING (true);
  END IF;
END $$;

-- 7. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
