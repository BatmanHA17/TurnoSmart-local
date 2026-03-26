-- FASE 1: Pre-check y limpieza de employee_id huérfanos
-- Detectar y limpiar referencias a colaboradores inexistentes
DO $$
DECLARE
  orphan_count integer;
BEGIN
  -- Contar employee_id que no existen en colaboradores
  SELECT COUNT(*) INTO orphan_count
  FROM public.calendar_shifts cs
  LEFT JOIN public.colaboradores c ON c.id = cs.employee_id
  WHERE cs.employee_id IS NOT NULL AND c.id IS NULL;
  
  RAISE NOTICE 'Employee_id huérfanos encontrados: %', orphan_count;
  
  -- Si hay huérfanos, ponerlos a NULL para evitar violación de FK
  IF orphan_count > 0 THEN
    UPDATE public.calendar_shifts cs
    SET employee_id = NULL
    WHERE employee_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.colaboradores c WHERE c.id = cs.employee_id
      );
    RAISE NOTICE 'Employee_id huérfanos limpiados (puestos a NULL)';
  END IF;
END $$;

-- FASE 2: Crear FK con NOT VALID (no bloquea tabla, no valida existentes)
ALTER TABLE public.calendar_shifts 
ADD CONSTRAINT calendar_shifts_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.colaboradores(id) 
ON DELETE SET NULL
NOT VALID;

-- FASE 3: Validar FK (revisa todos los registros)
-- Puede tardar según volumen, pero no bloquea escrituras
ALTER TABLE public.calendar_shifts 
VALIDATE CONSTRAINT calendar_shifts_employee_id_fkey;