-- Limpieza única de roles duplicados activos
-- Desactivar todos los roles excepto el más reciente/prioritario por colaborador
WITH ranked_roles AS (
  SELECT 
    id,
    colaborador_id,
    org_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY colaborador_id, org_id 
      ORDER BY 
        CASE role 
          WHEN 'propietario' THEN 1
          WHEN 'administrador' THEN 2
          WHEN 'director' THEN 3
          WHEN 'manager' THEN 4
          ELSE 5
        END,
        asignado_en DESC
    ) as rn
  FROM colaborador_roles
  WHERE activo = true
)
UPDATE colaborador_roles
SET activo = false
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);