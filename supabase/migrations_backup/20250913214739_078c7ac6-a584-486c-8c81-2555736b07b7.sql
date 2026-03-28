-- Actualizar ausencias para que sean de día completo (excepto Curso y Horas sindicales)
UPDATE public.saved_shifts 
SET 
  start_time = NULL,
  end_time = NULL
WHERE access_type = 'absence' 
  AND name NOT IN ('Ausencia - Curso', 'Ausencia - Horas sindicales');

-- Mantener horarios específicos solo para Curso y Horas sindicales
UPDATE public.saved_shifts 
SET 
  start_time = '08:00',
  end_time = '16:00'
WHERE access_type = 'absence' 
  AND name IN ('Ausencia - Curso', 'Ausencia - Horas sindicales');