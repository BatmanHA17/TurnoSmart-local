-- Agregar campos de contacto y salud a la tabla colaboradores
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS pais_nacimiento TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS codigo_postal TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS provincia TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS pais_residencia TEXT;

-- Campos de salud
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS numero_seguridad_social TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS minusvalia BOOLEAN DEFAULT false;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS ultima_revision_medica DATE;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS reconocimiento_medico_reforzado BOOLEAN DEFAULT false;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS exonerado_seguro_medico BOOLEAN DEFAULT false;

-- Campos de contacto de emergencia
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS contacto_emergencia_apellidos TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS contacto_emergencia_relacion TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS contacto_emergencia_movil TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS contacto_emergencia_fijo TEXT;