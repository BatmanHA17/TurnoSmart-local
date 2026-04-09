-- ============================================================================
-- Restaurar turnos históricos: 27-30 Abril 2026
-- Ejecutar en Supabase Cloud SQL Editor
-- ============================================================================

BEGIN;

-- Step 1: Map employee names to IDs
CREATE TEMP TABLE _emp_map (display_name TEXT PRIMARY KEY, emp_id UUID);

INSERT INTO _emp_map (display_name, emp_id)
  SELECT 'Triana', id FROM colaboradores
  WHERE org_id = 'cb96a2ec-ed6b-4c55-bef7-509dd9116feb' AND nombre = 'Triana' LIMIT 1;

INSERT INTO _emp_map (display_name, emp_id)
  SELECT 'Belén', id FROM colaboradores
  WHERE org_id = 'cb96a2ec-ed6b-4c55-bef7-509dd9116feb' AND nombre = 'Belén' LIMIT 1;

INSERT INTO _emp_map (display_name, emp_id)
  SELECT 'Manuel', id FROM colaboradores
  WHERE org_id = 'cb96a2ec-ed6b-4c55-bef7-509dd9116feb' AND nombre = 'Manuel' LIMIT 1;

INSERT INTO _emp_map (display_name, emp_id)
  SELECT 'Elena D.', id FROM colaboradores
  WHERE org_id = 'cb96a2ec-ed6b-4c55-bef7-509dd9116feb' AND nombre = 'Elena D.' LIMIT 1;

INSERT INTO _emp_map (display_name, emp_id)
  SELECT 'Vera', id FROM colaboradores
  WHERE org_id = 'cb96a2ec-ed6b-4c55-bef7-509dd9116feb' AND nombre = 'Vera' LIMIT 1;

INSERT INTO _emp_map (display_name, emp_id)
  SELECT 'Eva', id FROM colaboradores
  WHERE org_id = 'cb96a2ec-ed6b-4c55-bef7-509dd9116feb' AND nombre = 'Eva' LIMIT 1;

INSERT INTO _emp_map (display_name, emp_id)
  SELECT 'Nuevo 3', id FROM colaboradores
  WHERE org_id = 'cb96a2ec-ed6b-4c55-bef7-509dd9116feb' AND nombre = 'Nuevo 3' LIMIT 1;

INSERT INTO _emp_map (display_name, emp_id)
  SELECT 'Margarita', id FROM colaboradores
  WHERE org_id = 'cb96a2ec-ed6b-4c55-bef7-509dd9116feb' AND nombre = 'Margarita' LIMIT 1;

-- Step 2: Clean any existing shifts for these dates (avoid duplicates)
DELETE FROM calendar_shifts
WHERE org_id = 'cb96a2ec-ed6b-4c55-bef7-509dd9116feb'
  AND date BETWEEN '2026-04-27' AND '2026-04-30';

-- Step 3: Insert 32 shifts (8 employees × 4 days)
INSERT INTO calendar_shifts (org_id, employee_id, date, start_time, end_time, shift_name, color, source, is_historical)
VALUES
  -- Triana: D, M, M, M
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Triana'), '2026-04-27', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Triana'), '2026-04-28', '07:00', '15:00', 'M', '#fef3c7', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Triana'), '2026-04-29', '07:00', '15:00', 'M', '#fef3c7', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Triana'), '2026-04-30', '07:00', '15:00', 'M', '#fef3c7', 'historical', true),
  -- Belén: N, N, N, D
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Belén'), '2026-04-27', '23:00', '07:00', 'N', '#c7d2fe', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Belén'), '2026-04-28', '23:00', '07:00', 'N', '#c7d2fe', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Belén'), '2026-04-29', '23:00', '07:00', 'N', '#c7d2fe', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Belén'), '2026-04-30', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  -- Manuel: D, D, F, N
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Manuel'), '2026-04-27', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Manuel'), '2026-04-28', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Manuel'), '2026-04-29', NULL, NULL, 'F', '#e5e7eb', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Manuel'), '2026-04-30', '23:00', '07:00', 'N', '#c7d2fe', 'historical', true),
  -- Elena D.: T, T, D, D
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Elena D.'), '2026-04-27', '15:00', '23:00', 'T', '#fed7aa', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Elena D.'), '2026-04-28', '15:00', '23:00', 'T', '#fed7aa', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Elena D.'), '2026-04-29', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Elena D.'), '2026-04-30', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  -- Vera: N, D, D, T
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Vera'), '2026-04-27', '23:00', '07:00', 'N', '#c7d2fe', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Vera'), '2026-04-28', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Vera'), '2026-04-29', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Vera'), '2026-04-30', '15:00', '23:00', 'T', '#fed7aa', 'historical', true),
  -- Eva: M, M, T, M
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Eva'), '2026-04-27', '07:00', '15:00', 'M', '#fef3c7', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Eva'), '2026-04-28', '07:00', '15:00', 'M', '#fef3c7', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Eva'), '2026-04-29', '15:00', '23:00', 'T', '#fed7aa', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Eva'), '2026-04-30', '07:00', '15:00', 'M', '#fef3c7', 'historical', true),
  -- Nuevo 3: T, T, T, D
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Nuevo 3'), '2026-04-27', '15:00', '23:00', 'T', '#fed7aa', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Nuevo 3'), '2026-04-28', '15:00', '23:00', 'T', '#fed7aa', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Nuevo 3'), '2026-04-29', '15:00', '23:00', 'T', '#fed7aa', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Nuevo 3'), '2026-04-30', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  -- Margarita: D, D, 9x17, 9x17
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Margarita'), '2026-04-27', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Margarita'), '2026-04-28', NULL, NULL, 'D', '#d1d5db', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Margarita'), '2026-04-29', '09:00', '17:00', '9x17', '#fde68a', 'historical', true),
  ('cb96a2ec-ed6b-4c55-bef7-509dd9116feb', (SELECT emp_id FROM _emp_map WHERE display_name = 'Margarita'), '2026-04-30', '09:00', '17:00', '9x17', '#fde68a', 'historical', true);

-- Cleanup
DROP TABLE _emp_map;

COMMIT;
