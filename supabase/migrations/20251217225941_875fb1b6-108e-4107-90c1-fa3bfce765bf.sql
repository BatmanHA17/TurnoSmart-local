-- =============================================
-- SISTEMA DE AUDITORÍA DE TURNOS
-- Tablas para políticas y restricciones
-- =============================================

-- 1. Políticas de auditoría por organización
CREATE TABLE public.audit_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL, -- 'INSUFFICIENT_REST', 'MISSING_FREE_DAYS', 'MISSING_COVERAGE', 'VACATION_NO_FREE_DAYS'
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, policy_type)
);

-- 2. Políticas de cobertura mínima por franja horaria
CREATE TABLE public.coverage_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  min_employees INTEGER NOT NULL DEFAULT 1,
  applies_to_days JSONB, -- ['monday', 'tuesday', ...] o NULL = todos los días
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Restricciones especiales por empleado
CREATE TABLE public.employee_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL, -- 'NO_DAY', 'PREFERRED_SHIFT', 'MAX_CONSECUTIVE_NIGHTS', 'MAX_HOURS_DAY', 'NO_TIME_RANGE', 'CUSTOM'
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Historial de violaciones (para trazabilidad y justificaciones)
CREATE TABLE public.audit_violations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  violation_type TEXT NOT NULL,
  violation_date DATE NOT NULL,
  details JSONB,
  acknowledged_by UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMPTZ,
  justification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX idx_audit_policies_org ON public.audit_policies(org_id);
CREATE INDEX idx_coverage_policies_org ON public.coverage_policies(org_id);
CREATE INDEX idx_employee_restrictions_colaborador ON public.employee_restrictions(colaborador_id);
CREATE INDEX idx_employee_restrictions_org ON public.employee_restrictions(org_id);
CREATE INDEX idx_audit_violations_log_org ON public.audit_violations_log(org_id);
CREATE INDEX idx_audit_violations_log_date ON public.audit_violations_log(violation_date);

-- Triggers para updated_at
CREATE TRIGGER update_audit_policies_updated_at
  BEFORE UPDATE ON public.audit_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coverage_policies_updated_at
  BEFORE UPDATE ON public.coverage_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_restrictions_updated_at
  BEFORE UPDATE ON public.employee_restrictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- audit_policies
ALTER TABLE public.audit_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_audit_policies"
  ON public.audit_policies FOR SELECT
  USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "org_managers_manage_audit_policies"
  ON public.audit_policies FOR ALL
  USING (org_id IN (
    SELECT m.org_id FROM memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER', 'DIRECTOR')
  ))
  WITH CHECK (org_id IN (
    SELECT m.org_id FROM memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER', 'DIRECTOR')
  ));

-- coverage_policies
ALTER TABLE public.coverage_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_coverage_policies"
  ON public.coverage_policies FOR SELECT
  USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "org_managers_manage_coverage_policies"
  ON public.coverage_policies FOR ALL
  USING (org_id IN (
    SELECT m.org_id FROM memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER', 'DIRECTOR')
  ))
  WITH CHECK (org_id IN (
    SELECT m.org_id FROM memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER', 'DIRECTOR')
  ));

-- employee_restrictions
ALTER TABLE public.employee_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_employee_restrictions"
  ON public.employee_restrictions FOR SELECT
  USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "org_managers_manage_employee_restrictions"
  ON public.employee_restrictions FOR ALL
  USING (org_id IN (
    SELECT m.org_id FROM memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER', 'DIRECTOR')
  ))
  WITH CHECK (org_id IN (
    SELECT m.org_id FROM memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER', 'DIRECTOR')
  ));

-- audit_violations_log
ALTER TABLE public.audit_violations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_audit_log"
  ON public.audit_violations_log FOR SELECT
  USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "org_members_insert_audit_log"
  ON public.audit_violations_log FOR INSERT
  WITH CHECK (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "org_managers_update_audit_log"
  ON public.audit_violations_log FOR UPDATE
  USING (org_id IN (
    SELECT m.org_id FROM memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER', 'DIRECTOR')
  ));

-- Insertar políticas por defecto para organizaciones existentes
INSERT INTO public.audit_policies (org_id, policy_type, is_enabled, config)
SELECT 
  id as org_id,
  policy_type,
  true as is_enabled,
  CASE policy_type
    WHEN 'INSUFFICIENT_REST' THEN '{"minRestHours": 12}'::jsonb
    WHEN 'MISSING_FREE_DAYS' THEN '{"minFreeDaysFullTime": 2, "requireConsecutive": true}'::jsonb
    WHEN 'MISSING_COVERAGE' THEN '{"enabled": true}'::jsonb
    WHEN 'VACATION_NO_FREE_DAYS' THEN '{"freeDaysAroundVacation": 2, "allowBeforeOrAfter": true}'::jsonb
  END as config
FROM public.organizations
CROSS JOIN (
  VALUES 
    ('INSUFFICIENT_REST'),
    ('MISSING_FREE_DAYS'),
    ('MISSING_COVERAGE'),
    ('VACATION_NO_FREE_DAYS')
) AS policies(policy_type)
ON CONFLICT (org_id, policy_type) DO NOTHING;

-- Insertar políticas de cobertura por defecto
INSERT INTO public.coverage_policies (org_id, name, start_time, end_time, min_employees, is_enabled)
SELECT 
  id as org_id,
  slot.name,
  slot.start_time::time,
  slot.end_time::time,
  slot.min_emp,
  true
FROM public.organizations
CROSS JOIN (
  VALUES 
    ('Apertura', '07:00', '12:00', 1),
    ('Mediodía', '12:00', '15:00', 1),
    ('Tarde', '15:00', '20:00', 1),
    ('Noche', '20:00', '23:00', 1),
    ('Madrugada', '23:00', '07:00', 1)
) AS slot(name, start_time, end_time, min_emp);