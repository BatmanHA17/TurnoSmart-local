-- Verificar y organizar tablas para niveles y categorías profesionales

-- Crear tabla professional_levels si no existe
CREATE TABLE IF NOT EXISTS public.professional_levels (
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

-- Verificar si professional_categories tiene la estructura correcta y actualizarla si es necesario
DO $$
BEGIN
    -- Agregar level_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_categories' 
                   AND column_name = 'level_id' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.professional_categories 
        ADD COLUMN level_id UUID REFERENCES public.professional_levels(id) ON DELETE CASCADE;
    END IF;
    
    -- Agregar category_code si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_categories' 
                   AND column_name = 'category_code' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.professional_categories 
        ADD COLUMN category_code TEXT;
    END IF;
END $$;

-- Habilitar RLS en professional_levels si no está habilitado
ALTER TABLE public.professional_levels ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para professional_levels si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professional_levels' AND policyname = 'org_members_manage_professional_levels') THEN
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
    END IF;
END $$;

-- Crear trigger para updated_at en professional_levels si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_professional_levels_updated_at') THEN
        CREATE TRIGGER update_professional_levels_updated_at
            BEFORE UPDATE ON public.professional_levels
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_prof_levels_org ON public.professional_levels(org_id);
CREATE INDEX IF NOT EXISTS idx_prof_categories_level ON public.professional_categories(level_id);

-- Eliminar la tabla job_titles ya que será reemplazada por el sistema de niveles y categorías
DROP TABLE IF EXISTS public.job_titles CASCADE;