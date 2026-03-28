-- Eliminar AMBOS constraints antiguos que causan conflictos
ALTER TABLE colaborador_roles
DROP CONSTRAINT IF EXISTS colaborador_roles_colaborador_id_role_departamento_key;

ALTER TABLE colaborador_roles
DROP CONSTRAINT IF EXISTS colaborador_roles_unique_active;

-- Asegurar que el constraint correcto con org_id existe
-- (si ya existe, esto no hará nada por el IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'colaborador_roles_unique_per_org'
  ) THEN
    ALTER TABLE colaborador_roles
    ADD CONSTRAINT colaborador_roles_unique_per_org 
    UNIQUE (colaborador_id, role, departamento, org_id);
  END IF;
END $$;