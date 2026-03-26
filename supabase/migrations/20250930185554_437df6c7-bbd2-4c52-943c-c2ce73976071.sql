-- Add generalized access field to colaboradores table
ALTER TABLE public.colaboradores 
ADD COLUMN has_generalized_access boolean NOT NULL DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN public.colaboradores.has_generalized_access IS 'When true, the colaborador has access to all teams/rotas/calendars in the organization';

-- Create index for faster queries
CREATE INDEX idx_colaboradores_generalized_access ON public.colaboradores(has_generalized_access) WHERE has_generalized_access = true;