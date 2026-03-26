-- Actualizar nombres de ausencias para eliminar "Ausencia -" y cambiar Sancionado por "Ausencia Legal"
UPDATE public.saved_shifts 
SET name = CASE 
  WHEN name = 'Ausencia - Curso' THEN 'Curso'
  WHEN name = 'Ausencia - Enfermo/Accidente' THEN 'Enfermo/Accidente'
  WHEN name = 'Ausencia - Falta' THEN 'Falta'
  WHEN name = 'Ausencia - Día Libre' THEN 'Día Libre'
  WHEN name = 'Ausencia - Permiso' THEN 'Permiso'
  WHEN name = 'Ausencia - Sancionado' THEN 'Ausencia Legal'
  WHEN name = 'Ausencia - Vacaciones' THEN 'Vacaciones'
  WHEN name = 'Ausencia - Horas Sindicales' THEN 'Horas Sindicales'
  ELSE name
END
WHERE access_type = 'absence';