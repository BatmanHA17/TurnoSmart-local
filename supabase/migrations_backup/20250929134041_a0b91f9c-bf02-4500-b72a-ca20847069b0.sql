-- Permitir valores NULL en start_time y end_time para turnos de ausencia
ALTER TABLE public.calendar_shifts 
ALTER COLUMN start_time DROP NOT NULL;

ALTER TABLE public.calendar_shifts 
ALTER COLUMN end_time DROP NOT NULL;