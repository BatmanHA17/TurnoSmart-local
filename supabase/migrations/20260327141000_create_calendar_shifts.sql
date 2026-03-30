-- calendar_shifts: tabla principal de turnos del cuadrante
-- Creada aquí porque se perdió en el reset KM0 y es referenciada por migrations posteriores.
-- Timestamp 141000 para que corra justo después del km0_05 (140400) y antes de los Sprints (329xxx).

CREATE TABLE IF NOT EXISTS calendar_shifts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id   UUID REFERENCES colaboradores(id) ON DELETE SET NULL, -- nullable = turno sin asignar
  date          DATE NOT NULL,
  start_time    TEXT,           -- e.g. "09:00"
  end_time      TEXT,           -- e.g. "17:00"
  shift_name    TEXT NOT NULL DEFAULT '',
  color         TEXT NOT NULL DEFAULT '#6b7280',
  notes         TEXT,
  break_duration INTEGER,       -- minutos
  -- Motor SMART v2
  generation_id UUID,           -- referenciará schedule_generations (se añade FK en migración posterior)
  source        TEXT DEFAULT 'manual', -- engine | petition_a | petition_b | exchange | manual | continuity | coverage
  locked        BOOLEAN DEFAULT false,
  -- Auditoría
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices de uso frecuente
CREATE INDEX IF NOT EXISTS idx_calendar_shifts_org_date
  ON calendar_shifts(org_id, date);

CREATE INDEX IF NOT EXISTS idx_calendar_shifts_employee_date
  ON calendar_shifts(employee_id, date);

-- RLS
ALTER TABLE calendar_shifts ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier miembro activo de la org
CREATE POLICY "members_can_read_shifts"
  ON calendar_shifts FOR SELECT
  USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.org_id = calendar_shifts.org_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- Escritura: solo OWNER o ADMIN
CREATE POLICY "admins_can_write_shifts"
  ON calendar_shifts FOR ALL
  USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.org_id = calendar_shifts.org_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('OWNER', 'ADMIN')
    )
  );
