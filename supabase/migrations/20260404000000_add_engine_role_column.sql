-- ============================================================================
-- Migration: Add engine_role column to colaboradores
-- Phase 1 of V3 Rebuild: Fix the SMART Engine foundation
--
-- engine_role stores how this employee participates in shift generation.
-- This replaces the broken mapRole() string matching in useSmartGenerateV2.ts
-- that matched English role names ("FOM", "NIGHT AGENT") against Spanish
-- job titles created by onboarding ("Jefe/a de Recepción").
-- ============================================================================

-- Add engine_role column with default ROTA_COMPLETO (most common)
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS engine_role TEXT DEFAULT 'ROTA_COMPLETO';

-- Add CHECK constraint for valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'colaboradores_engine_role_check'
  ) THEN
    ALTER TABLE public.colaboradores
      ADD CONSTRAINT colaboradores_engine_role_check
      CHECK (engine_role IN (
        'FOM',
        'AFOM',
        'NIGHT_SHIFT_AGENT',
        'GEX',
        'FRONT_DESK_AGENT',
        'FIJO_NO_ROTA',
        'ROTA_COMPLETO',
        'ROTA_PARCIAL',
        'COBERTURA',
        'CUSTOM'
      ));
  END IF;
END $$;

-- Update colaborador_full view to include engine_role
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
  job_id,
  engine_role
FROM public.colaboradores c;

-- Add comment for documentation
COMMENT ON COLUMN public.colaboradores.engine_role IS
  'How this employee participates in SMART shift generation. '
  'Values: FOM, AFOM, NIGHT_SHIFT_AGENT, GEX, FRONT_DESK_AGENT (role-specific), '
  'or FIJO_NO_ROTA, ROTA_COMPLETO, ROTA_PARCIAL, COBERTURA, CUSTOM (generic rotation types).';
