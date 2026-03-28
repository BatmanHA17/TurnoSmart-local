-- Primero, limpiar duplicados si existen (mantener solo el más reciente por grupo)
DELETE FROM colaborador_roles a
USING colaborador_roles b
WHERE a.id < b.id 
  AND a.colaborador_id = b.colaborador_id 
  AND a.role = b.role 
  AND COALESCE(a.departamento, '') = COALESCE(b.departamento, '');

-- Agregar constraint único para evitar duplicados
ALTER TABLE colaborador_roles
ADD CONSTRAINT colaborador_roles_unique_active 
UNIQUE (colaborador_id, role, departamento);