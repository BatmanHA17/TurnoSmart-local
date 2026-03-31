-- =============================================================================
-- RBAC Step 1: Añadir user_id a colaboradores
-- Vincula cada colaborador con su auth.users para saber "quién es quién"
-- =============================================================================

-- 1. Columna user_id (nullable — se vincula manualmente o por seed)
ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Índice único parcial (un user_id solo puede estar en 1 colaborador)
CREATE UNIQUE INDEX IF NOT EXISTS idx_colaboradores_user_id
  ON colaboradores (user_id)
  WHERE user_id IS NOT NULL;

-- 3. Helper: dado un auth.uid(), obtener el colaborador vinculado
CREATE OR REPLACE FUNCTION get_colaborador_for_user(_uid UUID)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM colaboradores WHERE user_id = _uid LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_colaborador_for_user(UUID) TO authenticated;

-- 4. Helper: dado un auth.uid() y org_id, obtener el rol efectivo TurnoSmart
--    Devuelve: 'super_admin' | 'fom' | 'empleado'
CREATE OR REPLACE FUNCTION get_turnosmart_role(_uid UUID, _org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  _is_super BOOLEAN;
  _membership_role app_role_canonical;
BEGIN
  -- Super admin siempre gana
  SELECT EXISTS(SELECT 1 FROM super_admins WHERE user_id = _uid) INTO _is_super;
  IF _is_super THEN RETURN 'super_admin'; END IF;

  -- Buscar membership en la org
  SELECT role INTO _membership_role
    FROM memberships
    WHERE user_id = _uid AND org_id = _org_id AND status = 'active'
    LIMIT 1;

  IF _membership_role IN ('OWNER', 'ADMIN') THEN
    RETURN 'fom';
  END IF;

  RETURN 'empleado';
END;
$$;

GRANT EXECUTE ON FUNCTION get_turnosmart_role(UUID, UUID) TO authenticated;
