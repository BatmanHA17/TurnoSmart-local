-- LIMPIEZA COMPLETA DE DATOS DE LA APLICACIÓN
-- Mantiene la estructura de la base de datos y datos de referencia

-- 1. Eliminar datos dependientes primero
DELETE FROM public.calendar_shifts;
DELETE FROM public.cuadrante_assignments;
DELETE FROM public.daily_occupancy;
DELETE FROM public.absence_requests;
DELETE FROM public.compensatory_time_off;
DELETE FROM public.compensatory_time_history;
DELETE FROM public.contract_history;
DELETE FROM public.employee_shifts;
DELETE FROM public.activity_log;
DELETE FROM public.user_permissions;
DELETE FROM public.verification_codes;
DELETE FROM public.rgpd_settings;

-- 2. Eliminar datos principales
DELETE FROM public.colaborador_roles;
DELETE FROM public.colaboradores;
DELETE FROM public.employees;
DELETE FROM public.saved_shifts;
DELETE FROM public.establishments;
DELETE FROM public.jobs;
DELETE FROM public.cuadrantes;
DELETE FROM public.turnos_publicos;

-- 3. Eliminar roles de usuario
DELETE FROM public.user_roles;

-- 4. Eliminar perfiles de usuario
DELETE FROM public.profiles;

-- 5. Limpiar usuarios de autenticación (usando función de admin)
-- Nota: Esta operación eliminará todos los usuarios del sistema de auth
-- El usuario actual necesitará re-registrarse después de esta operación