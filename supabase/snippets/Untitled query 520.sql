-- 1. Create profile
INSERT INTO public.profiles (id, email, display_name, is_active)
VALUES (
  'bf07b4de-e09e-47fe-b619-66a26a9aee36'::uuid,
  'sendtogalvan@gmail.com',
  'Super Admin',
  true
) ON CONFLICT (id) DO NOTHING;

-- 2. Create super_admin record
INSERT INTO public.super_admins (user_id, created_at)
VALUES (
  'bf07b4de-e09e-47fe-b619-66a26a9aee36'::uuid,
  now()
) ON CONFLICT (user_id) DO NOTHING;

-- 3. Verify both were created
SELECT 'Profile created' as check1 WHERE EXISTS (
  SELECT 1 FROM public.profiles WHERE id = 'bf07b4de-e09e-47fe-b619-66a26a9aee36'::uuid
);

SELECT 'Super admin created' as check2 WHERE EXISTS (
  SELECT 1 FROM public.super_admins WHERE user_id = 'bf07b4de-e09e-47fe-b619-66a26a9aee36'::uuid
);
