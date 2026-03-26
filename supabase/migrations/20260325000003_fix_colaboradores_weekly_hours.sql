-- Fix: populate tiempo_trabajo_semanal for colaboradores created during onboarding
-- that were created before the complete-onboarding edge function was updated.
--
-- Logic: daily hours from job × 5 days = weekly hours
-- (e.g. 8h/day × 5 = 40h/week, 6h/day × 5 = 30h/week)

UPDATE colaboradores c
SET tiempo_trabajo_semanal = j.hours * 5
FROM jobs j
WHERE c.job_id = j.id
  AND (c.tiempo_trabajo_semanal IS NULL OR c.tiempo_trabajo_semanal = 0)
  AND j.hours IS NOT NULL
  AND j.hours > 0;

-- Also set a default for colaboradores without a job (can be updated manually later)
UPDATE colaboradores
SET tiempo_trabajo_semanal = 40
WHERE (tiempo_trabajo_semanal IS NULL OR tiempo_trabajo_semanal = 0)
  AND job_id IS NULL;
