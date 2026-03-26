-- Create activity_log table for tracking all system activities
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'colaborador', 'cuadrante', 'turno', etc.
  entity_id UUID,
  entity_name TEXT,
  establishment TEXT,
  details JSONB, -- Additional details about the action
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for activity log
CREATE POLICY "Admins can view all activity logs" 
ON public.activity_log 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can create activity logs" 
ON public.activity_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_establishment ON public.activity_log(establishment);
CREATE INDEX idx_activity_log_entity_type ON public.activity_log(entity_type);

-- Function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
  _user_name TEXT,
  _action TEXT,
  _entity_type TEXT,
  _entity_id UUID DEFAULT NULL,
  _entity_name TEXT DEFAULT NULL,
  _establishment TEXT DEFAULT 'GOTHAM',
  _details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.activity_log (
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    entity_name,
    establishment,
    details
  ) VALUES (
    auth.uid(),
    _user_name,
    _action,
    _entity_type,
    _entity_id,
    _entity_name,
    _establishment,
    _details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Insert some sample activity data to match the mockup
INSERT INTO public.activity_log (user_id, user_name, action, entity_type, entity_name, establishment, created_at) VALUES
(auth.uid(), 'BATMAN BATMAN', 'ha suprimido un descanso (Ausencia) de GOTHAM (Planning) para la semana del 15 septiembre', 'descanso', 'Ausencia', 'GOTHAM', '2025-09-15 20:06:00'),
(auth.uid(), 'BATMAN BATMAN', 'aprobó la solicitud de vacaciones de Spider Spiderman para el 15/09/2025', 'vacaciones', 'Spider Spiderman', 'GOTHAM', '2025-09-15 20:05:00'),
(auth.uid(), 'BATMAN BATMAN', 'creó una solicitud de vacaciones para el 15/09/2025', 'vacaciones', NULL, 'GOTHAM', '2025-09-15 20:02:00'),
(auth.uid(), 'BATMAN BATMAN', 'ha modificado un descanso (Permiso retribuido) de BATMAN BATMAN a 18/09', 'descanso', 'BATMAN BATMAN', 'GOTHAM', '2025-09-15 15:33:00'),
(auth.uid(), 'BATMAN BATMAN', 'ha modificado un descanso (Permiso retribuido) de BATMAN BATMAN a 18/09', 'descanso', 'BATMAN BATMAN', 'GOTHAM', '2025-09-15 15:33:00'),
(auth.uid(), 'BATMAN BATMAN', 'ha creado un descanso (Permiso retribuido) en el establecimiento GOTHAM (Planning) para la semana del 18 septiembre', 'descanso', 'Permiso retribuido', 'GOTHAM', '2025-09-15 15:05:00'),
(auth.uid(), 'BATMAN BATMAN', 'ha creado un descanso (Formación) en el establecimiento GOTHAM (Planning) para la semana del 19 septiembre', 'descanso', 'Formación', 'GOTHAM', '2025-09-15 15:02:00'),
(auth.uid(), 'BATMAN BATMAN', 'suprimió un descanso de BATMAN BATMAN en el establecimiento GOTHAM (Planning) el 15/09/2025', 'descanso', 'BATMAN BATMAN', 'GOTHAM', '2025-09-15 15:01:00'),
(auth.uid(), 'BATMAN BATMAN', 'ha creado un descanso (Ausencia) en el establecimiento GOTHAM (Planning) para la semana del 15 septiembre', 'descanso', 'Ausencia', 'GOTHAM', '2025-09-15 15:00:00'),
(auth.uid(), 'BATMAN BATMAN', 'ha creado un descanso (Descanso semanal) en el establecimiento GOTHAM (Planning) para la semana del 21 septiembre', 'descanso', 'Descanso semanal', 'GOTHAM', '2025-09-15 14:59:00'),
(auth.uid(), 'BATMAN BATMAN', 'ha creado un descanso (Descanso semanal) en el establecimiento GOTHAM (Planning) para la semana del 20 septiembre', 'descanso', 'Descanso semanal', 'GOTHAM', '2025-09-15 14:58:00'),
(auth.uid(), 'BATMAN BATMAN', 'suprimió Leonardo Davinci', 'colaborador', 'Leonardo Davinci', 'GOTHAM', '2025-09-14 22:30:00'),
(auth.uid(), 'BATMAN BATMAN', 'ha añadido Leonardo Davinci', 'colaborador', 'Leonardo Davinci', 'GOTHAM', '2025-09-14 22:30:00'),
(auth.uid(), 'BATMAN BATMAN', 'suprimió Leonardo Davinci', 'colaborador', 'Leonardo Davinci', 'GOTHAM', '2025-09-14 22:28:00'),
(auth.uid(), 'BATMAN BATMAN', 'ha añadido Leonardo Davinci', 'colaborador', 'Leonardo Davinci', 'GOTHAM', '2025-09-14 22:28:00');