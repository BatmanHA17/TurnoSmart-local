-- Crear tabla para almacenar categorías profesionales extraídas
CREATE TABLE IF NOT EXISTS public.professional_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.collective_agreements(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('nivel', 'categoria', 'grupo_profesional')),
  description TEXT,
  salary_level INTEGER,
  extracted_from TEXT, -- Texto original de donde se extrajo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(agreement_id, category_name, category_type)
);

-- Enable RLS
ALTER TABLE public.professional_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "org_members_view_categories" 
ON public.professional_categories 
FOR SELECT 
USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "org_admins_manage_categories" 
ON public.professional_categories 
FOR ALL 
USING (org_id IN (
  SELECT m.org_id FROM memberships m 
  WHERE m.user_id = auth.uid() 
  AND m.role IN ('OWNER', 'ADMIN')
));

-- Índices para performance
CREATE INDEX idx_professional_categories_agreement ON public.professional_categories(agreement_id);
CREATE INDEX idx_professional_categories_org ON public.professional_categories(org_id);
CREATE INDEX idx_professional_categories_type ON public.professional_categories(category_type);

-- Función para insertar categorías desde la extracción
CREATE OR REPLACE FUNCTION public.insert_extracted_categories(
  p_agreement_id UUID,
  p_categories JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  category_record JSONB;
  inserted_count INTEGER := 0;
  agreement_org_id UUID;
BEGIN
  -- Obtener org_id del convenio
  SELECT org_id INTO agreement_org_id 
  FROM public.collective_agreements 
  WHERE id = p_agreement_id;
  
  IF agreement_org_id IS NULL THEN
    RAISE EXCEPTION 'Agreement not found or no org_id';
  END IF;
  
  -- Insertar cada categoría
  FOR category_record IN SELECT * FROM jsonb_array_elements(p_categories)
  LOOP
    INSERT INTO public.professional_categories (
      agreement_id,
      org_id,
      category_name,
      category_type,
      description,
      extracted_from,
      created_by
    ) VALUES (
      p_agreement_id,
      agreement_org_id,
      category_record->>'name',
      category_record->>'type',
      category_record->>'description',
      category_record->>'extracted_from',
      auth.uid()
    )
    ON CONFLICT (agreement_id, category_name, category_type) 
    DO UPDATE SET
      description = EXCLUDED.description,
      extracted_from = EXCLUDED.extracted_from;
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;