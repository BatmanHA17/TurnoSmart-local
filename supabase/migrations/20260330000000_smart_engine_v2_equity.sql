-- ============================================================================
-- TurnoSmart® — SMART Engine v2.0 — Equity & Generations Tables
-- Fase 3: Continuidad + Equidad
-- ============================================================================

-- 1. employee_equity — Tracking equidad cross-período (M/T/N/FDS)
CREATE TABLE IF NOT EXISTS employee_equity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contadores acumulados
  morning_count INTEGER NOT NULL DEFAULT 0,
  afternoon_count INTEGER NOT NULL DEFAULT 0,
  night_count INTEGER NOT NULL DEFAULT 0,
  weekend_worked_count INTEGER NOT NULL DEFAULT 0,
  long_weekend_count INTEGER NOT NULL DEFAULT 0,
  holiday_worked_count INTEGER NOT NULL DEFAULT 0,
  night_coverage_count INTEGER NOT NULL DEFAULT 0,

  -- Ratio de peticiones satisfechas (0-1)
  petition_satisfaction_ratio NUMERIC(3,2) NOT NULL DEFAULT 0,

  -- Período al que corresponde este snapshot
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Referencia a la generación que creó este snapshot
  generation_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(employee_id, organization_id, period_start)
);

-- 2. schedule_generations — Historial de generaciones + snapshot
CREATE TABLE IF NOT EXISTS schedule_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Período generado
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_days INTEGER NOT NULL,
  total_weeks INTEGER NOT NULL,

  -- Alternativa elegida
  chosen_alternative TEXT NOT NULL DEFAULT 'balanced', -- balanced | petitions | coverage
  chosen_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  traffic_light TEXT NOT NULL DEFAULT 'green', -- green | orange | red

  -- Score desglosado (JSON)
  score_breakdown JSONB NOT NULL DEFAULT '{}',

  -- Snapshot de las 3 alternativas (JSON compacto)
  alternatives_summary JSONB NOT NULL DEFAULT '[]',

  -- Quién generó y cuándo
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Estado
  status TEXT NOT NULL DEFAULT 'draft', -- draft | published | archived
  published_at TIMESTAMPTZ,

  -- Meta
  engine_version TEXT NOT NULL DEFAULT '2.0',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  total_employees INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ALTER calendar_shifts — Añadir campos del motor v2
DO $$
BEGIN
  -- generation_id: referencia a la generación que creó este turno
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_shifts' AND column_name = 'generation_id'
  ) THEN
    ALTER TABLE calendar_shifts ADD COLUMN generation_id UUID REFERENCES schedule_generations(id);
  END IF;

  -- source: cómo se creó este turno
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_shifts' AND column_name = 'source'
  ) THEN
    ALTER TABLE calendar_shifts ADD COLUMN source TEXT DEFAULT 'manual';
    -- Valores: engine, petition_a, petition_b, exchange, manual, continuity, coverage
  END IF;

  -- locked: si el FOM lo bloqueó manualmente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_shifts' AND column_name = 'locked'
  ) THEN
    ALTER TABLE calendar_shifts ADD COLUMN locked BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_employee_equity_emp_org ON employee_equity(employee_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_schedule_generations_org ON schedule_generations(organization_id, period_start);
CREATE INDEX IF NOT EXISTS idx_calendar_shifts_generation ON calendar_shifts(generation_id);

-- RLS
ALTER TABLE employee_equity ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_generations ENABLE ROW LEVEL SECURITY;

-- Policies: acceso por organización
CREATE POLICY "Users can view own org equity"
  ON employee_equity FOR SELECT
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org equity"
  ON employee_equity FOR ALL
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own org generations"
  ON schedule_generations FOR SELECT
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org generations"
  ON schedule_generations FOR ALL
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));
