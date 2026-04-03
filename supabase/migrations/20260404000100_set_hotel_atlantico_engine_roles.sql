-- ============================================================================
-- Migration: Set engine_role for existing Hotel Atlántico collaborators
--
-- The onboarding created Spanish job titles that mapRole() couldn't match:
--   "Jefe/a de Recepción" → should be FOM
--   "Recepcionista" → FRONT_DESK_AGENT (already default)
--
-- This sets the correct engine_role based on job_titles.name patterns.
-- ============================================================================

-- FOM: Jefe/a de Recepción, Gerente, Director
UPDATE public.colaboradores c
SET engine_role = 'FOM'
FROM public.jobs j
JOIN public.job_titles jt ON j.job_title_id = jt.id
WHERE c.job_id = j.id
  AND (jt.name ILIKE '%jefe%recep%' OR jt.name ILIKE '%gerente%' OR jt.name ILIKE '%director%')
  AND c.engine_role = 'ROTA_COMPLETO';

-- AFOM: Subjefe, Asistente de dirección
UPDATE public.colaboradores c
SET engine_role = 'AFOM'
FROM public.jobs j
JOIN public.job_titles jt ON j.job_title_id = jt.id
WHERE c.job_id = j.id
  AND (jt.name ILIKE '%subjefe%' OR jt.name ILIKE '%asistente%direcc%' OR jt.name ILIKE '%second%')
  AND c.engine_role = 'ROTA_COMPLETO';

-- NIGHT_SHIFT_AGENT: Nocturno, Night
UPDATE public.colaboradores c
SET engine_role = 'NIGHT_SHIFT_AGENT'
FROM public.jobs j
JOIN public.job_titles jt ON j.job_title_id = jt.id
WHERE c.job_id = j.id
  AND (jt.name ILIKE '%nocturn%' OR jt.name ILIKE '%night%')
  AND c.engine_role = 'ROTA_COMPLETO';

-- GEX: Guest Experience
UPDATE public.colaboradores c
SET engine_role = 'GEX'
FROM public.jobs j
JOIN public.job_titles jt ON j.job_title_id = jt.id
WHERE c.job_id = j.id
  AND (jt.name ILIKE '%guest%experience%' OR jt.name ILIKE '%gex%')
  AND c.engine_role = 'ROTA_COMPLETO';

-- Everyone else stays ROTA_COMPLETO (default) = FRONT_DESK_AGENT
