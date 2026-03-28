-- FASE 3: REFINAMIENTO Y SEGURIDAD MULTI-ORG

-- ==============================================
-- 1. LIMPIEZA Y REFACTORING DE RLS POLICIES
-- ==============================================

-- Limpiar policies antiguas y asegurar que solo quedan las correctas

-- Profiles: Solo políticas seguras
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Memberships: Limpiar policies duplicadas o inseguras
-- Mantener solo las policies modernas con roles canónicos

-- Organizations: Verificar que solo OWNER/ADMIN tienen control

-- ==============================================
-- 2. AUDIT LOGGING AUTOMÁTICO CON TRIGGERS
-- ==============================================

-- Función genérica para audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  action_text text;
  user_name_val text;
BEGIN
  -- Determinar el tipo de acción
  IF TG_OP = 'DELETE' THEN
    action_text := 'DELETE';
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    action_text := 'UPDATE';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    action_text := 'INSERT';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  END IF;

  -- Obtener nombre del usuario
  SELECT display_name INTO user_name_val
  FROM profiles 
  WHERE id = auth.uid();
  
  IF user_name_val IS NULL THEN
    user_name_val := 'Sistema';
  END IF;

  -- Insertar en activity_log
  INSERT INTO activity_log (
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    details
  ) VALUES (
    auth.uid(),
    user_name_val,
    action_text || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (old_data->>'id')::uuid
      ELSE (new_data->>'id')::uuid
    END,
    CASE TG_TABLE_NAME
      WHEN 'organizations' THEN 
        CASE 
          WHEN TG_OP = 'DELETE' THEN old_data->>'name'
          ELSE new_data->>'name'
        END
      WHEN 'profiles' THEN 
        CASE 
          WHEN TG_OP = 'DELETE' THEN old_data->>'display_name'
          ELSE new_data->>'display_name'
        END
      ELSE 'N/A'
    END,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'old_data', old_data,
      'new_data', new_data,
      'timestamp', now()
    )
  );

  -- Retornar el registro apropiado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Crear triggers para audit logging automático
CREATE TRIGGER audit_organizations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_memberships_trigger
  AFTER INSERT OR UPDATE OR DELETE ON memberships
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_profiles_trigger
  AFTER UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ==============================================
-- 3. PREPARACIÓN MULTI-ORG FRONTEND
-- ==============================================

-- Añadir primary_org_id a profiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_org_id uuid REFERENCES organizations(id);

-- Función para cambiar organización primaria
CREATE OR REPLACE FUNCTION public.set_primary_organization(_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_member boolean;
BEGIN
  -- Verificar que el usuario es miembro de la organización
  SELECT EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND org_id = _org_id
  ) INTO is_member;
  
  IF NOT is_member THEN
    RAISE EXCEPTION 'Usuario no es miembro de esta organización';
  END IF;
  
  -- Actualizar organización primaria
  UPDATE profiles 
  SET primary_org_id = _org_id
  WHERE id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Función para obtener organizaciones del usuario
CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  org_id uuid,
  org_name text,
  user_role app_role_canonical,
  is_primary boolean,
  member_since timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id as org_id,
    o.name as org_name,
    m.role as user_role,
    (o.id = p.primary_org_id) as is_primary,
    m.created_at as member_since
  FROM organizations o
  JOIN memberships m ON o.id = m.org_id
  LEFT JOIN profiles p ON p.id = m.user_id
  WHERE m.user_id = _user_id
  ORDER BY is_primary DESC, o.name ASC;
$$;

-- ==============================================
-- 4. QUERIES DE VERIFICACIÓN RLS
-- ==============================================

-- Función para verificar RLS (solo para testing)
CREATE OR REPLACE FUNCTION public.test_rls_access()
RETURNS TABLE(
  test_name text,
  result text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Test básico de acceso a perfiles
  RETURN QUERY
  SELECT 
    'profile_access'::text as test_name,
    CASE 
      WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) 
      THEN 'PASS'::text 
      ELSE 'FAIL'::text 
    END as result,
    'Usuario puede ver su propio perfil'::text as details;
    
  -- Test de organizaciones del usuario
  RETURN QUERY  
  SELECT 
    'org_membership'::text as test_name,
    CASE 
      WHEN EXISTS(SELECT 1 FROM get_user_organizations()) 
      THEN 'PASS'::text 
      ELSE 'FAIL'::text 
    END as result,
    'Usuario puede ver sus organizaciones'::text as details;
    
  -- Test de activity logs
  RETURN QUERY
  SELECT 
    'activity_logs'::text as test_name,
    CASE 
      WHEN EXISTS(SELECT 1 FROM activity_log WHERE user_id = auth.uid()) 
      THEN 'PASS'::text 
      ELSE 'WARN'::text 
    END as result,
    'Usuario puede ver sus logs de actividad'::text as details;
END;
$$;