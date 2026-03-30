-- ============================================================================
-- TurnoSmart® — SMART Engine v2.0 — Criteria Config + Edit Log
-- Fase 5: Wizard UX + Post-Publicación
-- ============================================================================

-- 1. schedule_criteria — Config criterios ON/OFF + BOOST por organización
CREATE TABLE IF NOT EXISTS schedule_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identificador del criterio
  criteria_key TEXT NOT NULL,
  criteria_name TEXT NOT NULL,
  description TEXT,

  -- Estado
  enabled BOOLEAN NOT NULL DEFAULT true,
  -- Boost (1-5): peso extra del criterio. 1=normal, 5=máxima prioridad
  boost INTEGER NOT NULL DEFAULT 1 CHECK (boost BETWEEN 1 AND 5),
  -- Nota libre del FOM para contextualizar el boost
  boost_note TEXT,

  -- Categoría: obligatorio (no se puede desactivar), opcional, personalizado
  category TEXT NOT NULL DEFAULT 'optional' CHECK (category IN ('mandatory', 'optional', 'custom')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(organization_id, criteria_key)
);

-- 2. schedule_edit_log — Audit trail cambios post-publicación
CREATE TABLE IF NOT EXISTS schedule_edit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Referencia al turno modificado
  shift_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES schedule_generations(id),

  -- Fecha del turno modificado
  shift_date DATE NOT NULL,

  -- Cambio realizado
  previous_code TEXT NOT NULL,
  new_code TEXT NOT NULL,
  previous_start_time TEXT,
  previous_end_time TEXT,
  new_start_time TEXT,
  new_end_time TEXT,

  -- Quién y por qué
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,

  -- Tipo de cambio
  change_type TEXT NOT NULL DEFAULT 'manual' CHECK (change_type IN ('manual', 'swap', 'force_majeure', 'coverage')),

  -- Marca visual: los cambios post-pub se muestran en azul
  is_post_publication BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_schedule_criteria_org ON schedule_criteria(organization_id);
CREATE INDEX IF NOT EXISTS idx_schedule_edit_log_org ON schedule_edit_log(organization_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_schedule_edit_log_shift ON schedule_edit_log(shift_id);
CREATE INDEX IF NOT EXISTS idx_schedule_edit_log_emp ON schedule_edit_log(employee_id, shift_date);

-- RLS
ALTER TABLE schedule_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_edit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org criteria"
  ON schedule_criteria FOR SELECT
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org criteria"
  ON schedule_criteria FOR ALL
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own org edit log"
  ON schedule_edit_log FOR SELECT
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org edit log"
  ON schedule_edit_log FOR ALL
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));
