-- Add version control to turnos_publicos table
ALTER TABLE public.turnos_publicos 
ADD COLUMN version NUMERIC DEFAULT 1.0,
ADD COLUMN parent_turno_id UUID REFERENCES public.turnos_publicos(id),
ADD COLUMN is_current_version BOOLEAN DEFAULT true,
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN sent_emails TEXT[];

-- Create index for better performance
CREATE INDEX idx_turnos_publicos_status ON public.turnos_publicos(status);
CREATE INDEX idx_turnos_publicos_version ON public.turnos_publicos(is_current_version, version);

-- Update existing records to have proper version
UPDATE public.turnos_publicos SET is_current_version = true WHERE version IS NULL;