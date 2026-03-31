-- =============================================================================
-- DB/DG Accumulator: Tracking de días debidos por guardias y horas extra
-- DB (Día Debido): se acumula cuando un empleado supera 40h semanales (+8h = +1 DB)
-- DG (Debido Guardia): se acumula por cada guardia (G/GT) realizada por el FOM
-- =============================================================================

-- Añadir columnas de acumulador a employee_equity
ALTER TABLE employee_equity
  ADD COLUMN IF NOT EXISTS db_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dg_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_hours_accumulated NUMERIC(5,1) DEFAULT 0;

-- Comentarios
COMMENT ON COLUMN employee_equity.db_balance IS 'Días debidos acumulados (+1 por cada 8h extra sobre 40h/semana)';
COMMENT ON COLUMN employee_equity.dg_balance IS 'Días debidos por guardias FOM (G/GT) no compensados';
COMMENT ON COLUMN employee_equity.overtime_hours_accumulated IS 'Horas extra parciales acumuladas hacia el siguiente DB';
