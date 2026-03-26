-- ============================================================
-- AUDIT TRIGGERS — TurnoSmart
-- Registra cambios críticos en tablas sensibles
-- ============================================================

-- Función genérica de auditoría
CREATE OR REPLACE FUNCTION audit_table_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _action TEXT;
  _entity_id TEXT;
  _entity_name TEXT;
  _user_id UUID;
  _org_id UUID;
BEGIN
  _action := TG_OP; -- INSERT, UPDATE, DELETE

  -- Intentar obtener org_id y user_id del registro
  IF TG_OP = 'DELETE' THEN
    _entity_id := OLD.id::TEXT;
    _org_id := (OLD).org_id;
    -- Try to get a display name
    _entity_name := COALESCE(
      (OLD).nombre || ' ' || COALESCE((OLD).apellidos, ''),
      (OLD).name,
      (OLD).title,
      (OLD).email,
      OLD.id::TEXT
    );
  ELSE
    _entity_id := NEW.id::TEXT;
    _org_id := (NEW).org_id;
    _entity_name := COALESCE(
      (NEW).nombre || ' ' || COALESCE((NEW).apellidos, ''),
      (NEW).name,
      (NEW).title,
      (NEW).email,
      NEW.id::TEXT
    );
  END IF;

  -- Get current user from auth context
  BEGIN
    _user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    _user_id := NULL;
  END;

  INSERT INTO public.activity_log (
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    org_id,
    details
  ) VALUES (
    _user_id,
    COALESCE(auth.jwt()->>'email', 'system'),
    TG_TABLE_NAME || '_' || lower(_action),
    TG_TABLE_NAME,
    _entity_id,
    _entity_name,
    _org_id,
    CASE
      WHEN TG_OP = 'UPDATE' THEN
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'operation', TG_OP,
          'timestamp', now()
        )
      ELSE
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'operation', TG_OP,
          'timestamp', now()
        )
    END
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Never block the operation due to audit failure
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── Trigger: colaboradores ──────────────────────────────────
DROP TRIGGER IF EXISTS audit_colaboradores ON public.colaboradores;
CREATE TRIGGER audit_colaboradores
  AFTER INSERT OR UPDATE OR DELETE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION audit_table_change();

-- ── Trigger: memberships ────────────────────────────────────
DROP TRIGGER IF EXISTS audit_memberships ON public.memberships;
CREATE TRIGGER audit_memberships
  AFTER INSERT OR UPDATE OR DELETE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION audit_table_change();

-- ── Trigger: organizations ──────────────────────────────────
DROP TRIGGER IF EXISTS audit_organizations ON public.organizations;
CREATE TRIGGER audit_organizations
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION audit_table_change();

-- ── Trigger: user_roles ─────────────────────────────────────
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_table_change();

-- ── Trigger: jobs ───────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_jobs ON public.jobs;
CREATE TRIGGER audit_jobs
  AFTER INSERT OR DELETE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION audit_table_change();

-- ============================================================
-- RLS HARDENING — verification_codes
-- Esta tabla NO tenía RLS. Cualquier usuario autenticado podía
-- leer todos los códigos de verificación de la plataforma.
-- ============================================================

ALTER TABLE IF EXISTS public.verification_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verification_codes_own" ON public.verification_codes;
CREATE POLICY "verification_codes_own"
  ON public.verification_codes
  FOR ALL
  USING (email = auth.jwt()->>'email');

-- ============================================================
-- LOG: Corrección del trigger de eliminación de usuarios auth
-- (ya ejecutado manualmente, incluido aquí para trazabilidad)
-- ============================================================

CREATE OR REPLACE FUNCTION log_deleted_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, user_name, action, entity_type, entity_name, details)
  VALUES (
    OLD.id,
    OLD.email,
    'auth_user_deleted',
    'user',
    OLD.email,
    jsonb_build_object('email', OLD.email, 'deleted_at', now())
  );
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RETURN OLD;
END;
$$;
