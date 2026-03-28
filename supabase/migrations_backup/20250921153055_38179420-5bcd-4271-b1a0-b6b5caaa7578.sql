-- FASE 2: Multi-organización + Invitaciones con Magic Link (Fixed)
-- Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NULL,
  trial_ends_at timestamptz NULL,
  subscription_status text DEFAULT 'trial',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_name ON organizations (lower(name));

-- memberships (org↔user)
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role app_role_canonical NOT NULL,
  "primary" boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_membership_org_user ON memberships(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

-- invites (token opaco + hash) - usando text en lugar de citext
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role_canonical NOT NULL,
  invited_by uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  revoked_at timestamptz NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(lower(email));
CREATE INDEX IF NOT EXISTS idx_invites_org ON invites(org_id);
CREATE INDEX IF NOT EXISTS idx_invites_token_hash ON invites(token_hash);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites      ENABLE ROW LEVEL SECURITY;

-- Policies para organizations
DROP POLICY IF EXISTS org_select ON organizations;
CREATE POLICY org_select ON organizations
  FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=organizations.id AND m.user_id=auth.uid()));

DROP POLICY IF EXISTS org_insert ON organizations;
CREATE POLICY org_insert ON organizations
  FOR INSERT WITH CHECK (true); -- Para permitir registro de nuevas organizaciones

DROP POLICY IF EXISTS org_update ON organizations;
CREATE POLICY org_update ON organizations
  FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=organizations.id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN')));

-- Policies para memberships
DROP POLICY IF EXISTS mem_select ON memberships;
CREATE POLICY mem_select ON memberships
  FOR SELECT USING (user_id=auth.uid() OR EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=memberships.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN')));

DROP POLICY IF EXISTS mem_insert ON memberships;
CREATE POLICY mem_insert ON memberships
  FOR INSERT WITH CHECK (user_id=auth.uid() OR EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=memberships.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN')));

DROP POLICY IF EXISTS mem_update ON memberships;
CREATE POLICY mem_update ON memberships
  FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=memberships.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN')));

DROP POLICY IF EXISTS mem_delete ON memberships;
CREATE POLICY mem_delete ON memberships
  FOR DELETE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=memberships.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN')));

-- Policies para invites
DROP POLICY IF EXISTS inv_select ON invites;
CREATE POLICY inv_select ON invites
  FOR SELECT USING (EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=invites.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN')));

DROP POLICY IF EXISTS inv_insert ON invites;
CREATE POLICY inv_insert ON invites
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=invites.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN')));

DROP POLICY IF EXISTS inv_update ON invites;
CREATE POLICY inv_update ON invites
  FOR UPDATE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=invites.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN')));

DROP POLICY IF EXISTS inv_delete ON invites;
CREATE POLICY inv_delete ON invites
  FOR DELETE USING (EXISTS (SELECT 1 FROM memberships m WHERE m.org_id=invites.org_id AND m.user_id=auth.uid() AND m.role IN ('OWNER','ADMIN')));

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_primary_org(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id
  FROM memberships
  WHERE user_id = user_uuid AND "primary" = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_user_role_in_org(user_uuid uuid, org_uuid uuid)
RETURNS app_role_canonical
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM memberships
  WHERE user_id = user_uuid AND org_id = org_uuid
  LIMIT 1;
$$;