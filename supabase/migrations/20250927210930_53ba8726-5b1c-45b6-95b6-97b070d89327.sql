-- Agregar columnas para la nueva funcionalidad de descansos en saved_shifts
ALTER TABLE public.saved_shifts 
ADD COLUMN IF NOT EXISTS breaks JSONB,
ADD COLUMN IF NOT EXISTS has_break BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_break_time INTEGER DEFAULT 0;

-- Crear índice para búsquedas por descansos
CREATE INDEX IF NOT EXISTS idx_saved_shifts_has_break ON public.saved_shifts(has_break);

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN public.saved_shifts.breaks IS 'Array JSON de objetos Break con información detallada de descansos';
COMMENT ON COLUMN public.saved_shifts.has_break IS 'Indica si el turno tiene descansos configurados';
COMMENT ON COLUMN public.saved_shifts.total_break_time IS 'Tiempo total de descanso en minutos';