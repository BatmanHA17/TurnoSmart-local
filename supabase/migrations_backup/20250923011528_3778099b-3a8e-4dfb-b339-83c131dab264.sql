-- Eliminar tabla job_titles y crear nuevas tablas para niveles y categorías profesionales
DROP TABLE IF EXISTS public.job_titles CASCADE;

-- Tabla para niveles profesionales (grupos profesionales)
CREATE TABLE public.professional_levels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    level_name TEXT NOT NULL,
    level_code TEXT,
    description TEXT,
    org_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(level_name, org_id)
);

-- Tabla para categorías profesionales 
CREATE TABLE public.professional_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_name TEXT NOT NULL,
    category_code TEXT,
    level_id UUID REFERENCES public.professional_levels(id) ON DELETE CASCADE,
    description TEXT,
    org_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(category_name, level_id, org_id)
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.professional_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para professional_levels
CREATE POLICY "org_members_manage_professional_levels" 
ON public.professional_levels 
FOR ALL 
USING (
    org_id IN (
        SELECT m.org_id 
        FROM memberships m 
        WHERE m.user_id = auth.uid()
    )
);

-- Políticas RLS para professional_categories
CREATE POLICY "org_members_manage_professional_categories" 
ON public.professional_categories 
FOR ALL 
USING (
    org_id IN (
        SELECT m.org_id 
        FROM memberships m 
        WHERE m.user_id = auth.uid()
    )
);

-- Triggers para updated_at
CREATE TRIGGER update_professional_levels_updated_at
    BEFORE UPDATE ON public.professional_levels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_categories_updated_at
    BEFORE UPDATE ON public.professional_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejor rendimiento
CREATE INDEX idx_prof_levels_org ON public.professional_levels(org_id);
CREATE INDEX idx_prof_categories_org ON public.professional_categories(org_id);
CREATE INDEX idx_prof_categories_level ON public.professional_categories(level_id);