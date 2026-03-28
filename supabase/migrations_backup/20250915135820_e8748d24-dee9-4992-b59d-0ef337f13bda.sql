-- Eliminar empleados que coinciden con los nombres de la imagen
-- Carlos López (encontramos Juan López que coincide)
DELETE FROM employees WHERE name = 'Juan López';

-- María García (encontramos Luis García que coincide)
DELETE FROM employees WHERE name = 'Luis García';

-- Ana Ruiz (encontramos Ana Martín que coincide parcialmente)
DELETE FROM employees WHERE name = 'Ana Martín';

-- Francisco Ruiz (coincide con Ana Ruiz de la imagen)
DELETE FROM employees WHERE name = 'Francisco Ruiz';

-- Sergio (encontramos Sergio Blanco)
DELETE FROM employees WHERE name = 'Sergio Blanco';

-- Carlos (encontramos Carlos Mendoza)
DELETE FROM employees WHERE name = 'Carlos Mendoza';

-- María (encontramos María Rodríguez)
DELETE FROM employees WHERE name = 'María Rodríguez';

-- También eliminar cualquier turno asignado en calendar_shifts para estos empleados
DELETE FROM calendar_shifts WHERE employee_id IN (
  '3fa980df-9984-4d25-9267-706975bf7078',
  'b7e37000-2561-45a1-99c7-ee8431f9985d', 
  '79effcb5-07a5-4b2f-a213-a1de894c003a',
  '7bed119e-d671-4308-a915-9152117bb6e4',
  'adc0c116-f3ff-4db8-821c-b645a66c4c2e',
  '02a2559c-ce39-41ed-bde6-645d6156f054',
  '338e50e6-5eaa-44a0-ad16-b6faa0119e3c'
);