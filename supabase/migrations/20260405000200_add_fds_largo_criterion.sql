-- Add FDS Largo (Long Weekend) optional criterion
-- Disabled by default — user can enable it in Config/Criterios

INSERT INTO schedule_criteria (organization_id, criteria_key, criteria_name, description, enabled, boost, category, code, subcategory, severity, config_json, sort_order)
SELECT
  org.id,
  'FDS_LARGO',
  'Fin de semana largo (4 días) mensual',
  'Cada empleado recibe 1 fin de semana largo al mes: S-D + L-M consecutivos (4 días libres). Los empleados se escalonan para mantener cobertura.',
  false,
  3,
  'optional',
  'OP-FDS',
  'Equidad',
  'warning',
  '{}'::jsonb,
  40
FROM organizations org
WHERE NOT EXISTS (
  SELECT 1 FROM schedule_criteria sc
  WHERE sc.organization_id = org.id AND sc.criteria_key = 'FDS_LARGO'
);
