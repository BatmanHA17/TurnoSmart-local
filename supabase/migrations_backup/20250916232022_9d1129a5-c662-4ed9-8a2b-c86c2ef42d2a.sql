-- Corregir permisos para el rol empleado según la imagen de referencia
-- Un empleado solo debe tener estos 4 permisos activados:

-- Primero, deshabilitar todos los permisos para empleado
UPDATE role_permissions 
SET is_enabled = false 
WHERE role = 'empleado';

-- Luego, habilitar solo los 4 permisos correctos según la imagen:
-- 1. Acceso a la planificación publicada de sus equipos/ubicaciones
UPDATE role_permissions 
SET is_enabled = true 
WHERE role = 'empleado' AND permission_name = 'acceso_planificacion_publicada_equipos';

-- 2. Guardar sus propias horas de trabajo  
UPDATE role_permissions 
SET is_enabled = true 
WHERE role = 'empleado' AND permission_name = 'guardar_propias_horas';

-- 3. Acceso a su propio perfil
UPDATE role_permissions 
SET is_enabled = true 
WHERE role = 'empleado' AND permission_name = 'acceso_propio_perfil';

-- 4. Puede modificar su información personal y detalles de contacto
UPDATE role_permissions 
SET is_enabled = true 
WHERE role = 'empleado' AND permission_name = 'modificar_informacion_personal';

-- Verificar que estos permisos críticos estén DESHABILITADOS para empleado:
-- - validar_propias_horas (debe estar deshabilitado)
-- - consultar_propias_hojas (debe estar deshabilitado)  
-- - acceso_planificacion_no_publicada (debe estar deshabilitado)
-- - etc.