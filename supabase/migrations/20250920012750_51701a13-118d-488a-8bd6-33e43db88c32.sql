-- Otorgar permisos de super_admin al usuario send.to.galvan@gmail.com
-- Actualizar el rol existente de 'user' a 'super_admin'
UPDATE public.user_roles 
SET role = 'super_admin'
WHERE user_id = 'bab5d5e0-14ef-4520-9653-0130d023c45c' 
  AND role = 'user';

-- Verificar que el cambio se aplicó correctamente
-- Esta consulta devolverá el estado actual de los roles