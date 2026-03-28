-- PASO 1: Arreglar la función sync_colaborador_to_user_role
-- La tabla user_roles tiene UNIQUE (user_id, role), no solo (user_id)
CREATE OR REPLACE FUNCTION sync_colaborador_to_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  
  -- Eliminar todos los roles anteriores del usuario y asignar el nuevo
  -- Esto evita conflictos con el constraint UNIQUE (user_id, role)
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  INSERT INTO user_roles (user_id, role_canonical)
  VALUES (target_user_id, canonical_role);
  
  RETURN NEW;
END;
$$;

-- PASO 2: Aplicar la migración de colaborador_roles
-- 2.1 Actualizar todas las filas con org_id NULL
UPDATE colaborador_roles
SET org_id = (
  SELECT m.org_id 
  FROM memberships m 
  WHERE m.role = 'OWNER' AND m.primary = true 
  LIMIT 1
)
WHERE org_id IS NULL;

-- 2.2 Eliminar el constraint antiguo
ALTER TABLE colaborador_roles
DROP CONSTRAINT IF EXISTS colaborador_roles_unique_active;

-- 2.3 Crear un nuevo constraint que INCLUYA org_id
ALTER TABLE colaborador_roles
ADD CONSTRAINT colaborador_roles_unique_per_org 
UNIQUE (colaborador_id, role, departamento, org_id);

-- 2.4 Hacer org_id NOT NULL
ALTER TABLE colaborador_roles
ALTER COLUMN org_id SET NOT NULL;