-- Agregar campos adicionales para el formulario de edición
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS genero TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS apellidos_nacimiento TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS nacionalidad TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS provincia TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS ciudad_nacimiento TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS estado_civil TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS numero_personas_dependientes INTEGER;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS fecha_antiguedad DATE;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS trabajador_extranjero_permiso BOOLEAN DEFAULT false;