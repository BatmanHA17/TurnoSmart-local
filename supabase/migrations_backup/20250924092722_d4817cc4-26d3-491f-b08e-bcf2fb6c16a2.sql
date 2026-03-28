-- Crear tabla para almacenar horarios/turnos específicos por rota
CREATE TABLE public.rota_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rota_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  shift_name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 0, -- en minutos
  color TEXT DEFAULT '#86efac',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Índices para optimizar consultas
  CONSTRAINT unique_rota_colaborador_shift UNIQUE(rota_id, colaborador_id, shift_name)
);

-- Habilitar RLS
ALTER TABLE public.rota_shifts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rota_shifts
CREATE POLICY "org_members_view_rota_shifts" 
ON public.rota_shifts 
FOR SELECT 
USING (org_id IN (
  SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
));

CREATE POLICY "org_admins_manage_rota_shifts" 
ON public.rota_shifts 
FOR ALL 
USING (org_id IN (
  SELECT m.org_id FROM memberships m 
  WHERE m.user_id = auth.uid() 
  AND m.role IN ('OWNER', 'ADMIN', 'MANAGER')
))
WITH CHECK (org_id IN (
  SELECT m.org_id FROM memberships m 
  WHERE m.user_id = auth.uid() 
  AND m.role IN ('OWNER', 'ADMIN', 'MANAGER')
));

-- Colaboradores pueden ver sus propios horarios de rota
CREATE POLICY "colaboradores_view_own_rota_shifts" 
ON public.rota_shifts 
FOR SELECT 
USING (colaborador_id IN (
  SELECT c.id FROM colaboradores c
  JOIN profiles p ON p.email = c.email
  WHERE p.id = auth.uid() AND p.deleted_at IS NULL
));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_rota_shifts_updated_at
  BEFORE UPDATE ON public.rota_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Crear tabla para asignaciones de horarios por día (calendario específico por rota)
CREATE TABLE public.rota_schedule_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rota_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  work_date DATE NOT NULL,
  rota_shift_id UUID REFERENCES rota_shifts(id) ON DELETE SET NULL, -- horario específico asignado
  status_code TEXT DEFAULT 'X', -- X, L, V, E, F, etc.
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  
  -- Evitar duplicados por día, rota y colaborador
  CONSTRAINT unique_rota_colaborador_date UNIQUE(rota_id, colaborador_id, work_date)
);

-- Habilitar RLS
ALTER TABLE public.rota_schedule_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rota_schedule_assignments
CREATE POLICY "org_members_view_rota_assignments" 
ON public.rota_schedule_assignments 
FOR SELECT 
USING (org_id IN (
  SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
));

CREATE POLICY "org_admins_manage_rota_assignments" 
ON public.rota_schedule_assignments 
FOR ALL 
USING (org_id IN (
  SELECT m.org_id FROM memberships m 
  WHERE m.user_id = auth.uid() 
  AND m.role IN ('OWNER', 'ADMIN', 'MANAGER')
))
WITH CHECK (org_id IN (
  SELECT m.org_id FROM memberships m 
  WHERE m.user_id = auth.uid() 
  AND m.role IN ('OWNER', 'ADMIN', 'MANAGER')
));

-- Colaboradores pueden ver sus propias asignaciones
CREATE POLICY "colaboradores_view_own_assignments" 
ON public.rota_schedule_assignments 
FOR SELECT 
USING (colaborador_id IN (
  SELECT c.id FROM colaboradores c
  JOIN profiles p ON p.email = c.email
  WHERE p.id = auth.uid() AND p.deleted_at IS NULL
));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_rota_assignments_updated_at
  BEFORE UPDATE ON public.rota_schedule_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();