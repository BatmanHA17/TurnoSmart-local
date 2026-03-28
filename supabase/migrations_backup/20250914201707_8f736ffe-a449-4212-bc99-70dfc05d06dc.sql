-- Crear tabla para historial de cambios de contratos
CREATE TABLE IF NOT EXISTS public.contract_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  change_type text NOT NULL, -- 'created', 'modified', 'terminated'
  change_description text,
  field_changed text, -- nombre del campo que cambió
  old_value text, -- valor anterior (en JSON si es necesario)
  new_value text, -- nuevo valor (en JSON si es necesario)
  changed_by text, -- usuario que realizó el cambio
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contract_history ENABLE ROW LEVEL SECURITY;

-- Política para leer el historial
CREATE POLICY "Allow public read access on contract_history" 
ON public.contract_history 
FOR SELECT 
USING (true);

-- Política para insertar en el historial
CREATE POLICY "Allow public write access on contract_history" 
ON public.contract_history 
FOR INSERT 
WITH CHECK (true);

-- Índice para búsquedas eficientes
CREATE INDEX idx_contract_history_colaborador_id ON public.contract_history(colaborador_id);
CREATE INDEX idx_contract_history_created_at ON public.contract_history(created_at DESC);