-- ============================================================================
-- TurnoSmart® — SMART Engine v3.0 — Extend schedule_criteria + Overrides
-- Phase 1.1: DB migration for 92-criteria catalog
-- ============================================================================

-- 1. Add new columns to schedule_criteria
ALTER TABLE schedule_criteria
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'error', 'blocker')),
  ADD COLUMN IF NOT EXISTS config_json JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 2. Drop old category CHECK and add extended one
-- (mandatory, optional, custom, check, smart_ia)
ALTER TABLE schedule_criteria DROP CONSTRAINT IF EXISTS schedule_criteria_category_check;
ALTER TABLE schedule_criteria
  ADD CONSTRAINT schedule_criteria_category_check
    CHECK (category IN ('mandatory', 'optional', 'custom', 'check', 'smart_ia'));

-- 3. Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_schedule_criteria_code
  ON schedule_criteria(organization_id, code);

-- 4. Create schedule_criteria_overrides table
-- Per-generation overrides (puntual adjustments without changing global config)
CREATE TABLE IF NOT EXISTS schedule_criteria_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generation_id UUID NOT NULL REFERENCES schedule_generations(id) ON DELETE CASCADE,

  -- Which criteria to override
  criteria_key TEXT NOT NULL,

  -- Override values (NULL = use global)
  enabled BOOLEAN,
  boost INTEGER CHECK (boost IS NULL OR boost BETWEEN 1 AND 5),
  config_json JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(generation_id, criteria_key)
);

-- 5. Indexes for overrides
CREATE INDEX IF NOT EXISTS idx_criteria_overrides_gen
  ON schedule_criteria_overrides(generation_id);
CREATE INDEX IF NOT EXISTS idx_criteria_overrides_org
  ON schedule_criteria_overrides(organization_id);

-- 6. RLS for overrides
ALTER TABLE schedule_criteria_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org criteria overrides"
  ON schedule_criteria_overrides FOR SELECT
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org criteria overrides"
  ON schedule_criteria_overrides FOR ALL
  USING (organization_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  ));
