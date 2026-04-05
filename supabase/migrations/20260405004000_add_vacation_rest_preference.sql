-- OP-41: Vacation rest entry/exit preference
-- Allows employees to choose whether their 2 weekly rest days are placed
-- BEFORE vacation starts (exit_with_rest) or AFTER vacation ends (enter_with_rest).

ALTER TABLE public.colaboradores
ADD COLUMN IF NOT EXISTS vacation_rest_preference text DEFAULT 'exit_with_rest'
CHECK (vacation_rest_preference IN ('exit_with_rest', 'enter_with_rest'));

COMMENT ON COLUMN public.colaboradores.vacation_rest_preference IS
  'Whether employee prefers rest days before (exit_with_rest) or after (enter_with_rest) vacation blocks';
