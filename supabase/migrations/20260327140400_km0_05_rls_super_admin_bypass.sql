-- KM 0 PHASE 1.5: Add Super-Admin RLS Bypass to All Tables
-- Super-admin can access ALL data regardless of RLS policies

DO $$ BEGIN

-- Organizations table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_organizations" ON organizations;
  CREATE POLICY "super_admin_bypass_organizations" ON organizations
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Memberships table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_memberships" ON memberships;
  CREATE POLICY "super_admin_bypass_memberships" ON memberships
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Profiles table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_profiles" ON profiles;
  CREATE POLICY "super_admin_bypass_profiles" ON profiles
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Colaboradores table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colaboradores') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_colaboradores" ON colaboradores;
  CREATE POLICY "super_admin_bypass_colaboradores" ON colaboradores
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Jobs table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_jobs" ON jobs;
  CREATE POLICY "super_admin_bypass_jobs" ON jobs
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Job titles table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_titles') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_job_titles" ON job_titles;
  CREATE POLICY "super_admin_bypass_job_titles" ON job_titles
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Job departments table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_departments') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_job_departments" ON job_departments;
  CREATE POLICY "super_admin_bypass_job_departments" ON job_departments
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Shift templates table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shift_templates') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_shift_templates" ON shift_templates;
  CREATE POLICY "super_admin_bypass_shift_templates" ON shift_templates
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Rota shifts table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rota_shifts') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_rota_shifts" ON rota_shifts;
  CREATE POLICY "super_admin_bypass_rota_shifts" ON rota_shifts
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Employee absences table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_absences') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_employee_absences" ON employee_absences;
  CREATE POLICY "super_admin_bypass_employee_absences" ON employee_absences
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Employee leaves table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_leaves') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_employee_leaves" ON employee_leaves;
  CREATE POLICY "super_admin_bypass_employee_leaves" ON employee_leaves
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

-- Activity log table
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
  DROP POLICY IF EXISTS "super_admin_bypass_activity_log" ON activity_log;
  CREATE POLICY "super_admin_bypass_activity_log" ON activity_log
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
END IF;

END $$;

-- Verification: List all created policies
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE policyname LIKE 'super_admin_bypass%'
ORDER BY tablename;
