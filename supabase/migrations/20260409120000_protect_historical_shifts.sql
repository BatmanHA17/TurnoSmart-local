-- ============================================================================
-- Protección DB: Impedir borrado de turnos históricos (is_historical = true)
-- Los históricos solo se pueden borrar con: SET LOCAL app.allow_historical_delete = 'true';
-- ============================================================================

CREATE OR REPLACE FUNCTION protect_historical_shifts()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow override via session variable for explicit admin operations
  IF current_setting('app.allow_historical_delete', true) = 'true' THEN
    RETURN OLD;
  END IF;

  IF OLD.is_historical = true THEN
    RAISE EXCEPTION 'No se pueden eliminar turnos históricos (id: %). Use SET LOCAL app.allow_historical_delete = ''true'' para override.', OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_historical_shifts ON calendar_shifts;

CREATE TRIGGER trg_protect_historical_shifts
  BEFORE DELETE ON calendar_shifts
  FOR EACH ROW
  EXECUTE FUNCTION protect_historical_shifts();

COMMENT ON FUNCTION protect_historical_shifts() IS
  'Prevents deletion of historical (imported) shifts unless explicitly overridden via session variable';
