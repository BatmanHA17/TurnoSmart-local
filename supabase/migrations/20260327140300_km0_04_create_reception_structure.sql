-- KM 0 PHASE 1.4: Create Reception Department & Job Structure (7 Roles)
-- All within Recepción organization

-- Get Recepción org ID
DO $$
DECLARE
  recepcion_org_id UUID;
BEGIN
  SELECT id INTO recepcion_org_id FROM organizations WHERE slug = 'recepcion' LIMIT 1;

  -- 1. Create Reception department
  INSERT INTO job_departments (id, name, org_id, created_at)
  SELECT
    gen_random_uuid(),
    'Recepción',
    recepcion_org_id,
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM job_departments
    WHERE name = 'Recepción' AND org_id = recepcion_org_id
  );

  -- 2. Create 7 job titles for Reception with different seniority levels
  INSERT INTO job_titles (id, name, seniority_level, department_id, org_id, created_at)
  SELECT
    gen_random_uuid(),
    title,
    level,
    dept.id,
    recepcion_org_id,
    now()
  FROM (VALUES
    ('Jefe/a de Recepción', 3),
    ('2ndo/a Jefe/a de Recepción', 2),
    ('Recepcionista #1', 1),
    ('Recepcionista #2', 1),
    ('Recepcionista #3', 1),
    ('Recepcionista #4', 1),
    ('GEX - Guest Experience Agent', 2)
  ) AS titles(title, level)
  CROSS JOIN job_departments dept
  WHERE dept.name = 'Recepción' AND dept.org_id = recepcion_org_id
  ON CONFLICT DO NOTHING;

  -- Verify creation
  RAISE NOTICE 'Created Reception structure:';
  PERFORM jt.id, jt.name, jt.seniority_level
  FROM job_titles jt
  WHERE jt.org_id = recepcion_org_id
  ORDER BY jt.seniority_level DESC;

END $$;

-- Final verification
SELECT
  jt.name,
  jt.seniority_level,
  jd.name as department,
  o.name as organization
FROM job_titles jt
JOIN job_departments jd ON jt.department_id = jd.id
JOIN organizations o ON jt.org_id = o.id
WHERE o.slug = 'recepcion'
ORDER BY jt.seniority_level DESC, jt.name;
