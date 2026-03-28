-- Limpiar ausencias existentes que tienen horario 00:00-23:59 incorrecto
UPDATE public.calendar_shifts 
SET start_time = NULL, end_time = NULL 
WHERE shift_name IN ('Libre', 'Vacaciones', 'Enfermo', 'Falta', 'Permiso', 'Baja', 'Curso', 'Horas Sindicales', 'Sancionado')
   OR (start_time = '00:00:00' AND end_time = '23:59:00');