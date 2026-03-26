-- FASE 1: Consolidación de autenticación y roles
-- Crear nuevo enum canónico de roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role_canonical') THEN
    CREATE TYPE app_role_canonical AS ENUM ('OWNER','ADMIN','MANAGER','DIRECTOR','EMPLOYEE');
  END IF;
END$$;

-- Agregar nueva columna con el enum canónico a user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_canonical app_role_canonical;

-- Función para migrar roles existentes al nuevo formato
CREATE OR REPLACE FUNCTION migrate_roles_to_canonical()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mapear roles existentes al nuevo enum
  UPDATE user_roles 
  SET role_canonical = CASE 
    WHEN role::text IN ('super_admin', 'propietario') THEN 'OWNER'::app_role_canonical
    WHEN role::text = 'admin' THEN 'ADMIN'::app_role_canonical
    WHEN role::text = 'manager' THEN 'MANAGER'::app_role_canonical
    WHEN role::text = 'director' THEN 'DIRECTOR'::app_role_canonical
    WHEN role::text = 'user' THEN 'EMPLOYEE'::app_role_canonical
    ELSE 'EMPLOYEE'::app_role_canonical
  END
  WHERE role_canonical IS NULL;
END;
$$;

-- Ejecutar la migración
SELECT migrate_roles_to_canonical();

-- Crear función actualizada para obtener rol canónico
CREATE OR REPLACE FUNCTION public.get_user_role_canonical(_user_id uuid)
RETURNS app_role_canonical
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role_canonical
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role_canonical
      WHEN 'OWNER' THEN 1
      WHEN 'ADMIN' THEN 2
      WHEN 'MANAGER' THEN 3
      WHEN 'DIRECTOR' THEN 4
      WHEN 'EMPLOYEE' THEN 5
    END
  LIMIT 1
$$;

-- Función para verificar si un usuario tiene un rol específico (versión canónica)
CREATE OR REPLACE FUNCTION public.has_role_canonical(_user_id uuid, _role app_role_canonical)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role_canonical = _role
  )
$$;

-- Función para verificar si es admin (versión canónica)
CREATE OR REPLACE FUNCTION public.is_admin_canonical(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role_canonical IN ('ADMIN', 'OWNER')
  )
$$;