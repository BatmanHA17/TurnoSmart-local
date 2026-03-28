-- Permitir NULL en start_time y end_time para ausencias de día completo
ALTER TABLE public.saved_shifts 
ALTER COLUMN start_time DROP NOT NULL,
ALTER COLUMN end_time DROP NOT NULL;

-- Actualizar ausencias para que sean de día completo (excepto Curso y Horas sindicales)
UPDATE public.saved_shifts 
SET 
  start_time = NULL,
  end_time = NULL
WHERE access_type = 'absence' 
  AND name NOT IN ('Ausencia - Curso', 'Ausencia - Horas Sindicales');

-- Mantener horarios específicos para Curso y Horas sindicales
UPDATE public.saved_shifts 
SET 
  start_time = '08:00',
  end_time = '16:00'
WHERE access_type = 'absence' 
  AND name IN ('Ausencia - Curso', 'Ausencia - Horas Sindicales');