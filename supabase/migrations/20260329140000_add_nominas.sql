-- Sprint 3.2: Distribución de nóminas
-- Tabla principal de nóminas por colaborador y período

CREATE TABLE IF NOT EXISTS nominas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,            -- e.g. "2026-03" (YYYY-MM)
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  salario_bruto DECIMAL(10,2),
  salario_neto DECIMAL(10,2),
  deducciones DECIMAL(10,2),
  conceptos JSONB DEFAULT '[]',     -- [{name, amount, type: 'ingreso'|'deduccion'}]
  document_url TEXT,                -- URL to PDF
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','acknowledged')),
  sent_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(colaborador_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_nominas_org ON nominas(org_id, year, month);
CREATE INDEX IF NOT EXISTS idx_nominas_colaborador ON nominas(colaborador_id);

ALTER TABLE nominas ENABLE ROW LEVEL SECURITY;

-- Miembros activos de la org pueden ver nóminas (colaborador↔auth link en user-levels feature)
CREATE POLICY "members_read_own_nominas" ON nominas
  FOR SELECT USING (
    is_super_admin() OR
    org_id IN (
      SELECT m.org_id FROM memberships m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
    )
  );

-- Solo OWNER y ADMIN pueden crear/editar/borrar nóminas
CREATE POLICY "managers_manage_nominas" ON nominas
  FOR ALL USING (
    is_super_admin() OR
    org_id IN (
      SELECT m.org_id FROM memberships m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
        AND m.role IN ('OWNER','ADMIN')
    )
  );
