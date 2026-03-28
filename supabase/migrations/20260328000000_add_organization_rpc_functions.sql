-- Create missing RPC functions for organization management
-- These functions are required by useCurrentOrganization hook

-- Create RPC function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE (
  org_id UUID,
  org_name TEXT,
  user_role TEXT,
  is_primary BOOLEAN,
  member_since TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Get current user ID from Supabase auth
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Return user's organizations with roles
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    m.role::TEXT,
    m.is_primary,
    m.created_at
  FROM organizations o
  INNER JOIN memberships m ON o.id = m.org_id
  WHERE m.user_id = _user_id
  ORDER BY m.is_primary DESC, m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organizations TO authenticated;

-- Create RPC function to set primary organization
CREATE OR REPLACE FUNCTION set_primary_organization(_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _user_id UUID;
  _count INT;
BEGIN
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is member of this organization
  SELECT COUNT(*) INTO _count
  FROM memberships
  WHERE user_id = _user_id AND org_id = _org_id;

  IF _count = 0 THEN
    RAISE EXCEPTION 'User is not a member of this organization';
  END IF;

  -- Unset primary from all orgs for this user
  UPDATE memberships
  SET is_primary = FALSE
  WHERE user_id = _user_id;

  -- Set primary for the selected org
  UPDATE memberships
  SET is_primary = TRUE
  WHERE user_id = _user_id AND org_id = _org_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_primary_organization(UUID) TO authenticated;
