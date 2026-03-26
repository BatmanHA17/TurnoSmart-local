-- Crear tabla normalizada para información bancaria de empleados
CREATE TABLE IF NOT EXISTS public.employee_banking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  nombre_titular VARCHAR(255),
  iban VARCHAR(34), -- Máximo IBAN estándar
  bic VARCHAR(11), -- Máximo BIC estándar
  numero_identificacion_interna VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraint para un solo registro por colaborador
  UNIQUE(colaborador_id)
);

-- Habilitar RLS
ALTER TABLE public.employee_banking ENABLE ROW LEVEL SECURITY;

-- Política para lectura: miembros de la organización pueden ver
CREATE POLICY "banking_read_org_members" ON public.employee_banking
  FOR SELECT USING (
    org_id IN (
      SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
    )
  );

-- Política para escritura: solo administradores pueden crear/modificar datos bancarios
CREATE POLICY "banking_write_admins" ON public.employee_banking
  FOR ALL USING (
    org_id IN (
      SELECT m.org_id FROM memberships m 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('OWNER', 'ADMIN')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT m.org_id FROM memberships m 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('OWNER', 'ADMIN')
    )
  );

-- Crear índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_eb_colaborador_id ON public.employee_banking(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_eb_org_id ON public.employee_banking(org_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_employee_banking_updated_at
  BEFORE UPDATE ON public.employee_banking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();