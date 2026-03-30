-- Añadir columnas faltantes a colaboradores
-- El componente GoogleCalendarStyle.tsx las necesita para renderizar empleados

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='apellidos') THEN
    ALTER TABLE colaboradores ADD COLUMN apellidos TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='avatar_url') THEN
    ALTER TABLE colaboradores ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='tiempo_trabajo_semanal') THEN
    ALTER TABLE colaboradores ADD COLUMN tiempo_trabajo_semanal INTEGER DEFAULT 40; -- horas/semana
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='tipo_contrato') THEN
    ALTER TABLE colaboradores ADD COLUMN tipo_contrato TEXT DEFAULT 'Indefinido';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='fecha_inicio_contrato') THEN
    ALTER TABLE colaboradores ADD COLUMN fecha_inicio_contrato DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='fecha_fin_contrato') THEN
    ALTER TABLE colaboradores ADD COLUMN fecha_fin_contrato DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='telefono') THEN
    ALTER TABLE colaboradores ADD COLUMN telefono TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='dni') THEN
    ALTER TABLE colaboradores ADD COLUMN dni TEXT;
  END IF;
END $$;
