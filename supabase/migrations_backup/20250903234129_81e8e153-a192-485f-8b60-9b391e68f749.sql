-- Crear tabla para turnos públicos
CREATE TABLE public.turnos_publicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  employee_count INTEGER NOT NULL DEFAULT 0,
  shift_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.turnos_publicos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on turnos_publicos" 
ON public.turnos_publicos 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public write access on turnos_publicos" 
ON public.turnos_publicos 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_turnos_publicos_updated_at
BEFORE UPDATE ON public.turnos_publicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint for status values
ALTER TABLE public.turnos_publicos 
ADD CONSTRAINT turnos_publicos_status_check 
CHECK (status IN ('draft', 'published'));