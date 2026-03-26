-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Fecha: 2026-03-25
-- Motivo: Acceso no autorizado detectado en producción.
--         Dos cuentas no autorizadas entraron sin alertas.
-- ============================================================

-- 1. RLS en verification_codes (si existe la tabla)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_codes') THEN
    ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

    -- Solo el propio usuario puede ver su código
    DROP POLICY IF EXISTS "user_own_verification_code" ON public.verification_codes;
    CREATE POLICY "user_own_verification_code"
      ON public.verification_codes
      FOR SELECT
      USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

    -- Solo service role puede insertar (desde edge functions)
    DROP POLICY IF EXISTS "service_role_insert_verification" ON public.verification_codes;
    CREATE POLICY "service_role_insert_verification"
      ON public.verification_codes
      FOR INSERT
      WITH CHECK (auth.role() = 'service_role');

    -- Solo service role puede eliminar
    DROP POLICY IF EXISTS "service_role_delete_verification" ON public.verification_codes;
    CREATE POLICY "service_role_delete_verification"
      ON public.verification_codes
      FOR DELETE
      USING (auth.role() = 'service_role');

    RAISE NOTICE 'RLS aplicado a verification_codes';
  ELSE
    RAISE NOTICE 'Tabla verification_codes no encontrada, omitida';
  END IF;
END $$;


-- 2. Trigger para loguear nuevos usuarios en auth.users → activity_log
CREATE OR REPLACE FUNCTION public.log_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
    INSERT INTO public.activity_log (
      user_id,
      action,
      description,
      metadata
    ) VALUES (
      NEW.id,
      'auth_user_created',
      'New auth user registered: ' || NEW.email,
      jsonb_build_object(
        'email', NEW.email,
        'created_at', NEW.created_at,
        'source', 'auth_trigger'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_log ON auth.users;
CREATE TRIGGER on_auth_user_created_log
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_new_auth_user();


-- 3. Trigger para loguear eliminación de usuarios
CREATE OR REPLACE FUNCTION public.log_deleted_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
    INSERT INTO public.activity_log (
      user_id,
      action,
      description,
      metadata
    ) VALUES (
      OLD.id,
      'auth_user_deleted',
      'Auth user deleted: ' || OLD.email,
      jsonb_build_object(
        'email', OLD.email,
        'deleted_at', now(),
        'source', 'auth_trigger'
      )
    );
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted_log ON auth.users;
CREATE TRIGGER on_auth_user_deleted_log
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deleted_auth_user();


-- 4. Hardening de activity_log: solo admins pueden ver todos los logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
    -- Eliminar política permisiva antigua si existe
    DROP POLICY IF EXISTS "Authenticated users can create activity logs" ON public.activity_log;
    DROP POLICY IF EXISTS "admins_view_all_logs" ON public.activity_log;
    DROP POLICY IF EXISTS "users_view_own_logs" ON public.activity_log;
    DROP POLICY IF EXISTS "users_insert_own_logs" ON public.activity_log;

    -- Los super_admins y admins ven TODO
    CREATE POLICY "admins_view_all_logs"
      ON public.activity_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role IN ('super_admin', 'admin')
        )
      );

    -- Cada usuario ve solo sus propios logs
    CREATE POLICY "users_view_own_logs"
      ON public.activity_log
      FOR SELECT
      USING (user_id = auth.uid());

    -- Inserción controlada: solo el propio usuario o service_role
    CREATE POLICY "users_insert_own_logs"
      ON public.activity_log
      FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        OR auth.role() = 'service_role'
      );

    RAISE NOTICE 'Políticas de activity_log actualizadas';
  END IF;
END $$;


-- 5. Índice en activity_log para búsquedas rápidas por acción y fecha
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
    CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);
    CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
    RAISE NOTICE 'Índices de activity_log creados';
  END IF;
END $$;
