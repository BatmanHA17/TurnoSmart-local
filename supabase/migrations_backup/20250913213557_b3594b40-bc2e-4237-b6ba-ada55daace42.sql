-- Insertar ShiftCards de ausencias basadas en los códigos de status existentes
INSERT INTO public.saved_shifts (name, start_time, end_time, color, access_type, department, notes, break_type, break_duration) VALUES
('Ausencia - Curso', '00:00', '23:59', '#06b6d4', 'absence', 'general', 'Día completo por curso de formación', null, null),
('Ausencia - Enfermo/Accidente', '00:00', '23:59', '#ef4444', 'absence', 'general', 'Día completo por enfermedad o accidente', null, null),
('Ausencia - Falta', '00:00', '23:59', '#dc2626', 'absence', 'general', 'Día completo por falta injustificada', null, null),
('Ausencia - Horas Sindicales', '00:00', '23:59', '#84cc16', 'absence', 'general', 'Día completo por horas sindicales', null, null),
('Ausencia - Día Libre', '00:00', '23:59', '#10b981', 'absence', 'general', 'Día libre programado', null, null),
('Ausencia - Permiso', '00:00', '23:59', '#f97316', 'absence', 'general', 'Día completo por permiso autorizado', null, null),
('Ausencia - Sancionado', '00:00', '23:59', '#71717a', 'absence', 'general', 'Día completo por sanción disciplinaria', null, null),
('Ausencia - Vacaciones', '00:00', '23:59', '#f59e0b', 'absence', 'general', 'Día completo de vacaciones', null, null);