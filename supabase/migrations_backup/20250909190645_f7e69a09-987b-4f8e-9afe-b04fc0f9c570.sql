-- Crear perfil para el usuario
INSERT INTO public.profiles (id, email, display_name, is_active)
VALUES (
  'a74294ed-550e-4117-877e-b0267569b19b',
  'calltobatman@gmail.com',
  'Super Admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  is_active = EXCLUDED.is_active;

-- Asignar rol de superadministrador
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'a74294ed-550e-4117-877e-b0267569b19b',
  'super_admin'
)
ON CONFLICT (user_id, role) DO NOTHING;