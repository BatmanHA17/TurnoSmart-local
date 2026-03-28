-- Limpiar toda la aplicación de usuarios para comenzar desde cero

-- Deshabilitar RLS temporalmente para poder hacer la limpieza
SET session_replication_role = replica;

-- Limpiar códigos de verificación
DELETE FROM public.verification_codes;

-- Limpiar historial de tiempo compensatorio
DELETE FROM public.compensatory_time_history;

-- Limpiar tiempo compensatorio
DELETE FROM public.compensatory_time_off;

-- Limpiar solicitudes de ausencia
DELETE FROM public.absence_requests;

-- Limpiar historial de contratos
DELETE FROM public.contract_history;

-- Limpiar permisos de usuario
DELETE FROM public.user_permissions;

-- Limpiar roles de colaborador
DELETE FROM public.colaborador_roles;

-- Limpiar colaboradores
DELETE FROM public.colaboradores;

-- Limpiar logs de actividad
DELETE FROM public.activity_log;

-- Limpiar configuraciones RGPD
DELETE FROM public.rgpd_settings;

-- Limpiar roles de usuario
DELETE FROM public.user_roles;

-- Limpiar perfiles de usuario
DELETE FROM public.profiles;

-- Reiniciar secuencias si las hay
-- (No hay secuencias en este esquema, solo UUIDs)

-- Rehabilitar RLS
SET session_replication_role = DEFAULT;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada exitosamente. Todos los usuarios han sido eliminados.' as message;