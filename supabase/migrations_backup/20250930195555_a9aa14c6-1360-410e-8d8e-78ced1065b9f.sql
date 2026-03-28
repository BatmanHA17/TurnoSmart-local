-- Fase 2: Crear tabla para acceso de colaboradores a organizaciones
CREATE TABLE IF NOT EXISTS public.colaborador_organization_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(colaborador_id, org_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_colab_org_access_colaborador ON public.colaborador_organization_access(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_colab_org_access_org ON public.colaborador_organization_access(org_id);
CREATE INDEX IF NOT EXISTS idx_colab_org_access_active ON public.colaborador_organization_access(is_active);

-- RLS policies
ALTER TABLE public.colaborador_organization_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_access"
ON public.colaborador_organization_access
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "org_admins_manage_access"
ON public.colaborador_organization_access
FOR ALL
USING (
  org_id IN (
    SELECT org_id FROM memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('OWNER', 'ADMIN')
  )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_colaborador_org_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_colaborador_org_access_timestamp
BEFORE UPDATE ON public.colaborador_organization_access
FOR EACH ROW
EXECUTE FUNCTION update_colaborador_org_access_updated_at();

-- Fase 4: Expandir tabla organizations con campos adicionales
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS establishment_address TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS is_franchise BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS health_service_code TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS convenio_colectivo TEXT,
ADD COLUMN IF NOT EXISTS mutua TEXT,
ADD COLUMN IF NOT EXISTS codigo_naf TEXT,
ADD COLUMN IF NOT EXISTS base_calculo_vacaciones TEXT,
ADD COLUMN IF NOT EXISTS tipo_comida TEXT,
ADD COLUMN IF NOT EXISTS adquisicion_mensual DECIMAL,
ADD COLUMN IF NOT EXISTS periodo_adquisicion_del INTEGER,
ADD COLUMN IF NOT EXISTS periodo_adquisicion_mes TEXT,
ADD COLUMN IF NOT EXISTS periodo_adquisicion_ano TEXT;

-- Migrar datos existentes de colaborador a accesos (si tienen org_id)
INSERT INTO public.colaborador_organization_access (colaborador_id, org_id, granted_by, is_active)
SELECT DISTINCT 
  c.id,
  c.org_id,
  NULL::uuid,
  true
FROM public.colaboradores c
WHERE c.org_id IS NOT NULL
ON CONFLICT (colaborador_id, org_id) DO NOTHING;