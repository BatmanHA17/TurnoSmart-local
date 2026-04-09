-- Add historical employees (no longer active) to Hotel Victoria
-- These employees appear in the real shift data (Aug 2025 - Mar 2026) but are no longer on the team

DO $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE name ILIKE '%victoria%' LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Hotel Victoria not found, skipping historical employees';
    RETURN;
  END IF;

  -- Alicia (FDA) - excedencia desde Enero 2026
  INSERT INTO colaboradores (nombre, apellidos, org_id, engine_role, status, fecha_antiguedad, can_cover_nights, tiempo_trabajo_semanal)
  VALUES ('Alicia', 'Histórico', v_org_id, 'ROTA_COMPLETO', 'inactivo', '2020-06-01', true, 40)
  ON CONFLICT DO NOTHING;

  -- Clara (FDA) - fin contrato Marzo 2026
  INSERT INTO colaboradores (nombre, apellidos, org_id, engine_role, status, fecha_antiguedad, can_cover_nights, tiempo_trabajo_semanal)
  VALUES ('Clara', 'Histórico', v_org_id, 'ROTA_COMPLETO', 'inactivo', '2021-09-01', true, 40)
  ON CONFLICT DO NOTHING;

  -- Elena AFOM - excedencia fin Febrero 2026 (NOT Elena D. who is a different person/FDA)
  INSERT INTO colaboradores (nombre, apellidos, org_id, engine_role, status, fecha_antiguedad, can_cover_nights, tiempo_trabajo_semanal)
  VALUES ('Elena', 'AFOM Histórico', v_org_id, 'AFOM', 'inactivo', '2019-01-01', true, 40)
  ON CONFLICT DO NOTHING;

END $$;
