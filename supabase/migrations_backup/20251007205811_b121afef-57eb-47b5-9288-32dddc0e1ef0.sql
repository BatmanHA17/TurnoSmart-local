
-- Eliminar turnos "Primer día" que fueron creados como ShiftCards
-- El mensaje "Primer día" debe ser solo visual, no un turno real
DELETE FROM calendar_shifts
WHERE shift_name LIKE '%Primer%día%'
AND start_time IS NULL
AND end_time IS NULL;
