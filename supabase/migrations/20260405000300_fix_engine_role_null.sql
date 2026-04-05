-- Fix engine_role for collaborators where it's NULL
-- The original migration only updated rows with engine_role = 'ROTA_COMPLETO'
-- but QuickCreateTeam and manual creation leave engine_role as NULL.

-- GEX: Match by job title OR nombre containing "GEX" / "Guest Experience"
UPDATE public.colaboradores c
SET engine_role = 'GEX'
WHERE c.engine_role IS NULL
  AND (
    c.nombre ILIKE '%gex%'
    OR c.nombre ILIKE '%guest%experience%'
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.job_titles jt ON j.job_title_id = jt.id
      WHERE c.job_id = j.id
        AND (jt.name ILIKE '%gex%' OR jt.name ILIKE '%guest%experience%')
    )
  );

-- FOM: Match by job title containing jefe/gerente/director/FOM
UPDATE public.colaboradores c
SET engine_role = 'FOM'
WHERE c.engine_role IS NULL
  AND (
    c.nombre ILIKE '%fom%'
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.job_titles jt ON j.job_title_id = jt.id
      WHERE c.job_id = j.id
        AND (jt.name ILIKE '%jefe%recep%' OR jt.name ILIKE '%gerente%' OR jt.name ILIKE '%director%' OR jt.name ILIKE '%fom%')
    )
  );

-- AFOM: Match by job title containing subjefe/asistente/AFOM
UPDATE public.colaboradores c
SET engine_role = 'AFOM'
WHERE c.engine_role IS NULL
  AND (
    c.nombre ILIKE '%afom%'
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.job_titles jt ON j.job_title_id = jt.id
      WHERE c.job_id = j.id
        AND (jt.name ILIKE '%subjefe%' OR jt.name ILIKE '%asistente%direcc%' OR jt.name ILIKE '%second%' OR jt.name ILIKE '%afom%')
    )
  );

-- NIGHT_SHIFT_AGENT: Match by job title / nombre containing night/nocturno
UPDATE public.colaboradores c
SET engine_role = 'NIGHT_SHIFT_AGENT'
WHERE c.engine_role IS NULL
  AND (
    c.nombre ILIKE '%night%'
    OR c.nombre ILIKE '%nocturn%'
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.job_titles jt ON j.job_title_id = jt.id
      WHERE c.job_id = j.id
        AND (jt.name ILIKE '%nocturn%' OR jt.name ILIKE '%night%')
    )
  );

-- Everyone else with NULL engine_role → set default ROTA_COMPLETO (= FRONT_DESK_AGENT)
UPDATE public.colaboradores
SET engine_role = 'ROTA_COMPLETO'
WHERE engine_role IS NULL;
