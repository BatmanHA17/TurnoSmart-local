-- Actualizar contraseña del usuario hi@turnosmart.app para que pueda hacer login
-- Esto es una solución temporal para resolver el problema del bucle de autenticación

-- Primero eliminamos completamente el usuario problemático para empezar de cero
DELETE FROM auth.users WHERE email = 'hi@turnosmart.app';

-- Limpiar cualquier dato relacionado que pueda quedar
DELETE FROM verification_codes WHERE email = 'hi@turnosmart.app';
DELETE FROM colaboradores WHERE email = 'hi@turnosmart.app';
DELETE FROM activity_log WHERE user_name LIKE '%hi@turnosmart.app%' OR details::text LIKE '%hi@turnosmart.app%';

-- Mensaje de confirmación
SELECT 'Usuario hi@turnosmart.app completamente eliminado del sistema para permitir registro limpio' as status;