-- Crear tabla para compensatory time off
CREATE TABLE public.compensatory_time_off (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL,
  balance_hours DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.compensatory_time_off ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access on compensatory_time_off" 
ON public.compensatory_time_off 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public write access on compensatory_time_off" 
ON public.compensatory_time_off 
FOR ALL 
USING (true);

-- Crear tabla para el historial de compensatory time off
CREATE TABLE public.compensatory_time_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL,
  action_description TEXT NOT NULL,
  hours_change DECIMAL NOT NULL,
  performed_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.compensatory_time_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access on compensatory_time_history" 
ON public.compensatory_time_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public write access on compensatory_time_history" 
ON public.compensatory_time_history 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_compensatory_time_off_updated_at
BEFORE UPDATE ON public.compensatory_time_off
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();