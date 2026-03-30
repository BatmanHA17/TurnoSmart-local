-- Fix infinite recursion in memberships RLS policies
-- The old mem_select policy queried memberships inside its own condition, causing infinite recursion

-- Drop all old membership policies
DROP POLICY IF EXISTS mem_select ON memberships;
DROP POLICY IF EXISTS mem_update ON memberships;
DROP POLICY IF EXISTS mem_delete ON memberships;
DROP POLICY IF EXISTS mem_insert ON memberships;
DROP POLICY IF EXISTS memberships_select ON memberships;
DROP POLICY IF EXISTS memberships_update ON memberships;
DROP POLICY IF EXISTS memberships_delete ON memberships;
DROP POLICY IF EXISTS memberships_insert ON memberships;
DROP POLICY IF EXISTS super_admin_bypass_memberships ON memberships;

-- Recreate without recursion
CREATE POLICY memberships_select ON memberships FOR SELECT USING (
  user_id = auth.uid()
  OR is_super_admin()
  OR auth.role() = 'service_role'
);

CREATE POLICY memberships_insert ON memberships FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
  OR is_super_admin()
  OR user_id = auth.uid()
);

CREATE POLICY memberships_update ON memberships FOR UPDATE USING (
  auth.role() = 'service_role'
  OR is_super_admin()
);

CREATE POLICY memberships_delete ON memberships FOR DELETE USING (
  auth.role() = 'service_role'
  OR is_super_admin()
);

-- Fix organizations policies that also referenced memberships recursively
DROP POLICY IF EXISTS org_select ON organizations;
DROP POLICY IF EXISTS org_update ON organizations;
DROP POLICY IF EXISTS organizations_select ON organizations;
DROP POLICY IF EXISTS organizations_update ON organizations;
DROP POLICY IF EXISTS organizations_delete ON organizations;
DROP POLICY IF EXISTS organizations_insert ON organizations;
DROP POLICY IF EXISTS super_admin_bypass_organizations ON organizations;

CREATE POLICY organizations_select ON organizations FOR SELECT USING (
  is_super_admin()
  OR auth.role() = 'service_role'
  OR id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
);

CREATE POLICY organizations_insert ON organizations FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
  OR is_super_admin()
);

CREATE POLICY organizations_update ON organizations FOR UPDATE USING (
  is_super_admin()
  OR auth.role() = 'service_role'
);

CREATE POLICY organizations_delete ON organizations FOR DELETE USING (
  is_super_admin()
  OR auth.role() = 'service_role'
);
