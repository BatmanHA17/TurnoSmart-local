-- FASE 1: Limpieza de Roles Duplicados y Sincronización Automática
-- Objetivo: Eliminar jefe_departamento, mantener solo manager, y sincronizar con user_roles

-- 1. Actualizar colaboradores con jefe_departamento a usar manager
UPDATE colaborador_roles 
SET role = 'manager'::hotel_role
WHERE role = 'jefe_departamento'::hotel_role AND activo = true;

-- 2. Actualizar user_roles para reflejar MANAGER canónico para todos los managers
UPDATE user_roles ur
SET role_canonical = 'MANAGER'::app_role_canonical
FROM colaborador_roles cr
JOIN colaboradores c ON c.id = cr.colaborador_id
JOIN profiles p ON p.email = c.email
WHERE ur.user_id = p.id 
  AND cr.role = 'manager'::hotel_role 
  AND cr.activo = true;

-- 3. Crear función de sincronización automática entre colaborador_roles y user_roles
CREATE OR REPLACE FUNCTION sync_colaborador_to_user_role()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id uuid;
  canonical_role app_role_canonical;
BEGIN
  -- Obtener user_id del colaborador vinculado a través del email
  SELECT p.id INTO target_user_id
  FROM profiles p
  JOIN colaboradores c ON c.email = p.email
  WHERE c.id = NEW.colaborador_id AND p.deleted_at IS NULL;
  
  -- Si no hay user vinculado, no hay nada que sincronizar
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Mapear rol de colaborador_roles (hotel_role) a rol canónico de user_roles (app_role_canonical)
  canonical_role := CASE 
    WHEN NEW.role::text = 'propietario' THEN 'OWNER'::app_role_canonical
    WHEN NEW.role::text = 'administrador' THEN 'ADMIN'::app_role_canonical
    WHEN NEW.role::text = 'director' THEN 'DIRECTOR'::app_role_canonical
    WHEN NEW.role::text = 'manager' OR NEW.role::text = 'jefe_departamento' THEN 'MANAGER'::app_role_canonical
    WHEN NEW.role::text = 'empleado' THEN 'EMPLOYEE'::app_role_canonical
    ELSE 'EMPLOYEE'::app_role_canonical
  END;
  
  -- Actualizar o insertar en user_roles
  INSERT INTO user_roles (user_id, role_canonical)
  VALUES (target_user_id, canonical_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role_canonical = EXCLUDED.role_canonical;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear trigger para sincronización automática en INSERT/UPDATE de colaborador_roles
DROP TRIGGER IF EXISTS sync_role_on_colaborador_role_change ON colaborador_roles;
CREATE TRIGGER sync_role_on_colaborador_role_change
AFTER INSERT OR UPDATE ON colaborador_roles
FOR EACH ROW
WHEN (NEW.activo = true)
EXECUTE FUNCTION sync_colaborador_to_user_role();

-- 5. Ejecutar sincronización manual una vez para asegurar consistencia actual
DO $$
DECLARE
  rec RECORD;
  canonical_role app_role_canonical;
BEGIN
  FOR rec IN 
    SELECT DISTINCT
      p.id as user_id,
      cr.role as current_role
    FROM colaborador_roles cr
    JOIN colaboradores c ON c.id = cr.colaborador_id
    JOIN profiles p ON p.email = c.email
    WHERE cr.activo = true AND p.deleted_at IS NULL
  LOOP
    -- Mapear rol hotel_role a app_role_canonical
    canonical_role := CASE 
      WHEN rec.current_role::text = 'propietario' THEN 'OWNER'::app_role_canonical
      WHEN rec.current_role::text = 'administrador' THEN 'ADMIN'::app_role_canonical
      WHEN rec.current_role::text = 'director' THEN 'DIRECTOR'::app_role_canonical
      WHEN rec.current_role::text = 'manager' OR rec.current_role::text = 'jefe_departamento' THEN 'MANAGER'::app_role_canonical
      WHEN rec.current_role::text = 'empleado' THEN 'EMPLOYEE'::app_role_canonical
      ELSE 'EMPLOYEE'::app_role_canonical
    END;
    
    -- Actualizar user_roles
    UPDATE user_roles 
    SET role_canonical = canonical_role
    WHERE user_id = rec.user_id;
  END LOOP;
END $$;