-- Actualizar el convenio existente a estado pending_review
UPDATE collective_agreements 
SET status = 'pending_review',
    extraction_data = '{"groups_count": 3, "levels_count": 6, "confidence": 0.85}'::jsonb
WHERE id = 'cd2140c0-179d-4368-9195-610dafb2e291';

-- Insertar grupos profesionales de prueba
INSERT INTO professional_groups (agreement_id, org_id, group_code, group_name, description, order_index) VALUES 
('cd2140c0-179d-4368-9195-610dafb2e291', 'ae3db3e5-00ec-43c3-a3de-a245de33729d', 'GRUPO_I', 'Personal Directivo', 'Gerentes, directores y personal de alta dirección', 1),
('cd2140c0-179d-4368-9195-610dafb2e291', 'ae3db3e5-00ec-43c3-a3de-a245de33729d', 'GRUPO_II', 'Personal Técnico Superior', 'Técnicos superiores, jefes de departamento y especialistas', 2),
('cd2140c0-179d-4368-9195-610dafb2e291', 'ae3db3e5-00ec-43c3-a3de-a245de33729d', 'GRUPO_III', 'Personal Cualificado', 'Empleados con formación específica y experiencia', 3);

-- Insertar niveles salariales de prueba asociados a los grupos
-- Primero obtenemos los IDs de los grupos insertados
WITH groups_data AS (
  SELECT id, group_code FROM professional_groups 
  WHERE agreement_id = 'cd2140c0-179d-4368-9195-610dafb2e291'
)
INSERT INTO salary_levels (agreement_id, org_id, professional_group_id, level_code, level_name, base_salary, currency, period, description, order_index)
SELECT 
  'cd2140c0-179d-4368-9195-610dafb2e291',
  'ae3db3e5-00ec-43c3-a3de-a245de33729d',
  g.id,
  level_data.level_code,
  level_data.level_name,
  level_data.base_salary,
  'EUR',
  'anual',
  level_data.description,
  level_data.order_index
FROM groups_data g
CROSS JOIN LATERAL (
  VALUES 
    -- Niveles para GRUPO_I (Personal Directivo)
    ('NIVEL_1', 'Director General', 55000, 'Máximo responsable del establecimiento', 1),
    ('NIVEL_2', 'Subdirector/Gerente', 45000, 'Personal de dirección intermedia', 2)
) AS level_data(level_code, level_name, base_salary, description, order_index)
WHERE g.group_code = 'GRUPO_I'

UNION ALL

SELECT 
  'cd2140c0-179d-4368-9195-610dafb2e291',
  'ae3db3e5-00ec-43c3-a3de-a245de33729d',
  g.id,
  level_data.level_code,
  level_data.level_name,
  level_data.base_salary,
  'EUR',
  'anual',
  level_data.description,
  level_data.order_index
FROM groups_data g
CROSS JOIN LATERAL (
  VALUES 
    -- Niveles para GRUPO_II (Personal Técnico Superior)
    ('NIVEL_1', 'Jefe de Departamento', 35000, 'Responsable de área específica', 1),
    ('NIVEL_2', 'Técnico Superior', 30000, 'Especialista con formación superior', 2)
) AS level_data(level_code, level_name, base_salary, description, order_index)
WHERE g.group_code = 'GRUPO_II'

UNION ALL

SELECT 
  'cd2140c0-179d-4368-9195-610dafb2e291',
  'ae3db3e5-00ec-43c3-a3de-a245de33729d',
  g.id,
  level_data.level_code,
  level_data.level_name,
  level_data.base_salary,
  'EUR',
  'anual',
  level_data.description,
  level_data.order_index
FROM groups_data g
CROSS JOIN LATERAL (
  VALUES 
    -- Niveles para GRUPO_III (Personal Cualificado)
    ('NIVEL_1', 'Empleado Especialista', 25000, 'Personal con experiencia y cualificación específica', 1),
    ('NIVEL_2', 'Empleado Base', 20000, 'Personal de entrada con formación básica', 2)
) AS level_data(level_code, level_name, base_salary, description, order_index)
WHERE g.group_code = 'GRUPO_III';