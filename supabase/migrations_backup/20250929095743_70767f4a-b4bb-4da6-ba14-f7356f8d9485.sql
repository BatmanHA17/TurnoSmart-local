-- Eliminar tablas obsoletas y de backup que no se usan
-- Todas estas tablas están vacías o contienen solo datos de backup obsoletos

-- Tablas de backup obsoletas
DROP TABLE IF EXISTS public._bak_absence_requests CASCADE;
DROP TABLE IF EXISTS public._bak_colaborador_roles CASCADE; 
DROP TABLE IF EXISTS public._bak_colaboradores CASCADE;
DROP TABLE IF EXISTS public._bak_contract_history CASCADE;

-- Tablas obsoletas no utilizadas
DROP TABLE IF EXISTS public.employee_shifts CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.establishments CASCADE;

-- Tablas de cuadrante sin datos
DROP TABLE IF EXISTS public.cuadrante_assignments CASCADE;
DROP TABLE IF EXISTS public.cuadrantes CASCADE;
DROP TABLE IF EXISTS public.daily_occupancy CASCADE;