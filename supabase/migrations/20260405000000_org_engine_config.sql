-- Org Engine Config: per-organization shift/role/coverage configuration
-- Replaces hardcoded sector templates with fully editable config

CREATE TABLE IF NOT EXISTS org_engine_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shifts JSONB NOT NULL DEFAULT '{}',       -- Record<string, ShiftTimeConfig>
  roles JSONB NOT NULL DEFAULT '[]',        -- RoleConfigOverride[]
  coverage JSONB NOT NULL DEFAULT '{"M":2,"T":2,"N":1}',
  weekly_hours NUMERIC NOT NULL DEFAULT 40,
  labor_law_preset TEXT NOT NULL DEFAULT 'spain_hospitality',
  sector_base TEXT NOT NULL DEFAULT 'hospitality', -- which template was used as starting point
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

-- RLS
ALTER TABLE org_engine_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_engine_config_select" ON org_engine_config
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "org_engine_config_insert" ON org_engine_config
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN'))
  );

CREATE POLICY "org_engine_config_update" ON org_engine_config
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN'))
  );

CREATE POLICY "org_engine_config_delete" ON org_engine_config
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN'))
  );
