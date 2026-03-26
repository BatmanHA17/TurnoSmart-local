-- Actualizar permisos del rol director para deshabilitar las 3 funciones específicas
UPDATE role_permissions 
SET is_enabled = false 
WHERE role = 'director' 
AND permission_name IN (
    'acceso_planificacion_otros_equipos',
    'ingresar_horas_todos_equipos', 
    'modificar_contadores_vacaciones'
);