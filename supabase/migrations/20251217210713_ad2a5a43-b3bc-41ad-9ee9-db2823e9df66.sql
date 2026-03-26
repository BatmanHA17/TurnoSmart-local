-- Eliminar turnos duplicados, dejando solo el más reciente para cada empleado+fecha
DELETE FROM calendar_shifts a
USING calendar_shifts b
WHERE a.employee_id = b.employee_id
  AND a.date = b.date
  AND a.id != b.id
  AND a.created_at < b.created_at;

-- Crear índice único para prevenir futuros duplicados (solo un turno por empleado por día)
-- Usamos un índice parcial que se puede ignorar si hay casos legítimos de turnos partidos
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_shifts_employee_date_unique 
ON calendar_shifts (employee_id, date);