-- Primero, vamos a actualizar el enum de roles para incluir los roles específicos del hotel
DO $$ 
BEGIN
    -- Intentar crear el tipo si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hotel_role') THEN
        CREATE TYPE public.hotel_role AS ENUM (
            'propietario',
            'administrador', 
            'director',
            'manager',
            'jefe_departamento',
            'empleado'
        );
    END IF;
END $$;

-- Actualizar el enum app_role existente para incluir los nuevos roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'propietario';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'administrador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'jefe_departamento';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'empleado';

-- Crear tabla para la relación entre colaboradores y roles específicos del hotel
CREATE TABLE IF NOT EXISTS public.colaborador_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
    role hotel_role NOT NULL,
    departamento TEXT,
    asignado_por UUID REFERENCES auth.users(id),
    asignado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
    activo BOOLEAN DEFAULT true,
    
    -- Evitar roles duplicados por colaborador (excepto cuando sean de diferentes departamentos)
    UNIQUE(colaborador_id, role, departamento)
);

-- Habilitar RLS
ALTER TABLE public.colaborador_roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para colaborador_roles
CREATE POLICY "Admins can manage colaborador roles" 
ON public.colaborador_roles FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('super_admin', 'admin', 'propietario', 'administrador')
    )
);

CREATE POLICY "Everyone can view colaborador roles" 
ON public.colaborador_roles FOR SELECT 
USING (true);

-- Insertar roles por defecto para colaboradores existentes
INSERT INTO public.colaborador_roles (colaborador_id, role)
SELECT id, 'empleado'::hotel_role
FROM public.colaboradores 
WHERE NOT EXISTS (
    SELECT 1 FROM public.colaborador_roles 
    WHERE colaborador_id = colaboradores.id
);

-- Función para obtener el rol principal de un colaborador
CREATE OR REPLACE FUNCTION public.get_colaborador_main_role(colaborador_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::text
    FROM public.colaborador_roles
    WHERE colaborador_id = colaborador_uuid 
    AND activo = true
    ORDER BY 
        CASE role
            WHEN 'propietario' THEN 1
            WHEN 'administrador' THEN 2
            WHEN 'director' THEN 3
            WHEN 'manager' THEN 4
            WHEN 'jefe_departamento' THEN 5
            WHEN 'empleado' THEN 6
        END
    LIMIT 1;
$$;