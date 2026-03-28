-- Limpiar completamente todos los turnos existentes
DELETE FROM public.calendar_shifts;

-- Limpiar también saved_shifts para empezar completamente limpio
DELETE FROM public.saved_shifts;

-- Resetear las secuencias si existen
-- No hay secuencias auto-incrementales en estas tablas, usan UUID