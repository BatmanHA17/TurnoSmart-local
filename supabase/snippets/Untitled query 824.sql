-- Script para crear super-admin en sendtogalvan@gmail.com
-- Ejecutar en Supabase local SQL Editor

-- 1. Crear el auth user
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'sendtogalvan@gmail.com',
  '{"role":"DIOS"}',
  NOW(),
  NOW()
);

-- 2. Obtener el ID del usuario recién creado (ejecuta primero los INSERT arriba, luego esto para obtener el ID)
-- SELECT id FROM auth.users WHERE email = 'sendtogalvan@gmail.com';

-- 3. Reemplaza el UUID_AQUI con el ID obtenido arriba y ejecuta:
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  'UUID_AQUI'::uuid,
  'sendtogalvan@gmail.com',
  'Super Admin Test',
  true,
  NOW(),
  NOW()
);

-- 4. Crear super_admin record
INSERT INTO public.super_admins (
  user_id,
  created_at,
  updated_at
) VALUES (
  'UUID_AQUI'::uuid,
  NOW(),
  NOW()
);
