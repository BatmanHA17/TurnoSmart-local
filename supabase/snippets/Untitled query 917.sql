INSERT INTO public.colaboradores (
  id, 
  nombre, 
  email, 
  status,
  org_id,
  created_at
)
VALUES (
  gen_random_uuid(),
  'Super Admin',
  'sendtogalvan@gmail.com',
  'activo',
  'cfb31f8f-bbe7-4065-a5b1-ec9e45822bb9'::uuid,
  now()
);

SELECT id, nombre, email, org_id FROM public.colaboradores WHERE email = 'sendtogalvan@gmail.com';
