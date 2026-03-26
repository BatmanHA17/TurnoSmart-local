-- Cambiar el rol de Batman de super_admin a administrador
UPDATE public.user_roles 
SET role = 'administrador' 
WHERE user_id = 'a74294ed-550e-4117-877e-b0267569b19b' AND role = 'super_admin';