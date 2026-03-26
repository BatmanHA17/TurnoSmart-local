-- Sincronizar roles entre user_roles y colaborador_roles para Batman
-- Primero, desactivar el rol actual de empleado
UPDATE colaborador_roles 
SET activo = false 
WHERE colaborador_id = 'eafcf14c-598c-48ab-b4e5-ab4cf79c58c7' 
AND role = 'empleado' 
AND activo = true;

-- Insertar el rol de administrador para Batman como colaborador
INSERT INTO colaborador_roles (colaborador_id, role, activo, asignado_en, asignado_por)
VALUES (
  'eafcf14c-598c-48ab-b4e5-ab4cf79c58c7',
  'administrador',
  true,
  now(),
  'a74294ed-550e-4117-877e-b0267569b19b'
) ON CONFLICT (colaborador_id, role) 
DO UPDATE SET 
  activo = true,
  asignado_en = now();