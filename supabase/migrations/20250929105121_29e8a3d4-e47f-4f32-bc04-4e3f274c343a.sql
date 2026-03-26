-- Actualizar el nombre del turno en calendar_shifts para sincronizar con saved_shifts
UPDATE calendar_shifts 
SET shift_name = 'Opening'
WHERE shift_name = 'Mañana' 
AND employee_id = 'cece7ffb-8e11-47e1-9423-4d2d46d06f3d';