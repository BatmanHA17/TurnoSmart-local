-- Fix colaborador_full view: include real job_id column instead of NULL
-- The view was created before job_id existed, so it hardcoded NULL::uuid AS job_id

CREATE OR REPLACE VIEW public.colaborador_full AS
SELECT
  id,
  nombre,
  email,
  department,
  status,
  org_id,
  created_at,
  updated_at,
  apellidos,
  avatar_url,
  tiempo_trabajo_semanal,
  tipo_contrato,
  fecha_inicio_contrato,
  fecha_fin_contrato,
  telefono,
  dni,
  job_id
FROM public.colaboradores c;
