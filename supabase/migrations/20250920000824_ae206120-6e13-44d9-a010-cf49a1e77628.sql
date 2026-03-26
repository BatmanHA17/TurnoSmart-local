-- Crear tabla para empleos/puestos de trabajo
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  hours INTEGER DEFAULT 8,
  rate_unit NUMERIC DEFAULT 1.0,
  department TEXT DEFAULT 'Bares',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own jobs or admins can update all" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = created_by OR is_admin(auth.uid()));

CREATE POLICY "Users can delete their own jobs or admins can delete all" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() = created_by OR is_admin(auth.uid()));

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();