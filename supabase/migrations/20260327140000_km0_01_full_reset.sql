-- KM 0 PHASE 1: Full Database Reset
-- Delete ALL data except structures needed for super-admin and Recepción organization
-- Respecting foreign key constraints

DO $$ BEGIN

-- 1. Delete activity logs and assignments first (if tables exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
    DELETE FROM activity_log;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cuadrante_assignments') THEN
    DELETE FROM cuadrante_assignments;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rota_schedule_assignments') THEN
    DELETE FROM rota_schedule_assignments;
  END IF;

-- 2. Delete scheduling-related data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rota_shifts') THEN
    DELETE FROM rota_shifts;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shift_templates') THEN
    DELETE FROM shift_templates;
  END IF;

-- 3. Delete employee-related data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_leaves') THEN
    DELETE FROM employee_leaves;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_absences') THEN
    DELETE FROM employee_absences;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_contracts') THEN
    DELETE FROM employee_contracts;
  END IF;

-- 4. Delete job-related data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
    DELETE FROM jobs;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_titles') THEN
    DELETE FROM job_titles;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_departments') THEN
    DELETE FROM job_departments;
  END IF;

-- 5. Delete employee/collaborator data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colaboradores') THEN
    DELETE FROM colaboradores;
  END IF;

-- 6. Delete organization memberships for orgs being deleted
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
    DELETE FROM memberships WHERE org_id NOT IN (
      SELECT id FROM organizations WHERE slug = 'recepcion'
    );
  END IF;

-- 7. Delete invitations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invites') THEN
    DELETE FROM invites WHERE org_id NOT IN (
      SELECT id FROM organizations WHERE slug = 'recepcion'
    );
  END IF;

-- 8. Delete all organizations except Recepción
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    DELETE FROM organizations WHERE slug != 'recepcion';
  END IF;

-- 9. Clean up profiles for non-super-admin users (keep sendtogalvan@gmail.com)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    DELETE FROM profiles WHERE email != 'sendtogalvan@gmail.com'
      AND id NOT IN (
        SELECT user_id FROM memberships
        WHERE org_id = (SELECT id FROM organizations WHERE slug = 'recepcion')
      );
  END IF;

END $$;

-- Keep only the super-admin and Recepción org
-- Verify Recepción org exists
SELECT COUNT(*) as recepcion_count FROM organizations WHERE slug = 'recepcion';
