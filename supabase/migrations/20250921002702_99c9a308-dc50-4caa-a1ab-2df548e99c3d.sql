-- Limpiar datos de prueba para empezar desde cero

-- Eliminar códigos de verificación
DELETE FROM public.verification_codes;

-- Eliminar colaboradores (datos de prueba)
DELETE FROM public.colaboradores;

-- Limpiar cualquier rol de usuario que pueda haber quedado
DELETE FROM public.user_roles;

-- Limpiar perfiles que puedan estar marcados como eliminados
DELETE FROM public.profiles;

-- Limpiar logs de actividad
DELETE FROM public.activity_log;

-- Limpiar cualquier permiso de usuario específico
DELETE FROM public.user_permissions;

-- Limpiar roles de colaborador
DELETE FROM public.colaborador_roles;

-- Reiniciar secuencias si las hay (esto es opcional)
-- No hay secuencias en este esquema, pero lo menciono por completitud

-- Verificar que todo está limpio
SELECT 'Verification codes remaining' as table_name, COUNT(*) as count FROM public.verification_codes
UNION ALL
SELECT 'Colaboradores remaining', COUNT(*) FROM public.colaboradores 
UNION ALL
SELECT 'User roles remaining', COUNT(*) FROM public.user_roles
UNION ALL
SELECT 'Profiles remaining', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Activity logs remaining', COUNT(*) FROM public.activity_log;