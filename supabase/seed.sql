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
  ('Mañana',     '07:00', '15:00', '#fbbf24', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('Tarde',      '15:00', '23:00', '#f97316', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('Noche',      '23:00', '07:00', '#6366f1', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('Transición', '11:00', '19:00', '#fb923c', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('GEX Mañana', '09:00', '17:00', '#fcd34d', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('GEX Tarde',  '12:00', '20:00', '#fdba74', 'company', 'meal', '30', true,  30, v_org_id, false),
  ('Guardia',    '09:00', '21:00', '#f87171', 'company', null,   '0',  false, 0,  v_org_id, false)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 7. CATÁLOGO 92 CRITERIOS SMART v3 (seed automático)
-- ----------------------------------------------------------------
INSERT INTO schedule_criteria (organization_id, criteria_key, criteria_name, description, enabled, boost, category, code, subcategory, severity, config_json, sort_order)
VALUES
  (v_org_id, '12H_REST', 'Descanso mínimo 12h entre jornadas', 'Prohibido T→M (turno pijama). Mínimo 12 horas entre fin de un turno e inicio del siguiente', true, 5, 'mandatory', 'OB-01', 'Legal', 'blocker', '{}'::jsonb, 1),
  (v_org_id, 'CONSECUTIVE_REST_DAYS', '2 días libres consecutivos por semana', 'Los descansos semanales deben ser consecutivos. Solo excepción con validación del jefe + aceptación del empleado', true, 5, 'mandatory', 'OB-02', 'Legal', 'blocker', '{}'::jsonb, 2),
  (v_org_id, 'NIGHT_THEN_REST', 'Salida de noche → día siguiente libre', 'Después de turno N (23:00-07:00), el día siguiente es obligatoriamente libre/descanso. Solo ROTA_COMPLETO, no Night Agent fijo', true, 5, 'mandatory', 'OB-03', 'Legal', 'blocker', '{}'::jsonb, 3),
  (v_org_id, 'MAX_WEEKLY_HOURS', 'Máximo 40h semanales', 'Jornada máxima semanal 40h (futura reforma 37.5h). Toggle configurable', true, 5, 'mandatory', 'OB-04', 'Legal', 'error', '{"maxHours":40,"futureMaxHours":37.5}'::jsonb, 4),
  (v_org_id, 'VACATION_48_DAYS', '48 días vacaciones/año (hostelería)', '30 días naturales + 18 festivos trabajados compensados', true, 4, 'mandatory', 'OB-05', 'Legal', 'error', '{"naturalDays":30,"holidayDays":18}'::jsonb, 5),
  (v_org_id, 'HOLIDAY_COMPENSATION', 'Festivos trabajados = compensación', 'Si festivo cae en día laboral y se trabaja, genera F y día compensatorio', true, 4, 'mandatory', 'OB-06', 'Legal', 'error', '{}'::jsonb, 6),
  (v_org_id, 'MAX_ANNUAL_HOURS', 'Jornada máxima anual 1.792h', 'Control de horas acumuladas anuales según convenio hostelería', true, 3, 'mandatory', 'OB-07', 'Legal', 'warning', '{"maxAnnualHours":1792}'::jsonb, 7),
  (v_org_id, 'MIN_COVERAGE', 'Cobertura mínima por turno', 'Siempre al menos 1 persona por turno activo (M/T/N). Servicio nunca desatendido', true, 5, 'mandatory', 'OB-08', 'Operacional', 'blocker', '{"M":2,"T":2,"N":1}'::jsonb, 8),
  (v_org_id, 'PRE_VACATION_REST', 'Salir librando antes de vacaciones', 'La semana antes de vacaciones, el empleado debe tener sus 2 libres ANTES de inicio de vacaciones', true, 4, 'mandatory', 'OB-09', 'Legal', 'error', '{}'::jsonb, 9),
  (v_org_id, 'GUARD_ONLY_CHIEF', 'Guardia solo para jefes', 'Turnos G (Guardia 9-21) solo asignables a FOM. Guardias siempre en S/D, seleccionadas en wizard', true, 5, 'mandatory', 'OB-10', 'Organización', 'blocker', '{}'::jsonb, 10),
  (v_org_id, 'GEX_OWN_SHIFTS', 'GEX turnos propios', 'Guest Experience Agent solo tiene turnos 9×17 y 12×20, no entra en rotación M/T/N', true, 4, 'mandatory', 'OB-11', 'Organización', 'error', '{}'::jsonb, 11),
  (v_org_id, 'WEEKLY_REST_36H', 'Descanso semanal mínimo 36h consecutivas', 'El convenio hostelería establece 36h consecutivas mínimas de descanso semanal', true, 4, 'mandatory', 'OB-12', 'Legal', 'error', '{}'::jsonb, 12),
  (v_org_id, 'FORCE_MAJEURE_12H', 'Override 12h por fuerza mayor con trazabilidad', 'FOM puede forzar violación 12h en casos excepcionales. Requiere doble confirmación + registro', true, 5, 'mandatory', 'OB-13', 'Legal', 'blocker', '{}'::jsonb, 13),
  (v_org_id, 'SPLIT_REST_CONFLICT', 'Separación libres con conflicto + doble confirmación', 'Si cobertura obliga separar los 2 libres, marca como conflicto y requiere doble confirmación (jefe + empleado)', true, 4, 'mandatory', 'OB-14', 'Legal', 'error', '{}'::jsonb, 14),
  (v_org_id, 'DUAL_VACATION_COUNTER', 'Dos contadores vacaciones separados (30 nat + 18 fest)', 'Contador 1: Vacaciones naturales (30/año). Contador 2: Festivos (18/año). Reset 1 enero', true, 4, 'mandatory', 'OB-15', 'Legal', 'error', '{"naturalDays":30,"holidayDays":18,"alertThreshold":0.8,"alertBeforeMonth":10}'::jsonb, 15),
  (v_org_id, 'FOM_AFOM_MIRROR', 'Espejo FOM ↔ AFOM', 'FOM en M → AFOM en T. FOM libra → AFOM cubre. FOM en G → AFOM libra. Cálculo secuencial', true, 4, 'mandatory', 'OB-16', 'Organización', 'error', '{}'::jsonb, 16),
  (v_org_id, 'NIGHT_COVERAGE_EQUITY', 'Cobertura noches Night Shift Agent por equidad', 'Cuando Night Agent libra, la noche la cubre el FDA con menos noches acumuladas. Sin compensación DB', true, 4, 'mandatory', 'OB-17', 'Equidad', 'error', '{}'::jsonb, 17),
  (v_org_id, 'GEX_BY_OCCUPANCY', 'GEX turno por ocupación (check-ins/check-outs)', 'Algoritmo decide 9x17 o 12x20 según volumen: más check-outs → 9x17; más check-ins → 12x20. Override manual', true, 3, 'mandatory', 'OB-18', 'Operacional', 'warning', '{}'::jsonb, 18),
  (v_org_id, 'LONG_WEEKEND_MONTHLY', 'Fin de semana largo mensual', 'Cada empleado tiene 1 FDS largo al mes: S+D (sem X) + L+M (sem X+1) = 4 días consecutivos', true, 4, 'optional', 'OP-01', 'Equidad', 'warning', '{}'::jsonb, 19),
  (v_org_id, 'ERGONOMIC_ROTATION', 'Rotación ergonómica M→T→N', 'Rotación hacia adelante (nunca N→M directo). Secuencia ideal: M→T→N→Libre', true, 3, 'optional', 'OP-02', 'Ergonomía', 'info', '{}'::jsonb, 20),
  (v_org_id, 'NIGHT_EQUITY', 'Equidad de noches', 'Mismo número de noches (±1 tolerancia) para todos los rotativos en un ciclo', true, 4, 'optional', 'OP-03', 'Equidad', 'warning', '{}'::jsonb, 21),
  (v_org_id, 'WEEKEND_EQUITY', 'Equidad de fines de semana', 'Equilibrar sábados y domingos trabajados entre todos a lo largo del ciclo', true, 4, 'optional', 'OP-04', 'Equidad', 'warning', '{}'::jsonb, 22),
  (v_org_id, 'SHIFT_EQUITY_MTN', 'Equidad M/T/N', 'Cantidad de mañanas, tardes y noches equitativa entre personas (excepto nocturno fijo)', true, 3, 'optional', 'OP-05', 'Equidad', 'warning', '{}'::jsonb, 23),
  (v_org_id, 'ROTATING_REST_DAYS', 'Libres rotativos', 'Los días libres rotan de posición semana a semana: nadie libra siempre lunes ni siempre viernes', true, 3, 'optional', 'OP-06', 'Equidad', 'info', '{}'::jsonb, 24),
  (v_org_id, 'OCCUPANCY_STAFFING', 'Dimensionamiento por ocupación', 'Reforzar turnos según check-in/check-out/eventos. Si hay mucho trabajo, 2+ personas por turno', true, 4, 'optional', 'OP-07', 'Operacional', 'warning', '{}'::jsonb, 25),
  (v_org_id, 'NIGHT_COVER_EQUITY', 'Cobertura equitativa del nocturno', 'Cuando nocturno fijo libra, sus noches se reparten equitativamente entre rotativos', true, 4, 'optional', 'OP-08', 'Equidad', 'warning', '{}'::jsonb, 26),
  (v_org_id, 'UNDESIRABILITY_WEIGHT', 'Peso de indeseabilidad por turno', 'Cada turno tiene peso configurable (N=3, T=2, M=1). Motor equilibra carga ponderada total', true, 3, 'optional', 'OP-09', 'Equidad', 'info', '{"N":3,"T":2,"M":1}'::jsonb, 27),
  (v_org_id, 'ROTATION_CYCLE_LENGTH', 'Duración ciclo rotación', 'Configurable: 4 semanas (default), 6 u 8 semanas', true, 2, 'optional', 'OP-10', 'Configuración', 'info', '{"weeks":4}'::jsonb, 28),
  (v_org_id, 'IMBALANCE_TOLERANCE', 'Tolerancia de desequilibrio', 'Margen permitido de diferencia en horas o nº turnos entre empleados antes de alertar', true, 2, 'optional', 'OP-11', 'Configuración', 'info', '{"toleranceShifts":3,"toleranceHours":3}'::jsonb, 29),
  (v_org_id, 'SMART_IA_FAVORITES', 'Propuesta automática favoritos (SMART+IA)', 'Detecta turnos usados frecuentemente y propone añadirlos a favoritos proactivamente', true, 2, 'optional', 'OP-12', 'IA proactiva', 'info', '{}'::jsonb, 30),
  (v_org_id, 'CUSTOM_COLLECTIVE_AGREEMENT', 'Convenio personalizado por provincia', 'Cargar convenio colectivo específico (PDF/JSON) que sobreescribe reglas genéricas', true, 3, 'optional', 'OP-13', 'Legal', 'info', '{}'::jsonb, 31),
  (v_org_id, 'SOFT_PETITIONS', 'Peticiones blandas de empleados', 'Preferencias tipo ''prefiero librar miércoles''. Peso configurable por el jefe', true, 2, 'optional', 'OP-14', 'Preferencias', 'info', '{}'::jsonb, 32),
  (v_org_id, 'EMPLOYEE_SWAPS', 'Intercambios entre empleados', 'Empleados proponen intercambio de turnos entre ellos, sistema valida que no viole reglas', true, 2, 'optional', 'OP-15', 'Flexibilidad', 'info', '{}'::jsonb, 33),
  (v_org_id, 'MAX_CONSECUTIVE_NIGHTS', 'Máximo noches consecutivas', 'Límite configurable de noches seguidas para rotativos. No aplica a Night Agent fijo', true, 3, 'optional', 'OP-16', 'Ergonomía', 'warning', '{"maxNights":4,"minNights":1,"maxConfigurable":7}'::jsonb, 34),
  (v_org_id, 'PRE_PUBLISH_SIMULATOR', 'Simulador pre-publicación', 'Proyección de horas, impacto de peticiones, comparativa cuadrantes antes de publicar', true, 3, 'optional', 'OP-17', 'Herramienta', 'info', '{}'::jsonb, 35),
  (v_org_id, 'TRANSITION_11X19', 'Turno de transición 11×19', 'Turno especial (11:00-19:00) para transiciones legales N→M, evitando violación de 12h', true, 3, 'optional', 'OP-18', 'Ergonomía', 'info', '{}'::jsonb, 36),
  (v_org_id, 'DB_ACCUMULATOR', 'Acumulador DB (Día Debido)', 'Horas extra > 8h acumuladas = +1 día debido. Contador persistente por empleado', true, 3, 'optional', 'OP-19', 'Compensación', 'info', '{}'::jsonb, 37),
  (v_org_id, 'DG_ACCUMULATOR', 'Acumulador DG (Debido Guardia)', 'Cada guardia G genera +1 DG (día libre debido) para el jefe que la realizó', true, 3, 'optional', 'OP-20', 'Compensación', 'info', '{}'::jsonb, 38),
  (v_org_id, 'HOUR_BANK', 'Bolsa de horas', 'Acumulador de horas extras por coberturas de ausencias. Compensable en tiempo o dinero', true, 3, 'optional', 'OP-21', 'Compensación', 'info', '{}'::jsonb, 39),
  (v_org_id, 'SPLIT_SHIFTS', 'Split shifts (turno partido)', 'Permite turnos partidos (ej. 10-14 + 18-22). Configurable si cuenta como 1 o 2 turnos', false, 2, 'optional', 'OP-22', 'Configuración', 'info', '{}'::jsonb, 40),
  (v_org_id, 'AD_HOC_SHIFTS', 'Turnos ad-hoc desde celda (SMART+IA)', 'FOM escribe horario libre en celda (ej: 14x22). Si lo usa 3+ veces, propone añadir a favoritos', true, 3, 'optional', 'OP-23', 'IA proactiva', 'info', '{}'::jsonb, 41),
  (v_org_id, 'EXTENSIBLE_ABSENCE_TYPES', 'Tipos de ausencia/permiso extensibles', 'Códigos base: D, V, E, F, DB, DG, PM, PC, G. FOM puede crear nuevos tipos manualmente', true, 2, 'optional', 'OP-24', 'Configuración', 'info', '{}'::jsonb, 42),
  (v_org_id, 'DIGITAL_PETITIONS', 'Sistema peticiones digital', 'Flujo: empleado pide → FOM valida/rechaza → resultado. Tipos: A (dura), B (blanda), C (intercambio), D (recurrente)', true, 4, 'optional', 'OP-25', 'Operacional', 'info', '{}'::jsonb, 43),
  (v_org_id, 'RECURRING_PETITION_DETECT', 'Petición recurrente auto-detectada (Tipo D)', 'Si empleado pide lo mismo 3+ meses seguidos, propone al FOM convertirlo en restricción permanente', true, 3, 'optional', 'OP-26', 'IA proactiva', 'info', '{}'::jsonb, 44),
  (v_org_id, 'PETITION_DEADLINE', 'Deadline peticiones configurable', 'FOM configura fecha límite para recibir peticiones. Pasada la fecha, entran como blandas con prioridad baja', true, 2, 'optional', 'OP-27', 'Configuración', 'info', '{}'::jsonb, 45),
  (v_org_id, 'SWAP_AUTO_VALIDATION', 'Intercambios con validación automática', 'Dos empleados proponen intercambio → sistema valida (12h, cobertura, horas) → FOM aprueba/rechaza', true, 3, 'optional', 'OP-28', 'Operacional', 'info', '{}'::jsonb, 46),
  (v_org_id, 'VACATION_CONFLICT_PANEL', 'Conflicto vacaciones con panel comparativo', 'Si 2+ empleados piden mismas fechas: panel con antigüedad, historial, % satisfacción. FOM decide', true, 3, 'optional', 'OP-29', 'Equidad', 'warning', '{}'::jsonb, 47),
  (v_org_id, 'OCCUPANCY_IMPORT', 'Import ocupación PDF/CSV/Excel + manual', 'Input manual de llegadas/salidas por día + import de archivo del PMS. Futura integración API', true, 4, 'optional', 'OP-30', 'Operacional', 'info', '{}'::jsonb, 48),
  (v_org_id, 'REINFORCEMENT_THRESHOLD', 'Umbral refuerzo por ocupación', 'A partir de X llegadas/día → refuerzo extra si hay RRHH. Umbral configurable. Si no hay personal, alerta', true, 3, 'optional', 'OP-31', 'Operacional', 'warning', '{"threshold":40}'::jsonb, 49),
  (v_org_id, 'NO_STAFF_ALERT', 'Alerta sin personal + sugerencias', 'Cuando no hay personal para refuerzo: marca día naranja/rojo + envía sugerencias al FOM', true, 3, 'optional', 'OP-32', 'Operacional', 'warning', '{}'::jsonb, 50),
  (v_org_id, 'MULTI_ALTERNATIVE', '2-3 alternativas de cuadrante con score', 'Algoritmo genera 2-3 versiones con trade-offs: Equidad vs Peticiones vs Cobertura. Score 0-100', true, 5, 'optional', 'OP-33', 'Core SMART', 'info', '{}'::jsonb, 51),
  (v_org_id, 'POST_PUB_BLUE_CHANGES', 'Cambios post-publicación en azul + notificación', 'FOM edita post-pub → validación → cambios en azul → notificación al empleado → historial', true, 4, 'optional', 'OP-34', 'Operacional', 'info', '{}'::jsonb, 52),
  (v_org_id, 'CRITERIA_GLOBAL_PUNCTUAL', 'Config criterios global + puntual por generación', 'Settings para config por defecto. En el wizard: ajustar solo para esa generación sin afectar global', true, 3, 'optional', 'OP-35', 'Configuración', 'info', '{}'::jsonb, 53),
  (v_org_id, 'VISUAL_LAYERS', 'Capas visualización toggleables', 'Heatmap de carga, indicadores equidad, alertas inline, comparador lado a lado. Toggle desde toolbar', true, 3, 'optional', 'OP-36', 'UI/UX', 'info', '{}'::jsonb, 54),
  (v_org_id, 'NEW_HIRE_PROGRESSIVE', 'Nueva incorporación: manual → auto', 'Fase 1: jefe asigna manualmente. Fase 2: entra en rotación con historial en cero', true, 2, 'optional', 'OP-37', 'Configuración', 'info', '{}'::jsonb, 55),
  (v_org_id, 'CONSECUTIVE_NIGHTS_ALERT', 'Noches consecutivas: alerta suave configurable', 'Umbral default: 4 noches. Al superarlo: aviso visible, NO bloqueo. Configurable 1-7. No aplica a Night Agent', true, 3, 'optional', 'OP-38', 'Ergonomía', 'warning', '{"threshold":4,"min":1,"max":7}'::jsonb, 56),
  (v_org_id, 'AUTO_DETECT_EMPLOYEE_TYPE', 'Tipo empleado auto-detectado + override manual', 'Sistema detecta tipo (FIJO/ROTA/PARCIAL/COBERTURA) por contrato, rol e historial. FOM puede override', true, 3, 'optional', 'OP-39', 'Configuración', 'info', '{}'::jsonb, 57),
  (v_org_id, 'CHECK_12H_REST', 'Descanso 12h', 'Verificar que entre fin de turno e inicio del siguiente hay ≥12h', true, 5, 'check', 'CK-01', 'Post-gen + Tiempo real', 'blocker', '{}'::jsonb, 58),
  (v_org_id, 'CHECK_CONSECUTIVE_REST', 'Libres consecutivos', 'Verificar que los 2 días libres de cada semana son consecutivos', true, 5, 'check', 'CK-02', 'Post-gen', 'error', '{}'::jsonb, 59),
  (v_org_id, 'CHECK_MIN_COVERAGE', 'Cobertura mínima', 'Verificar que cada turno activo tiene ≥ personas mínimas configuradas', true, 5, 'check', 'CK-03', 'Post-gen', 'blocker', '{}'::jsonb, 60),
  (v_org_id, 'CHECK_WEEKLY_HOURS', 'Horas semanales', 'Verificar que ningún empleado supera 40h (o 37.5h) semanales', true, 4, 'check', 'CK-04', 'Post-gen', 'error', '{}'::jsonb, 61),
  (v_org_id, 'CHECK_PAJAMA_SHIFT', 'Turno pijama', 'Detectar secuencia T→M (tarde seguida de mañana)', true, 5, 'check', 'CK-05', 'Post-gen + Tiempo real', 'blocker', '{}'::jsonb, 62),
  (v_org_id, 'CHECK_NIGHT_THEN_FREE', 'Noche → libre', 'Verificar que después de turno N el día siguiente es libre. Solo ROTA_COMPLETO', true, 5, 'check', 'CK-06', 'Post-gen', 'blocker', '{}'::jsonb, 63),
  (v_org_id, 'CHECK_NIGHT_BALANCE', 'Equilibrio noches', 'Verificar desequilibrio de noches no supera tolerancia configurada entre empleados', true, 3, 'check', 'CK-07', 'Post-gen', 'warning', '{}'::jsonb, 64),
  (v_org_id, 'CHECK_WEEKEND_BALANCE', 'Equilibrio FDS', 'Verificar desequilibrio de fines de semana trabajados', true, 3, 'check', 'CK-08', 'Post-gen', 'warning', '{}'::jsonb, 65),
  (v_org_id, 'CHECK_LONG_WEEKEND', 'FDS largo mensual', 'Verificar que cada empleado tiene bloque S+D+L+M al menos 1 vez al mes', true, 4, 'check', 'CK-09', 'Post-gen', 'error', '{}'::jsonb, 66),
  (v_org_id, 'CHECK_PRE_VACATION', 'Pre-vacaciones librando', 'Verificar que antes de vacaciones el empleado tiene sus 2 libres semanales', true, 4, 'check', 'CK-10', 'Pre-gen + Post-gen', 'error', '{}'::jsonb, 67),
  (v_org_id, 'CHECK_HOLIDAY_COMPENSATED', 'Festivos compensados', 'Verificar que festivos trabajados tienen compensatorio programado en el mes', true, 3, 'check', 'CK-11', 'Post-gen', 'warning', '{}'::jsonb, 68),
  (v_org_id, 'CHECK_GUARD_ROLE', 'Guardia = solo jefe', 'Verificar que G solo asignado a roles Jefe', true, 4, 'check', 'CK-12', 'Tiempo real', 'error', '{}'::jsonb, 69),
  (v_org_id, 'CHECK_GEX_EXCLUSION', 'GEX exclusión rotación', 'Verificar que GEX no entra en rotación M/T/N general', true, 4, 'check', 'CK-13', 'Pre-gen', 'error', '{}'::jsonb, 70),
  (v_org_id, 'CHECK_HARD_RESTRICTIONS', 'Restricciones duras empleado', 'Verificar que ninguna restricción dura (Tipo A) ha sido violada', true, 5, 'check', 'CK-14', 'Post-gen', 'blocker', '{}'::jsonb, 71),
  (v_org_id, 'CHECK_ANNUAL_HOURS', 'Horas acumuladas anuales', 'Proyección horas anuales no supera 1.792h (convenio hostelería)', true, 3, 'check', 'CK-15', 'Post-gen', 'warning', '{}'::jsonb, 72),
  (v_org_id, 'CHECK_36H_WEEKLY_REST', 'Descanso semanal 36h', 'Verificar bloque de 36h consecutivas de descanso semanal', true, 4, 'check', 'CK-16', 'Post-gen', 'error', '{}'::jsonb, 73),
  (v_org_id, 'CHECK_SHIFT_PROGRESSION', 'Progresión natural turnos', 'Verificar que no hay saltos bruscos (ej. M directo a N sin pasar por T)', true, 3, 'check', 'CK-17', 'Post-gen', 'warning', '{}'::jsonb, 74),
  (v_org_id, 'CHECK_STAFFING_VS_OCCUPANCY', 'Dimensionamiento vs ocupación', 'Verificar que personal presencial coincide con forecast de ocupación del día', true, 3, 'check', 'CK-18', 'Post-gen', 'warning', '{}'::jsonb, 75),
  (v_org_id, 'CHECK_SWAP_VALIDATION', 'Validación intercambios (12h + cobertura + horas)', 'Antes de aprobar intercambio Tipo C, validar: no pijama, no viola 12h, cobertura OK, horas OK', true, 4, 'check', 'CK-19', 'Pre-aprobación', 'error', '{}'::jsonb, 76),
  (v_org_id, 'CHECK_ALL_LONG_WEEKENDS', 'FDS largo para todos en el mes', 'Verificar que al finalizar generación mensual, TODOS los empleados tienen FDS largo asignado', true, 4, 'check', 'CK-20', 'Post-gen', 'error', '{}'::jsonb, 77),
  (v_org_id, 'CHECK_FOM_AFOM_MIRROR', 'Espejo FOM-AFOM consistente', 'Verificar lógica espejo: FOM en M → AFOM en T; FOM libra → AFOM trabaja; FOM en G → AFOM libra', true, 4, 'check', 'CK-21', 'Post-gen', 'error', '{}'::jsonb, 78),
  (v_org_id, 'CHECK_MIN_SCORE', 'Score mínimo para publicar', 'El cuadrante debe tener score mínimo (configurable, default 70) para ser publicable sin override', true, 4, 'check', 'CK-22', 'Pre-publicación', 'error', '{"minScore":70}'::jsonb, 79),
  (v_org_id, 'CHECK_CROSS_PERIOD', 'Continuidad con período anterior', 'Verificar que día 1 no genera pijama respecto al último turno del período anterior', true, 5, 'check', 'CK-23', 'Pre-gen', 'blocker', '{}'::jsonb, 80),
  (v_org_id, 'CHECK_HARD_PETITIONS', 'Peticiones duras respetadas al 100%', 'Verificar que NINGUNA petición Tipo A ha sido violada. Bloquea publicación', true, 5, 'check', 'CK-24', 'Post-gen', 'blocker', '{}'::jsonb, 81),
  (v_org_id, 'CHECK_AD_HOC_12H', 'Turnos ad-hoc validados (12h)', 'Cuando FOM escribe turno ad-hoc en celda, verificar que no viola 12h con turno anterior ni siguiente', true, 4, 'check', 'CK-25', 'Tiempo real', 'error', '{}'::jsonb, 82),
  (v_org_id, 'SMARTIA_AUTO_FAVORITES', 'Auto-proponer turnos a favoritos', 'Detecta turnos usados frecuentemente y propone añadirlos a favoritos', true, 3, 'smart_ia', 'SM-01', 'Proactivo', 'info', '{"usageThreshold":3}'::jsonb, 83),
  (v_org_id, 'SMARTIA_RECURRING_PETITION', 'Petición recurrente → restricción permanente', 'Detecta cuando un empleado pide lo mismo 3+ meses seguidos y propone convertirlo en restricción', true, 3, 'smart_ia', 'SM-02', 'Proactivo', 'info', '{"monthsThreshold":3}'::jsonb, 84),
  (v_org_id, 'SMARTIA_PUNCTUAL_TO_GLOBAL', 'Config puntual → config global', 'Detecta cuando el FOM activa el mismo criterio puntualmente en 3+ generaciones seguidas', true, 2, 'smart_ia', 'SM-03', 'Proactivo', 'info', '{"generationsThreshold":3}'::jsonb, 85),
  (v_org_id, 'SMARTIA_SOFT_CONFLICT', 'Conflicto inteligente de peticiones blandas', 'Cuando dos peticiones blandas chocan, prioriza al empleado con menor ratio de satisfacción histórica', true, 3, 'smart_ia', 'SM-04', 'Resolución', 'info', '{}'::jsonb, 86),
  (v_org_id, 'SMARTIA_REINFORCEMENT_SUGGEST', 'Sugerencias de refuerzo por ocupación', 'Cuando un día necesita refuerzo pero no hay personal, sugiere opciones concretas al FOM', true, 3, 'smart_ia', 'SM-05', 'Proactivo', 'warning', '{}'::jsonb, 87),
  (v_org_id, 'SMARTIA_SCORE_ACCOUNTABILITY', 'Score como accountability documental', 'Cada cuadrante publicado queda registrado con score, versión elegida y quién la eligió', true, 4, 'smart_ia', 'SM-06', 'Trazabilidad', 'info', '{}'::jsonb, 88),
  (v_org_id, 'SMARTIA_VISUAL_PREFS', 'Recordar preferencia de capas visuales', 'El sistema recuerda qué capas de visualización tiene activas el FOM entre sesiones', true, 1, 'smart_ia', 'SM-07', 'UX', 'info', '{}'::jsonb, 89),
  (v_org_id, 'SMARTIA_ABSENCE_AUTO_SAVE', 'Código ausencia auto-guardado', 'Cuando FOM crea un código de ausencia personalizado varias veces, propone guardarlo permanentemente', true, 2, 'smart_ia', 'SM-08', 'Proactivo', 'info', '{"usageThreshold":3}'::jsonb, 90),
  (v_org_id, 'SMARTIA_VACATION_80_ALERT', 'Alerta preventiva vacaciones 80%', 'Avisa al FOM cuando un empleado ha consumido más del 80% de sus vacaciones antes de octubre', true, 3, 'smart_ia', 'SM-09', 'Proactivo', 'warning', '{"alertThreshold":0.8,"beforeMonth":10}'::jsonb, 91),
  (v_org_id, 'SMARTIA_TRANSITION_11X19', 'Transición 11x19 propuesta automática', 'Cuando detecta transición que violaría 12h, propone 11x19 como solución', true, 3, 'smart_ia', 'SM-10', 'Resolución', 'info', '{}'::jsonb, 92)
ON CONFLICT (organization_id, criteria_key) DO UPDATE SET
  criteria_name = EXCLUDED.criteria_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  code = EXCLUDED.code,
  subcategory = EXCLUDED.subcategory,
  severity = EXCLUDED.severity,
  config_json = EXCLUDED.config_json,
  sort_order = EXCLUDED.sort_order;

RAISE NOTICE '✅ Seed completado: 7 empleados + RBAC + 7 horarios + 92 criterios SMART, equity feb-2026, 3 peticiones, 31 días ocupación';
END $$;
