-- Crear tablas para departamentos y títulos de puesto personalizables

-- Tabla para departamentos personalizados
CREATE TABLE public.job_departments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    value TEXT NOT NULL,
    org_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para títulos de puesto personalizados
CREATE TABLE public.job_titles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    value TEXT NOT NULL,
    org_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.job_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para job_departments
CREATE POLICY "org_members_manage_job_departments" 
ON public.job_departments 
FOR ALL 
USING (
    org_id IN (
        SELECT m.org_id 
        FROM memberships m 
        WHERE m.user_id = auth.uid()
    )
);

-- Políticas RLS para job_titles
CREATE POLICY "org_members_manage_job_titles" 
ON public.job_titles 
FOR ALL 
USING (
    org_id IN (
        SELECT m.org_id 
        FROM memberships m 
        WHERE m.user_id = auth.uid()
    )
);

-- Trigger para updated_at en job_departments
CREATE TRIGGER update_job_departments_updated_at
    BEFORE UPDATE ON public.job_departments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en job_titles
CREATE TRIGGER update_job_titles_updated_at
    BEFORE UPDATE ON public.job_titles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunos departamentos y títulos por defecto
INSERT INTO public.job_departments (value, org_id, created_by) VALUES
('Bares', NULL, NULL),
('Cocina', NULL, NULL),
('Recepción', NULL, NULL),
('Housekeeping', NULL, NULL),
('Mantenimiento', NULL, NULL),
('Administración', NULL, NULL);

INSERT INTO public.job_titles (value, org_id, created_by) VALUES
('Camarero/a', NULL, NULL),
('Jefe de Bares', NULL, NULL),
('Segundo Jefe de Bares', NULL, NULL),
('Jefe de Sector', NULL, NULL),
('Ayudante de Camarero', NULL, NULL),
('Cocinero/a', NULL, NULL),
('Jefe de Cocina', NULL, NULL),
('Recepcionista', NULL, NULL),
('Conserje', NULL, NULL),
('Camarera de Pisos', NULL, NULL);