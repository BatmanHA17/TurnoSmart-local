-- =============================================================================
-- SEED: Datos de prueba para TurnoSmart® — Motor SMART v2.0
-- Org: Recepción (eb228f04-a473-4d2d-8bf8-99c7f08d8c5c)
-- 7 empleados: 1 FOM + 1 Night Agent + 1 GEX + 4 Front Desk Agents
-- =============================================================================

DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
  v_fom_id UUID := gen_random_uuid();
  v_fda4_id UUID := gen_random_uuid();
  v_night_id UUID := gen_random_uuid();
  v_gex_id UUID := gen_random_uuid();
  v_fda1_id UUID := gen_random_uuid();
  v_fda2_id UUID := gen_random_uuid();
  v_fda3_id UUID := gen_random_uuid();
BEGIN
  -- Obtener org_id dinámicamente (cambia en cada reset)
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'recepcion' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Org recepcion no encontrada — ejecutar km0 migrations primero';
  END IF;

-- ----------------------------------------------------------------
-- 0. USUARIO ADMIN (persiste tras db reset)
-- ----------------------------------------------------------------
-- Crear usuario admin en auth.users con UUID fijo para desarrollo local
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
VALUES (
  v_admin_id,
  '00000000-0000-0000-0000-000000000000',
  'goturnosmart@gmail.com',
  crypt('TurnoSmart2026!', gen_salt('bf')),
  now(),
  'authenticated', 'authenticated',
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Super Admin"}',
  false,
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Crear identidad para el usuario (necesaria para magic link)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at
)
VALUES (
  v_admin_id,
  v_admin_id,
  jsonb_build_object('sub', v_admin_id::text, 'email', 'goturnosmart@gmail.com'),
  'email',
  'goturnosmart@gmail.com',
  now(), now(), now()
) ON CONFLICT DO NOTHING;

-- Perfil
INSERT INTO profiles (id, email, display_name, is_active)
VALUES (v_admin_id, 'goturnosmart@gmail.com', 'Super Admin TurnoSmart', true)
ON CONFLICT (id) DO NOTHING;

-- Super admin
INSERT INTO super_admins (user_id)
VALUES (v_admin_id)
ON CONFLICT DO NOTHING;

-- Membership OWNER en la org
INSERT INTO memberships (user_id, org_id, role, status)
VALUES (v_admin_id, v_org_id, 'OWNER'::app_role_canonical, 'active')
ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'OWNER', status = 'active';

-- ----------------------------------------------------------------
-- 1. COLABORADORES (empleados de recepción)
-- ----------------------------------------------------------------
INSERT INTO colaboradores (id, org_id, nombre, apellidos, email, department, status, tipo_contrato, tiempo_trabajo_semanal, fecha_inicio_contrato) VALUES
  (v_fom_id,   v_org_id, 'FOM',              NULL, 'fom@hotel.com',          'Recepción', 'activo', 'Indefinido', 40, '2023-01-15'),
  (v_fda4_id,  v_org_id, 'Front Desk',       '4',  'fda4@hotel.com',         'Recepción', 'activo', 'Indefinido', 40, '2023-03-01'),
  (v_night_id, v_org_id, 'Night Agent',      NULL, 'night@hotel.com',        'Recepción', 'activo', 'Indefinido', 40, '2022-09-01'),
  (v_gex_id,   v_org_id, 'GEX',              NULL, 'gex@hotel.com',          'Recepción', 'activo', 'Indefinido', 40, '2024-02-01'),
  (v_fda1_id,  v_org_id, 'Front Desk',       '1',  'fda1@hotel.com',         'Recepción', 'activo', 'Indefinido', 40, '2023-06-15'),
  (v_fda2_id,  v_org_id, 'Front Desk',       '2',  'fda2@hotel.com',         'Recepción', 'activo', 'Indefinido', 40, '2024-01-10'),
  (v_fda3_id,  v_org_id, 'Front Desk',       '3',  'fda3@hotel.com',         'Recepción', 'activo', 'Indefinido', 40, '2023-11-01')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 2. EQUITY inicial (para que el motor arranque con historial cero)
-- ----------------------------------------------------------------
INSERT INTO employee_equity (
  employee_id, organization_id,
  period_start, period_end,
  morning_count, afternoon_count, night_count,
  long_weekend_count, weekend_worked_count
) VALUES
  (v_fom_id,   v_org_id, '2026-02-01', '2026-02-28', 18, 0, 0, 1, 8),
  (v_fda4_id,  v_org_id, '2026-02-01', '2026-02-28', 9, 9, 4, 1, 5),
  (v_night_id, v_org_id, '2026-02-01', '2026-02-28', 0, 0, 20, 0, 12),
  (v_gex_id,   v_org_id, '2026-02-01', '2026-02-28', 10, 8, 0, 1, 4),
  (v_fda1_id,  v_org_id, '2026-02-01', '2026-02-28', 10, 8, 5, 1, 6),
  (v_fda2_id,  v_org_id, '2026-02-01', '2026-02-28', 8, 10, 5, 1, 5),
  (v_fda3_id,  v_org_id, '2026-02-01', '2026-02-28', 9, 9, 5, 0, 7)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 3. PETICIONES de prueba — marzo 2026
-- ----------------------------------------------------------------
-- Laura (FOM): petición dura — libre el día 15 (festivo local)
INSERT INTO schedule_petitions (
  organization_id, employee_id, type, status,
  days, period_start, period_end, reason
) VALUES (
  v_org_id, v_fom_id, 'A', 'approved',
  ARRAY[15]::int[],
  '2026-03-01', '2026-03-31',
  'Festivo local — La Palma'
) ON CONFLICT DO NOTHING;

-- María López (FDA1): petición blanda — prefiere mañanas semana del 17
INSERT INTO schedule_petitions (
  organization_id, employee_id, type, status,
  days, requested_shift, period_start, period_end, reason
) VALUES (
  v_org_id, v_fda1_id, 'B', 'approved',
  ARRAY[17, 18, 19, 20, 21]::int[],
  'M',
  '2026-03-01', '2026-03-31',
  'Cita médica por las tardes esa semana'
) ON CONFLICT DO NOTHING;

-- Jorge García (FDA2): solicita vacaciones días 25-28
INSERT INTO schedule_petitions (
  organization_id, employee_id, type, status,
  days, period_start, period_end, reason
) VALUES (
  v_org_id, v_fda2_id, 'A', 'approved',
  ARRAY[25, 26, 27, 28]::int[],
  '2026-03-01', '2026-03-31',
  'Vacaciones — semana santa'
) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 4. OCUPACIÓN diaria — marzo 2026 (simulación check-ins típicos)
-- ----------------------------------------------------------------
INSERT INTO daily_occupancy (organization_id, date, check_ins, check_outs, notes)
SELECT
  v_org_id,
  ('2026-03-' || LPAD(d::text, 2, '0'))::date,
  CASE
    WHEN d IN (7, 8, 14, 15, 21, 22, 28, 29) THEN 45  -- fines de semana: más ocupación
    WHEN d BETWEEN 24 AND 28 THEN 55                   -- semana santa: pico
    ELSE 25                                             -- días laborables: normal
  END,
  CASE
    WHEN d IN (7, 8, 14, 15, 21, 22, 28, 29) THEN 40
    WHEN d BETWEEN 24 AND 28 THEN 50
    ELSE 20
  END,
  NULL
FROM generate_series(1, 31) AS d
ON CONFLICT (organization_id, date) DO NOTHING;

-- ----------------------------------------------------------------
-- 5. RBAC: Crear auth.users para cada empleado y vincular
-- FOM + Front Desk 4 (AFOM) → ADMIN | Resto → USER
-- ----------------------------------------------------------------
DECLARE
  v_emp RECORD;
  v_uid UUID;
  v_emp_role app_role_canonical;
BEGIN
  FOR v_emp IN
    SELECT id, nombre, apellidos, email
    FROM colaboradores
    WHERE org_id = v_org_id AND user_id IS NULL AND email IS NOT NULL
  LOOP
    v_uid := gen_random_uuid();

    -- FOM y AFOM (Front Desk 4) → ADMIN, resto → USER
    IF v_emp.nombre = 'FOM' OR (v_emp.nombre = 'Front Desk' AND v_emp.apellidos = '4') THEN
      v_emp_role := 'ADMIN';
    ELSE
      v_emp_role := 'USER';
    END IF;

    -- auth.user
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      role, aud, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000',
      v_emp.email, crypt('TurnoSmart2026!', gen_salt('bf')), now(),
      'authenticated', 'authenticated', now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', v_emp.nombre || COALESCE(' ' || v_emp.apellidos, '')),
      false, '', '', '', ''
    ) ON CONFLICT DO NOTHING;

    -- identity
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at
    ) VALUES (
      v_uid, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_emp.email),
      'email', v_emp.email, now(), now(), now()
    ) ON CONFLICT DO NOTHING;

    -- profile
    INSERT INTO profiles (id, email, display_name, is_active)
    VALUES (v_uid, v_emp.email, v_emp.nombre || COALESCE(' ' || v_emp.apellidos, ''), true)
    ON CONFLICT (id) DO NOTHING;

    -- membership
    INSERT INTO memberships (user_id, org_id, role, status)
    VALUES (v_uid, v_org_id, v_emp_role, 'active')
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = v_emp_role, status = 'active';

    -- vincular colaborador ↔ auth.user
    UPDATE colaboradores SET user_id = v_uid WHERE id = v_emp.id;
  END LOOP;
END;

-- ----------------------------------------------------------------
-- 6. KIT DE HORARIOS POR DEFECTO (M/T/N/11x19/9x17/12x20/G)
-- ----------------------------------------------------------------
INSERT INTO saved_shifts (name, start_time, end_time, color, access_type, break_type, break_duration, has_break, total_break_time, org_id, is_additional_time)
VALUES
  ('Mañana',     '07:00', '15:00', '#3b82f6', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('Tarde',      '15:00', '23:00', '#f59e0b', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('Noche',      '23:00', '07:00', '#8b5cf6', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('Transición', '11:00', '19:00', '#06b6d4', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('GEX Mañana', '09:00', '17:00', '#0ea5e9', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('GEX Tarde',  '12:00', '20:00', '#14b8a6', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('Guardia',    '09:00', '21:00', '#ef4444', 'company', null,   '0',  false, 0,  v_org_id, false)
ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ Seed completado: 7 empleados + RBAC + 7 horarios por defecto, equity feb-2026, 3 peticiones, 31 días ocupación';
END $$;
