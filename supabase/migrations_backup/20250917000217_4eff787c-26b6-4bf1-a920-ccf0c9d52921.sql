-- Asignar rol de admin al nuevo usuario
INSERT INTO user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM profiles 
WHERE email = 'calltobatmanuk@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;