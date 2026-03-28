-- Crear tabla para configuración RGPD
CREATE TABLE public.rgpd_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_retention_years INTEGER DEFAULT 5,
  consent_required BOOLEAN DEFAULT true,
  privacy_policy TEXT,
  cookie_consent BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.rgpd_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para que los usuarios solo puedan acceder a su propia configuración
CREATE POLICY "Users can view their own RGPD settings" 
ON public.rgpd_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RGPD settings" 
ON public.rgpd_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RGPD settings" 
ON public.rgpd_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RGPD settings" 
ON public.rgpd_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_rgpd_settings_updated_at
BEFORE UPDATE ON public.rgpd_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();