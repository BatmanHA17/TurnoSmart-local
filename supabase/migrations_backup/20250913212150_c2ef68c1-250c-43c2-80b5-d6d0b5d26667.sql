-- Actualizar los turnos por defecto para incluir información de descansos
UPDATE public.saved_shifts 
SET 
  break_type = 'meal',
  break_duration = '30'
WHERE name IN ('Turno Mañana', 'Turno Tarde', 'Turno Noche');