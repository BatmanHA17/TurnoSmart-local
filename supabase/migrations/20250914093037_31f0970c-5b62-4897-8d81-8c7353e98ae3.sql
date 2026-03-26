-- Crear tabla colaboradores para almacenar toda la información del formulario
CREATE TABLE public.colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  apellidos_uso TEXT,
  empleado_id TEXT UNIQUE,
  fecha_nacimiento DATE,
  email TEXT NOT NULL,
  telefono_movil TEXT,
  pais_movil TEXT DEFAULT 'ES',
  telefono_fijo TEXT,
  pais_fijo TEXT DEFAULT 'ES',
  fecha_inicio_contrato DATE,
  hora_inicio_contrato TIME,
  tipo_contrato TEXT,
  status TEXT DEFAULT 'activo',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- Crear políticas para acceso público (siguiendo el patrón de otras tablas)
CREATE POLICY "Allow public read access on colaboradores" 
ON public.colaboradores 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public write access on colaboradores" 
ON public.colaboradores 
FOR ALL 
USING (true);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_colaboradores_updated_at
BEFORE UPDATE ON public.colaboradores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar datos de ejemplo
INSERT INTO public.colaboradores (
  nombre, 
  apellidos, 
  apellidos_uso,
  empleado_id,
  email,
  telefono_movil,
  pais_movil,
  tipo_contrato,
  status
) VALUES 
(
  'Batman',
  'Batman',
  'B. Batman',
  'EMP001',
  'calltobatmanuk@gmail.com',
  '+44 7333 998784',
  'GB',
  'Contrato indefinido',
  'activo'
);