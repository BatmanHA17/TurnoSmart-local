-- Verificar y agregar el permiso faltante para empleado

-- Primero verificar si existe el permiso de acceso_planificacion_publicada_equipos para empleado
INSERT INTO role_permissions (role, permission_name, is_enabled, is_configurable)
VALUES ('empleado', 'acceso_planificacion_publicada_equipos', true, false)
ON CONFLICT (role, permission_name) 
DO UPDATE SET is_enabled = true;

-- Verificar que tenemos exactamente los 4 permisos correctos para empleado
UPDATE role_permissions 
SET is_enabled = true 
WHERE role = 'empleado' 
AND permission_name IN (
  'acceso_planificacion_publicada_equipos',
  'guardar_propias_horas', 
  'acceso_propio_perfil',
  'modificar_informacion_personal'
);