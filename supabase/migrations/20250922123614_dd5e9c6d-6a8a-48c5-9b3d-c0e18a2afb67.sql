-- FASE 2: REMOVER COLUMNAS LEGACY Y FINALIZAR NORMALIZACIÓN
-- ========================================

-- Actualizar datos existentes para usar org_id
UPDATE public.calendar_shifts 
SET org_id = (SELECT id FROM public.organizations LIMIT 1)
WHERE org_id IS NULL;

UPDATE public.saved_shifts 
SET org_id = (SELECT id FROM public.organizations LIMIT 1)
WHERE org_id IS NULL;

UPDATE public.activity_log 
SET org_id = (SELECT id FROM public.organizations LIMIT 1)
WHERE org_id IS NULL;

-- Hacer org_id NOT NULL en tablas críticas
ALTER TABLE public.colaboradores ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.calendar_shifts ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.saved_shifts ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.activity_log ALTER COLUMN org_id SET NOT NULL;

-- OPCIONAL: Eliminar columnas legacy cuando el frontend esté migrado
-- ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS establecimiento_por_defecto;
-- ALTER TABLE public.calendar_shifts DROP COLUMN IF EXISTS organization;
-- ALTER TABLE public.saved_shifts DROP COLUMN IF EXISTS organization;
-- ALTER TABLE public.activity_log DROP COLUMN IF EXISTS establishment;

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_org_id ON public.colaboradores(org_id);
CREATE INDEX IF NOT EXISTS idx_calendar_shifts_org_id ON public.calendar_shifts(org_id);
CREATE INDEX IF NOT EXISTS idx_saved_shifts_org_id ON public.saved_shifts(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org_id ON public.activity_log(org_id);
CREATE INDEX IF NOT EXISTS idx_absence_requests_org_id ON public.absence_requests(org_id);

-- Actualizar RLS para nuevas tablas
DROP POLICY IF EXISTS "org_members_manage_employees" ON public.employees;
CREATE POLICY "org_members_manage_employees" ON public.employees
FOR ALL USING (
  org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "org_members_manage_jobs" ON public.jobs;
CREATE POLICY "org_members_manage_jobs" ON public.jobs
FOR ALL USING (
  org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "org_members_manage_cuadrantes" ON public.cuadrantes;
CREATE POLICY "org_members_manage_cuadrantes" ON public.cuadrantes
FOR ALL USING (
  org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  )
);

-- Actualizar función de logs con validación
CREATE OR REPLACE FUNCTION public.log_activity_with_org(
  _user_name text, 
  _action text, 
  _entity_type text, 
  _org_id uuid,
  _entity_id uuid DEFAULT NULL::uuid, 
  _entity_name text DEFAULT NULL::text, 
  _details jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  -- Validar que el usuario pertenece a la organización
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() AND org_id = _org_id
  ) THEN
    RAISE EXCEPTION 'Usuario no pertenece a la organización especificada';
  END IF;
  
  INSERT INTO public.activity_log (
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    details,
    org_id
  ) VALUES (
    auth.uid(),
    _user_name,
    _action,
    _entity_type,
    _entity_id,
    _entity_name,
    _details,
    _org_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;