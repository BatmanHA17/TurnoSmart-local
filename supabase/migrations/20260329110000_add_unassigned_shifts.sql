-- Sprint 2.1: Soporte para turnos sin asignar (employee_id nullable)
-- La columna employee_id ya es nullable en calendar_shifts.
-- Solo añadimos un índice parcial para queries de turnos sin asignar.

CREATE INDEX IF NOT EXISTS idx_calendar_shifts_unassigned
  ON calendar_shifts(org_id, date)
  WHERE employee_id IS NULL;

-- RLS: lectura para miembros activos de la organización
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'org_members_can_read_unassigned_shifts'
      AND tablename = 'calendar_shifts'
  ) THEN
    CREATE POLICY "org_members_can_read_unassigned_shifts" ON calendar_shifts
      FOR SELECT USING (
        is_super_admin() OR
        auth.role() = 'service_role' OR
        EXISTS (
          SELECT 1 FROM memberships
          WHERE memberships.org_id = calendar_shifts.org_id
            AND memberships.user_id = auth.uid()
            AND memberships.status = 'active'
        )
      );
  END IF;
END $$;

-- RLS: escritura (INSERT/UPDATE/DELETE) solo para OWNER, ADMIN
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'admins_can_write_unassigned_shifts'
      AND tablename = 'calendar_shifts'
  ) THEN
    CREATE POLICY "admins_can_write_unassigned_shifts" ON calendar_shifts
      FOR ALL USING (
        is_super_admin() OR
        auth.role() = 'service_role' OR
        EXISTS (
          SELECT 1 FROM memberships
          WHERE memberships.org_id = calendar_shifts.org_id
            AND memberships.user_id = auth.uid()
            AND memberships.status = 'active'
            AND memberships.role IN ('OWNER', 'ADMIN')
        )
      );
  END IF;
END $$;
