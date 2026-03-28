-- Crear tabla para establecimientos
CREATE TABLE IF NOT EXISTS public.establishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  convenio_colectivo TEXT,
  codigo_naf TEXT,
  cif TEXT,
  mutua TEXT,
  direccion TEXT,
  base_calculo_vacaciones TEXT DEFAULT 'Por 6 días laborales',
  adquisicion_mensual DECIMAL(3,1) DEFAULT 2.5,
  periodo_adquisicion_del INTEGER DEFAULT 1,
  periodo_adquisicion_mes TEXT DEFAULT 'febrero',
  periodo_adquisicion_ano TEXT DEFAULT '31 ene. N+1',
  tipo_comida TEXT DEFAULT 'BND',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

-- Crear políticas para establecimientos
CREATE POLICY "Users can view establishments" 
ON public.establishments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create establishments" 
ON public.establishments 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update establishments" 
ON public.establishments 
FOR UPDATE 
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'super_admin')
));

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_establishments_updated_at
BEFORE UPDATE ON public.establishments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar establecimiento por defecto GOTHAM
INSERT INTO public.establishments (
  name, 
  convenio_colectivo, 
  codigo_naf, 
  cif, 
  mutua,
  direccion
) VALUES (
  'GOTHAM',
  'HOSTELERÍA, CAFÉS, RESTAURANTES...HOT-12:00 TGTRE - 1',
  '553020',
  '12 se acuerde',
  'No rellenado',
  ''
) ON CONFLICT DO NOTHING;