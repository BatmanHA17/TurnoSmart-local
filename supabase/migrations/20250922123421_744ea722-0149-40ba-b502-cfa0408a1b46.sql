-- ========================================
-- MIGRACIÓN: NORMALIZACIÓN COMPLETA DE ORGANIZACIONES
-- ========================================

-- 3.1 Añadir org_id a todas las tablas principales
-- ========================================

-- Tablas relacionadas con colaboradores y empleados
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.colaborador_roles ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.absence_requests ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.compensatory_time_off ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.compensatory_time_history ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.contract_history ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- Tablas de turnos y calendarios
ALTER TABLE public.calendar_shifts ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.saved_shifts ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.turnos_publicos ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- Tablas de cuadrantes y ocupación
ALTER TABLE public.cuadrantes ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.cuadrante_assignments ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.daily_occupancy ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.occupancy_budgets ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- Tablas de sistema
ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_permissions ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- ========================================
-- BACKFILL: Migrar datos de establishments a organizations
-- ========================================

-- Insertar establishments en organizations si no existen
INSERT INTO public.organizations (id, name, country, created_at)
SELECT 
  id,
  name,
  'ES' as country,
  created_at
FROM public.establishments e
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.id = e.id
);

-- ========================================
-- BACKFILL: Asignar org_id basado en datos existentes
-- ========================================

-- Obtener la primera organización disponible para usuarios sin org
DO $$
DECLARE
  default_org_id uuid;
BEGIN
  -- Obtener la primera organización como default
  SELECT id INTO default_org_id FROM public.organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    -- Actualizar profiles sin primary_org_id
    UPDATE public.profiles 
    SET primary_org_id = default_org_id 
    WHERE primary_org_id IS NULL AND deleted_at IS NULL;
    
    -- Backfill org_id en tablas usando primary_org_id del perfil
    UPDATE public.colaboradores c
    SET org_id = p.primary_org_id
    FROM public.profiles p
    WHERE c.email = p.email 
      AND c.org_id IS NULL 
      AND p.primary_org_id IS NOT NULL;
      
    UPDATE public.absence_requests ar
    SET org_id = c.org_id
    FROM public.colaboradores c
    WHERE ar.colaborador_id = c.id 
      AND ar.org_id IS NULL 
      AND c.org_id IS NOT NULL;
      
    UPDATE public.compensatory_time_off cto
    SET org_id = c.org_id
    FROM public.colaboradores c
    WHERE cto.colaborador_id = c.id 
      AND cto.org_id IS NULL 
      AND c.org_id IS NOT NULL;
      
    UPDATE public.compensatory_time_history cth
    SET org_id = c.org_id
    FROM public.colaboradores c
    WHERE cth.colaborador_id = c.id 
      AND cth.org_id IS NULL 
      AND c.org_id IS NOT NULL;
      
    -- Backfill para tablas sin relación directa - usar default
    UPDATE public.calendar_shifts SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE public.saved_shifts SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE public.cuadrantes SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE public.employees SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE public.jobs SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE public.turnos_publicos SET org_id = default_org_id WHERE org_id IS NULL;
    UPDATE public.occupancy_budgets SET org_id = default_org_id WHERE org_id IS NULL;
    
    -- Activity log con org_id del usuario
    UPDATE public.activity_log al
    SET org_id = p.primary_org_id
    FROM public.profiles p
    WHERE al.user_id = p.id 
      AND al.org_id IS NULL 
      AND p.primary_org_id IS NOT NULL;
  END IF;
END $$;

-- ========================================
-- CREAR VISTA DE REPORTING
-- ========================================

CREATE OR REPLACE VIEW public.org_usage_daily AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  DATE(al.created_at) as date,
  COUNT(DISTINCT al.user_id) as active_users,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN al.action LIKE '%shift%' THEN 1 END) as shift_actions,
  COUNT(CASE WHEN al.action LIKE '%colaborador%' THEN 1 END) as colaborador_actions
FROM public.organizations o
LEFT JOIN public.activity_log al ON o.id = al.org_id
WHERE al.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY o.id, o.name, DATE(al.created_at)
ORDER BY date DESC, org_name;

-- ========================================
-- RLS POLÍTICAS COHERENTES
-- ========================================

-- Política estándar para colaboradores
DROP POLICY IF EXISTS "org_members_manage_colaboradores" ON public.colaboradores;
CREATE POLICY "org_members_manage_colaboradores" ON public.colaboradores
FOR ALL USING (
  org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

-- Política estándar para absence_requests
DROP POLICY IF EXISTS "org_members_manage_absence_requests" ON public.absence_requests;
CREATE POLICY "org_members_manage_absence_requests" ON public.absence_requests
FOR ALL USING (
  org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

-- Política estándar para calendar_shifts
DROP POLICY IF EXISTS "org_members_manage_calendar_shifts" ON public.calendar_shifts;
CREATE POLICY "org_members_manage_calendar_shifts" ON public.calendar_shifts
FOR ALL USING (
  org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

-- Política estándar para saved_shifts
DROP POLICY IF EXISTS "org_members_manage_saved_shifts" ON public.saved_shifts;
CREATE POLICY "org_members_manage_saved_shifts" ON public.saved_shifts
FOR ALL USING (
  org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

-- Política estándar para activity_log
DROP POLICY IF EXISTS "org_members_view_activity_log" ON public.activity_log;
CREATE POLICY "org_members_view_activity_log" ON public.activity_log
FOR SELECT USING (
  org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

-- ========================================
-- ACTUALIZAR FUNCIÓN DE LOGS PARA INCLUIR ORG_ID
-- ========================================

CREATE OR REPLACE FUNCTION public.log_activity(
  _user_name text, 
  _action text, 
  _entity_type text, 
  _entity_id uuid DEFAULT NULL::uuid, 
  _entity_name text DEFAULT NULL::text, 
  _establishment text DEFAULT NULL::text, 
  _details jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id UUID;
  user_org_id UUID;
BEGIN
  -- Obtener org_id del usuario actual
  SELECT primary_org_id INTO user_org_id 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  INSERT INTO public.activity_log (
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    establishment,
    details,
    org_id
  ) VALUES (
    auth.uid(),
    _user_name,
    _action,
    _entity_type,
    _entity_id,
    _entity_name,
    _establishment,
    _details,
    user_org_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;