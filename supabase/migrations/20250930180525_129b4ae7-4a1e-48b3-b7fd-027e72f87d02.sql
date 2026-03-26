-- Añadir columna para almacenar la disponibilidad semanal del colaborador
ALTER TABLE public.colaboradores 
ADD COLUMN IF NOT EXISTS disponibilidad_semanal jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.colaboradores.disponibilidad_semanal IS 'Días de la semana en los que el empleado tiene disponibilidad para trabajar. Formato: array de strings ["Lunes", "Martes", ...]';
