-- =============================================================================
-- RBAC Step 3: Endurecer RLS para tablas del engine
-- Empleados: solo lectura + crear peticiones propias
-- FOM (ADMIN/OWNER): todo
-- =============================================================================

-- Helper: ¿el usuario actual es ADMIN/OWNER en esta org?
CREATE OR REPLACE FUNCTION is_org_admin(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS(
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND org_id = _org_id
      AND role IN ('OWNER', 'ADMIN')
      AND status = 'active'
  ) OR public.is_super_admin();
$$;

GRANT EXECUTE ON FUNCTION is_org_admin(UUID) TO authenticated;

-- ----------------------------------------------------------------
-- schedule_petitions: empleados crean las suyas, FOM gestiona todas
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "schedule_petitions_select" ON schedule_petitions;
DROP POLICY IF EXISTS "schedule_petitions_insert" ON schedule_petitions;
DROP POLICY IF EXISTS "schedule_petitions_update" ON schedule_petitions;
DROP POLICY IF EXISTS "schedule_petitions_delete" ON schedule_petitions;
DROP POLICY IF EXISTS "Miembros pueden ver peticiones de su org" ON schedule_petitions;
DROP POLICY IF EXISTS "Miembros pueden crear peticiones" ON schedule_petitions;
DROP POLICY IF EXISTS "Miembros pueden actualizar peticiones de su org" ON schedule_petitions;
DROP POLICY IF EXISTS "Miembros pueden eliminar peticiones de su org" ON schedule_petitions;

CREATE POLICY "petitions_select" ON schedule_petitions FOR SELECT USING (
  is_super_admin()
  OR (
    organization_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
    AND (
      is_org_admin(organization_id)
      OR employee_id = get_colaborador_for_user(auth.uid())
    )
  )
);

CREATE POLICY "petitions_insert" ON schedule_petitions FOR INSERT WITH CHECK (
  is_super_admin()
  OR (
    organization_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
    AND (
      is_org_admin(organization_id)
      OR employee_id = get_colaborador_for_user(auth.uid())
    )
  )
);

CREATE POLICY "petitions_update" ON schedule_petitions FOR UPDATE USING (
  is_super_admin() OR is_org_admin(organization_id)
);

CREATE POLICY "petitions_delete" ON schedule_petitions FOR DELETE USING (
  is_super_admin() OR is_org_admin(organization_id)
);

-- ----------------------------------------------------------------
-- daily_occupancy: solo FOM modifica
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "occupancy_select" ON daily_occupancy;
DROP POLICY IF EXISTS "occupancy_insert" ON daily_occupancy;
DROP POLICY IF EXISTS "occupancy_update" ON daily_occupancy;
DROP POLICY IF EXISTS "occupancy_delete" ON daily_occupancy;
DROP POLICY IF EXISTS "Miembros pueden ver ocupación de su org" ON daily_occupancy;
DROP POLICY IF EXISTS "Miembros pueden crear ocupación" ON daily_occupancy;
DROP POLICY IF EXISTS "Miembros pueden actualizar ocupación de su org" ON daily_occupancy;
DROP POLICY IF EXISTS "Miembros pueden eliminar ocupación de su org" ON daily_occupancy;

CREATE POLICY "occupancy_select" ON daily_occupancy FOR SELECT USING (
  is_super_admin()
  OR organization_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
);

CREATE POLICY "occupancy_modify" ON daily_occupancy FOR ALL USING (
  is_super_admin() OR is_org_admin(organization_id)
);

-- ----------------------------------------------------------------
-- schedule_criteria: solo FOM modifica
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "criteria_select" ON schedule_criteria;
DROP POLICY IF EXISTS "criteria_modify" ON schedule_criteria;
DROP POLICY IF EXISTS "Miembros pueden ver criterios de su org" ON schedule_criteria;
DROP POLICY IF EXISTS "Miembros pueden crear criterios" ON schedule_criteria;
DROP POLICY IF EXISTS "Miembros pueden actualizar criterios de su org" ON schedule_criteria;

CREATE POLICY "criteria_select" ON schedule_criteria FOR SELECT USING (
  is_super_admin()
  OR organization_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
);

CREATE POLICY "criteria_modify" ON schedule_criteria FOR ALL USING (
  is_super_admin() OR is_org_admin(organization_id)
);

-- ----------------------------------------------------------------
-- schedule_edit_log: solo FOM modifica, todos leen
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "editlog_select" ON schedule_edit_log;
DROP POLICY IF EXISTS "editlog_modify" ON schedule_edit_log;
DROP POLICY IF EXISTS "Miembros pueden ver log de su org" ON schedule_edit_log;
DROP POLICY IF EXISTS "Miembros pueden crear log" ON schedule_edit_log;

CREATE POLICY "editlog_select" ON schedule_edit_log FOR SELECT USING (
  is_super_admin()
  OR organization_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
);

CREATE POLICY "editlog_modify" ON schedule_edit_log FOR ALL USING (
  is_super_admin() OR is_org_admin(organization_id)
);

-- ----------------------------------------------------------------
-- employee_equity: solo FOM modifica, todos leen
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "equity_select" ON employee_equity;
DROP POLICY IF EXISTS "equity_modify" ON employee_equity;
DROP POLICY IF EXISTS "Miembros pueden ver equidad de su org" ON employee_equity;
DROP POLICY IF EXISTS "Miembros pueden crear equidad" ON employee_equity;
DROP POLICY IF EXISTS "Miembros pueden actualizar equidad de su org" ON employee_equity;

CREATE POLICY "equity_select" ON employee_equity FOR SELECT USING (
  is_super_admin()
  OR organization_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
);

CREATE POLICY "equity_modify" ON employee_equity FOR ALL USING (
  is_super_admin() OR is_org_admin(organization_id)
);

-- ----------------------------------------------------------------
-- schedule_generations: solo FOM modifica, todos leen
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "generations_select" ON schedule_generations;
DROP POLICY IF EXISTS "generations_modify" ON schedule_generations;
DROP POLICY IF EXISTS "Miembros pueden ver generaciones de su org" ON schedule_generations;
DROP POLICY IF EXISTS "Miembros pueden crear generaciones" ON schedule_generations;
DROP POLICY IF EXISTS "Miembros pueden actualizar generaciones de su org" ON schedule_generations;

CREATE POLICY "generations_select" ON schedule_generations FOR SELECT USING (
  is_super_admin()
  OR organization_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active')
);

CREATE POLICY "generations_modify" ON schedule_generations FOR ALL USING (
  is_super_admin() OR is_org_admin(organization_id)
);
