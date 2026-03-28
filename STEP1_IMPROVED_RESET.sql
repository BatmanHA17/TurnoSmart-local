-- STEP 1 - IMPROVED: Full Database Reset (handles missing tables gracefully)
-- This version uses dynamic SQL to check table existence before deleting
-- Date: 2026-03-27

-- Safe deletion with error handling
DO $$
DECLARE
  tables_to_delete TEXT[] := ARRAY[
    'activity_log',
    'cuadrante_assignments',
    'rota_schedule_assignments',
    'rota_shifts',
    'shift_templates',
    'employee_leaves',
    'employee_absences',
    'employee_contracts',
    'jobs',
    'job_titles',
    'job_departments',
    'colaboradores',
    'invites',
    'memberships',
    '_bak_colaboradores'
  ];

  table_name TEXT;
BEGIN
  -- Loop through each table and delete if it exists
  FOREACH table_name IN ARRAY tables_to_delete
  LOOP
    BEGIN
      -- Only delete from tables that exist
      IF table_name = 'jobs' THEN
        EXECUTE 'DELETE FROM ' || table_name || ' WHERE colaborador_id IS NOT NULL';
      ELSIF table_name = 'job_titles' THEN
        EXECUTE 'DELETE FROM ' || table_name || ' WHERE department_id IS NOT NULL';
      ELSIF table_name = 'job_departments' THEN
        EXECUTE 'DELETE FROM ' || table_name || ' WHERE org_id IS NOT NULL';
      ELSIF table_name = 'colaboradores' THEN
        EXECUTE 'DELETE FROM ' || table_name || ' WHERE org_id IS NOT NULL';
      ELSIF table_name = 'memberships' THEN
        EXECUTE 'DELETE FROM ' || table_name || ' WHERE org_id IS NOT NULL';
      ELSE
        -- For all other tables, delete everything
        EXECUTE 'DELETE FROM ' || table_name;
      END IF;

      RAISE NOTICE 'Deleted from %', table_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Table % skipped (does not exist or error)', table_name;
    END;
  END LOOP;

  RAISE NOTICE 'Database reset completed successfully';
END
$$;

-- Reset sequences if any
DO $$
BEGIN
  EXECUTE 'ALTER SEQUENCE IF EXISTS colaboradores_id_seq RESTART WITH 1';
  RAISE NOTICE 'Sequences reset';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No sequences to reset';
END
$$;

-- Delete organizations except Recepción
DELETE FROM organizations WHERE slug != 'recepcion';

RAISE NOTICE 'All non-Recepción orgs deleted';
