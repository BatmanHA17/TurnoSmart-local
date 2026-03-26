-- Asignar rol de admin al usuario actual para poder modificar permisos
INSERT INTO user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM profiles 
WHERE email = 'calltobatman@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;