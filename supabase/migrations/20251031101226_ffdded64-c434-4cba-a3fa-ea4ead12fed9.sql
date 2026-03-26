-- PASO 1: Arreglar la función sync_colaborador_to_user_role
CREATE OR REPLACE FUNCTION sync_colaborador_to_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  canonical_role app_role_canonical;
BEGIN
  SELECT p.id INTO target_user_id
  FROM profiles p
  JOIN colaboradores c ON c.email = p.email
  WHERE c.id = NEW.colaborador_id AND p.deleted_at IS NULL;
  
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  canonical_role := CASE 
    WHEN NEW.role::text = 'propietario' THEN 'OWNER'::app_role_canonical
    WHEN NEW.role::text = 'administrador' THEN 'ADMIN'::app_role_canonical
    WHEN NEW.role::text = 'director' THEN 'DIRECTOR'::app_role_canonical
    WHEN NEW.role::text = 'manager' OR NEW.role::text = 'jefe_departamento' THEN 'MANAGER'::app_role_canonical
    WHEN NEW.role::text = 'empleado' THEN 'EMPLOYEE'::app_role_canonical
    ELSE 'EMPLOYEE'::app_role_canonical
  END;
  
  DELETE FROM user_roles WHERE user_id = target_user_id;
  INSERT INTO user_roles (user_id, role_canonical)
  VALUES (target_user_id, canonical_role);
  
  RETURN NEW;
END;
$$;

-- PASO 2: Actualizar org_id NULL y hacer NOT NULL
UPDATE colaborador_roles
SET org_id = (
  SELECT m.org_id 
  FROM memberships m 
  WHERE m.role = 'OWNER' AND m.primary = true 
  LIMIT 1
)
WHERE org_id IS NULL;

ALTER TABLE colaborador_roles
ALTER COLUMN org_id SET NOT NULL;