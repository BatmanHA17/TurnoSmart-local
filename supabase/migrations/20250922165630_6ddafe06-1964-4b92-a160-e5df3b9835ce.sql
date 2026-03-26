-- Crear tablas para el sistema de convenios colectivos automatizado

-- Tabla principal para convenios colectivos
CREATE TABLE public.collective_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'pending_review', 'approved', 'active', 'rejected', 'processing_failed')),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  raw_text TEXT,
  extraction_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para grupos profesionales extraídos
CREATE TABLE public.professional_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_id UUID NOT NULL REFERENCES public.collective_agreements(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  group_code TEXT NOT NULL,
  group_name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para niveles salariales
CREATE TABLE public.salary_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_group_id UUID NOT NULL REFERENCES public.professional_groups(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES public.collective_agreements(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  level_code TEXT NOT NULL,
  level_name TEXT NOT NULL,
  base_salary DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('hourly', 'daily', 'weekly', 'monthly', 'annual')),
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para auditoría de extracciones
CREATE TABLE public.agreement_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_id UUID NOT NULL REFERENCES public.collective_agreements(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  extraction_type TEXT NOT NULL CHECK (extraction_type IN ('automatic', 'manual', 'correction')),
  processed_by UUID NOT NULL,
  processing_time_ms INTEGER,
  groups_extracted INTEGER NOT NULL DEFAULT 0,
  levels_extracted INTEGER NOT NULL DEFAULT 0,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_model_used TEXT,
  extraction_prompt TEXT,
  raw_response TEXT,
  errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.collective_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_extractions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para collective_agreements
CREATE POLICY "org_members_manage_agreements" ON public.collective_agreements
  FOR ALL USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

-- Políticas RLS para professional_groups
CREATE POLICY "org_members_manage_groups" ON public.professional_groups
  FOR ALL USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

-- Políticas RLS para salary_levels
CREATE POLICY "org_members_manage_levels" ON public.salary_levels
  FOR ALL USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

-- Políticas RLS para agreement_extractions
CREATE POLICY "org_members_view_extractions" ON public.agreement_extractions
  FOR SELECT USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

-- Crear índices para mejor rendimiento
CREATE INDEX idx_collective_agreements_org_id ON public.collective_agreements(org_id);
CREATE INDEX idx_collective_agreements_status ON public.collective_agreements(status);
CREATE INDEX idx_collective_agreements_active ON public.collective_agreements(org_id, is_active) WHERE is_active = true;
CREATE INDEX idx_professional_groups_agreement ON public.professional_groups(agreement_id);
CREATE INDEX idx_professional_groups_org ON public.professional_groups(org_id);
CREATE INDEX idx_salary_levels_group ON public.salary_levels(professional_group_id);
CREATE INDEX idx_salary_levels_agreement ON public.salary_levels(agreement_id);
CREATE INDEX idx_agreement_extractions_agreement ON public.agreement_extractions(agreement_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_collective_agreements()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_collective_agreements_updated_at
  BEFORE UPDATE ON public.collective_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_collective_agreements();

CREATE TRIGGER update_professional_groups_updated_at
  BEFORE UPDATE ON public.professional_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_levels_updated_at
  BEFORE UPDATE ON public.salary_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para garantizar solo un convenio activo por organización
CREATE OR REPLACE FUNCTION public.ensure_single_active_agreement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Desactivar todos los otros convenios de la misma organización
    UPDATE public.collective_agreements 
    SET is_active = false 
    WHERE org_id = NEW.org_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_agreement_trigger
  AFTER UPDATE OF is_active ON public.collective_agreements
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.ensure_single_active_agreement();