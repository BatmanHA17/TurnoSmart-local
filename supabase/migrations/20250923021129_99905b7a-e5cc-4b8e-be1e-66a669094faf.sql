-- 1. Crear tabla de niveles profesionales si no existe con estructura completa
CREATE TABLE IF NOT EXISTS public.professional_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level_code TEXT,
  description TEXT,
  org_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Crear tabla de categorías profesionales con referencia a niveles
CREATE TABLE IF NOT EXISTS public.professional_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_code TEXT,
  description TEXT,
  level_id UUID REFERENCES public.professional_levels(id),
  agreement_id UUID REFERENCES public.collective_agreements(id),
  category_type TEXT,
  extracted_from TEXT,
  org_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Agregar foreign keys para conectar jobs con departamentos y categorías
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.job_departments(id),
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.professional_categories(id);

-- 4. Crear foreign key de colaboradores a jobs
ALTER TABLE public.colaboradores 
ADD CONSTRAINT IF NOT EXISTS fk_colaboradores_job 
FOREIGN KEY (job_id) REFERENCES public.jobs(id);

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE public.professional_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_categories ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para professional_levels
CREATE POLICY "org_members_manage_professional_levels" 
ON public.professional_levels 
FOR ALL 
USING (org_id IN (
  SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
));

-- 7. Políticas RLS para professional_categories
CREATE POLICY "org_members_manage_professional_categories" 
ON public.professional_categories 
FOR ALL 
USING (org_id IN (
  SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
));

-- 8. Triggers para updated_at
CREATE OR REPLACE TRIGGER update_professional_levels_updated_at
  BEFORE UPDATE ON public.professional_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_professional_categories_updated_at
  BEFORE UPDATE ON public.professional_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_professional_levels_org_id ON public.professional_levels(org_id);
CREATE INDEX IF NOT EXISTS idx_professional_categories_org_id ON public.professional_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_professional_categories_level_id ON public.professional_categories(level_id);
CREATE INDEX IF NOT EXISTS idx_jobs_department_id ON public.jobs(department_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category_id ON public.jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_job_id ON public.colaboradores(job_id);