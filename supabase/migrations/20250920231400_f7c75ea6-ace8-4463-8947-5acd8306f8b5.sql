-- Primero, crear el perfil faltante para el usuario original
INSERT INTO public.profiles (id, email, display_name, first_name, last_name)
VALUES (
  '110efdd9-1a84-4341-8640-ecacfb143f23', 
  'calltobatmanuk@gmail.com',
  'Batman',
  'Bruce',
  'Wayne'
)
ON CONFLICT (id) DO NOTHING;

-- Crear rol de usuario si no existe
INSERT INTO public.user_roles (user_id, role)
VALUES ('110efdd9-1a84-4341-8640-ecacfb143f23', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- Crear establishment predeterminado para el usuario
INSERT INTO public.establishments (name, created_by)
VALUES ('Mi Empresa', '110efdd9-1a84-4341-8640-ecacfb143f23')
ON CONFLICT DO NOTHING;

-- Crear colaborador record
INSERT INTO public.colaboradores (nombre, apellidos, email, establecimiento_por_defecto, status)
VALUES ('Bruce', 'Wayne', 'calltobatmanuk@gmail.com', 'Mi Empresa', 'activo')
ON CONFLICT DO NOTHING;