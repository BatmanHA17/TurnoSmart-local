-- Allow admins (and super_admins via existing policies) to manage profiles and roles

-- PROFILES: grant admins SELECT/ALL
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can manage all profiles'
  ) THEN
    DROP POLICY "Admins can manage all profiles" ON public.profiles;
  END IF;
END $$;

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    DROP POLICY "Admins can view all profiles" ON public.profiles;
  END IF;
END $$;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()));

-- USER_ROLES: grant admins SELECT/ALL
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage all roles'
  ) THEN
    DROP POLICY "Admins can manage all roles" ON public.user_roles;
  END IF;
END $$;

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can view all roles'
  ) THEN
    DROP POLICY "Admins can view all roles" ON public.user_roles;
  END IF;
END $$;

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (is_admin(auth.uid()));