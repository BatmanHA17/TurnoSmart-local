-- Crear perfiles para usuarios existentes que no los tienen
INSERT INTO public.profiles (id, email, display_name, first_name, last_name)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data ->> 'display_name', split_part(email, '@', 1)),
  raw_user_meta_data ->> 'first_name',
  raw_user_meta_data ->> 'last_name'
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
AND id IN (
  'ae24506a-ea3d-4156-80b8-6a7859a3e504',
  '3afe89ae-95d4-4d41-be19-208a1401401b'
);

-- Crear roles para usuarios existentes que no los tienen
INSERT INTO public.user_roles (user_id, role, role_canonical)
SELECT id, 'super_admin', 'OWNER'
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
AND id IN (
  'ae24506a-ea3d-4156-80b8-6a7859a3e504',
  '3afe89ae-95d4-4d41-be19-208a1401401b'
);

-- Crear la organización "Mcdonalds" si no existe
DO $$
DECLARE
    org_id uuid;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE name = 'Mcdonalds') THEN
        INSERT INTO public.organizations (id, name, country, subscription_status, trial_ends_at)
        VALUES (
            gen_random_uuid(),
            'Mcdonalds',
            'ES',
            'trial',
            now() + interval '30 days'
        ) RETURNING id INTO org_id;
        
        -- Crear membresías para los usuarios de owner@turnosmart.app
        INSERT INTO public.memberships (org_id, user_id, role, "primary")
        SELECT org_id, id, 'OWNER', true
        FROM auth.users 
        WHERE email = 'owner@turnosmart.app';
    END IF;
END
$$;

-- Crear el establecimiento "Mcdonalds" si no existe
INSERT INTO public.establishments (name, created_by, direccion, cif)
SELECT 'Mcdonalds', id, '', ''
FROM auth.users 
WHERE email = 'owner@turnosmart.app'
AND NOT EXISTS (SELECT 1 FROM public.establishments WHERE name = 'Mcdonalds')
LIMIT 1;