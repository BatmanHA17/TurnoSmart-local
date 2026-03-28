-- KM 0 PHASE 1.3: Setup Super-Admin Global Access with RLS Bypass
-- Super-admin: goturnosmart@gmail.com (or sendtogalvan@gmail.com for local testing)
-- This admin has DIOS-level bypass for all RLS policies

-- 1. Ensure profile exists for super-admin
INSERT INTO profiles (id, email, display_name, is_active, created_at)
SELECT
  id,
  'sendtogalvan@gmail.com',
  'Super Admin',
  true,
  now()
FROM auth.users
WHERE email = 'sendtogalvan@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure super-admin has OWNER membership in Recepción org
INSERT INTO memberships (user_id, org_id, role, status, created_at)
SELECT
  u.id,
  o.id,
  'OWNER'::app_role_canonical,
  'active',
  now()
FROM auth.users u
CROSS JOIN organizations o
WHERE u.email = 'sendtogalvan@gmail.com'
  AND o.slug = 'recepcion'
ON CONFLICT (user_id, org_id) DO UPDATE
SET role = 'OWNER'::app_role_canonical, status = 'active';

-- 3. Create super_admins table for bypass mechanism (if not exists)
CREATE TABLE IF NOT EXISTS super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant RLS to this table
DO $$
BEGIN
  ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  -- Already enabled, skip
  NULL;
END $$;

-- Create RLS policy to allow service role only (if not exists)
DROP POLICY IF EXISTS "service_role_manage_super_admins" ON super_admins;
CREATE POLICY "service_role_manage_super_admins" ON super_admins
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Add super-admin user to super_admins table
INSERT INTO super_admins (user_id)
SELECT id
FROM auth.users
WHERE email = 'sendtogalvan@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 5. Create RLS bypass function for super-admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is in super_admins table
  RETURN EXISTS(
    SELECT 1 FROM public.super_admins
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verify super-admin exists
SELECT
  u.id,
  u.email,
  m.role,
  o.slug,
  sa.user_id IS NOT NULL as is_super_admin
FROM auth.users u
LEFT JOIN public.memberships m ON u.id = m.user_id
LEFT JOIN public.organizations o ON m.org_id = o.id
LEFT JOIN public.super_admins sa ON u.id = sa.user_id
WHERE u.email = 'sendtogalvan@gmail.com';
