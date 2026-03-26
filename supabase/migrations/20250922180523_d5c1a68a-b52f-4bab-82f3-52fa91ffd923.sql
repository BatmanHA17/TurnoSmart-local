-- Crear tabla para cache de texto troceado (para Q&A y extracción focalizada)
CREATE TABLE IF NOT EXISTS public.agreement_text_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.collective_agreements(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  idx INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crear tabla para historial de interacciones con IA (extracciones y preguntas libres)
CREATE TABLE IF NOT EXISTS public.agreement_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.collective_agreements(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('extract','qa')),
  prompt TEXT NOT NULL,
  response JSONB,
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  error TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_agreement_text_chunks_agreement ON public.agreement_text_chunks(agreement_id, idx);
CREATE INDEX IF NOT EXISTS idx_agreement_interactions_agreement ON public.agreement_interactions(agreement_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.agreement_text_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para org_id
CREATE POLICY "org_chunks_policy" ON public.agreement_text_chunks
  FOR ALL USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "org_interactions_policy" ON public.agreement_interactions
  FOR ALL USING (org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()));

-- Grants necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.agreement_text_chunks TO authenticated;
GRANT ALL ON public.agreement_interactions TO authenticated;