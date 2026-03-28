-- Crear perfil para el usuario existente
INSERT INTO public.profiles (id, email, display_name, first_name, last_name)
VALUES (
  '9dffde2d-72a7-4fcd-8423-44bb327d85c2',
  'owner@turnosmart.app',
  'Jose Galvan',
  'Jose',
  'Galvan'
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Crear rol OWNER para el usuario
INSERT INTO public.user_roles (user_id, role, role_canonical)
VALUES ('9dffde2d-72a7-4fcd-8423-44bb327d85c2', 'super_admin', 'OWNER')
ON CONFLICT (user_id, role) DO NOTHING;

-- Crear membresía en la organización Mcdonalds
INSERT INTO public.memberships (org_id, user_id, role, "primary")
SELECT 
  o.id,
  '9dffde2d-72a7-4fcd-8423-44bb327d85c2',
  'OWNER',
  true
FROM public.organizations o 
WHERE o.name = 'Mcdonalds'
ON CONFLICT (org_id, user_id) DO NOTHING;