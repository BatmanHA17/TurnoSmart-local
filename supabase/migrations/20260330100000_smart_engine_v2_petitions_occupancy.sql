-- ============================================================================
-- TurnoSmart® — SMART Engine v2.0 — Petitions & Occupancy Tables
-- Fase 4: Peticiones + GEX + Ocupación
-- ============================================================================

-- 1. schedule_petitions — Reemplaza Excel de peticiones
CREATE TABLE IF NOT EXISTS schedule_petitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tipo: A(dura) B(blanda) C(intercambio) D(recurrente SMART)
  type TEXT NOT NULL CHECK (type IN ('A', 'B', 'C', 'D')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_detected')),

  -- Días afectados (array de números, 1-based día del mes)
  days INTEGER[] NOT NULL DEFAULT '{}',

  -- Turno solicitado o a evitar
  requested_shift TEXT,
  avoid_shift TEXT,

  -- Para intercambios (tipo C)
  exchange_with_employee_id UUID REFERENCES colaboradores(id),
  exchange_day INTEGER,

  -- Prioridad: 1 (alta) a 5 (baja)
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  reason TEXT,

  -- Período al que aplica
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Deadline: peticiones post-deadline entran como blandas prioridad baja
  is_past_deadline BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. daily_occupancy — Check-in/check-out diario
CREATE TABLE IF NOT EXISTS daily_occupancy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  date DATE NOT NULL,
  check_ins INTEGER NOT NULL DEFAULT 0,
  check_outs INTEGER NOT NULL DEFAULT 0,

  -- Origen de los datos
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'pdf', 'excel', 'api')),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(organization_id, date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_schedule_petitions_emp ON schedule_petitions(employee_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_schedule_petitions_period ON schedule_petitions(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_daily_occupancy_org_date ON daily_occupancy(organization_id, date);

-- RLS
ALTER TABLE schedule_petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_occupancy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org petitions"
  ON schedule_petitions FOR SELECT
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org petitions"
  ON schedule_petitions FOR ALL
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own org occupancy"
  ON daily_occupancy FOR SELECT
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org occupancy"
  ON daily_occupancy FOR ALL
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));
