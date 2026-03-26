-- Corregir problema de RLS - habilitar en tabla status_codes
ALTER TABLE public.status_codes ENABLE ROW LEVEL SECURITY;

-- Mejorar funciones con search_path para seguridad
CREATE OR REPLACE FUNCTION public.calculate_cuadrante_stats(cuadrante_uuid UUID, target_date INTEGER)
RETURNS TABLE (
  presencial_count INTEGER,
  banquetes_count INTEGER,
  libres_count INTEGER,
  vacaciones_count INTEGER,
  enfermos_count INTEGER,
  faltas_count INTEGER,
  total_plantilla INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN ca.status_code = 'X' THEN 1 END)::INTEGER as presencial_count,
    COUNT(CASE WHEN ca.status_code = 'XB' THEN 1 END)::INTEGER as banquetes_count,
    COUNT(CASE WHEN ca.status_code = 'L' THEN 1 END)::INTEGER as libres_count,
    COUNT(CASE WHEN ca.status_code = 'V' THEN 1 END)::INTEGER as vacaciones_count,
    COUNT(CASE WHEN ca.status_code = 'E' THEN 1 END)::INTEGER as enfermos_count,
    COUNT(CASE WHEN ca.status_code = 'F' THEN 1 END)::INTEGER as faltas_count,
    COUNT(*)::INTEGER as total_plantilla
  FROM public.cuadrante_assignments ca
  WHERE ca.cuadrante_id = cuadrante_uuid 
    AND ca.day_of_month = target_date;
END;
$$;

-- Mejorar función de validación con search_path
CREATE OR REPLACE FUNCTION public.validate_consecutive_days_off(
  cuadrante_uuid UUID, 
  employee_uuid UUID,
  week_start INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_off INTEGER[];
  consecutive_count INTEGER := 0;
  has_two_consecutive BOOLEAN := FALSE;
  i INTEGER;
BEGIN
  -- Obtener días libres de la semana (7 días)
  SELECT ARRAY_AGG(day_of_month ORDER BY day_of_month) INTO days_off
  FROM public.cuadrante_assignments ca
  WHERE ca.cuadrante_id = cuadrante_uuid 
    AND ca.employee_id = employee_uuid
    AND ca.status_code = 'L'
    AND ca.day_of_month BETWEEN week_start AND week_start + 6;
  
  -- Verificar si hay al menos 2 días libres consecutivos
  IF array_length(days_off, 1) >= 2 THEN
    FOR i IN 1..array_length(days_off, 1) - 1 LOOP
      IF days_off[i+1] = days_off[i] + 1 THEN
        consecutive_count := consecutive_count + 1;
        IF consecutive_count >= 1 THEN -- 2 días consecutivos
          has_two_consecutive := TRUE;
          EXIT;
        END IF;
      ELSE
        consecutive_count := 0;
      END IF;
    END LOOP;
  END IF;
  
  RETURN has_two_consecutive;
END;
$$;

-- Mejorar función de timestamp con search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;