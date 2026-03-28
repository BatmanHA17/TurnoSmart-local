-- Limpiar todos los datos relacionados con el usuario hi@turnosmart.app

-- 1. Eliminar códigos de verificación
DELETE FROM verification_codes WHERE email = 'hi@turnosmart.app';

-- 2. Eliminar colaborador (esto eliminará automáticamente cualquier dato relacionado por cascada si existe)
DELETE FROM colaboradores WHERE email = 'hi@turnosmart.app';

-- 3. Limpiar cualquier dato huérfano en absence_requests relacionado con el email
DELETE FROM absence_requests WHERE employee_name LIKE '%hi@turnosmart.app%';

-- 4. Limpiar activity_log que pueda tener referencias al email
DELETE FROM activity_log WHERE user_name LIKE '%hi@turnosmart.app%' OR details::text LIKE '%hi@turnosmart.app%';

-- 5. Eliminar cualquier saved_shifts que pueda estar huérfano
DELETE FROM saved_shifts WHERE organization LIKE '%hi@turnosmart.app%' OR notes LIKE '%hi@turnosmart.app%';

-- 6. Limpiar establishments que puedan tener referencias
DELETE FROM establishments WHERE name LIKE '%hi@turnosmart.app%' OR direccion LIKE '%hi@turnosmart.app%';

-- 7. Limpiar jobs que puedan tener referencias
DELETE FROM jobs WHERE title LIKE '%hi@turnosmart.app%';

-- Mostrar resumen de limpieza
SELECT 'Limpieza completada' as status;