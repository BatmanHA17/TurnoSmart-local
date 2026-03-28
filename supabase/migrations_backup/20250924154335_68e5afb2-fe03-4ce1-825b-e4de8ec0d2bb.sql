-- Crear función para sincronizar job_departments con teams
CREATE OR REPLACE FUNCTION sync_job_department_to_teams()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Crear una rota automáticamente cuando se crea un nuevo equipo
    -- Solo si no existe ya una con el mismo nombre
    INSERT INTO public.teams (
      name,
      description,
      org_id,
      is_active,
      order_index
    ) 
    SELECT 
      NEW.value,
      'Rota generada automáticamente desde equipo: ' || NEW.value,
      NEW.org_id,
      true,
      COALESCE((SELECT MAX(order_index) + 1 FROM public.teams WHERE org_id = NEW.org_id), 1)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.teams 
      WHERE name = NEW.value AND org_id = NEW.org_id
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Actualizar el nombre de la rota correspondiente cuando se actualiza el equipo
    UPDATE public.teams 
    SET 
      name = NEW.value,
      description = 'Rota generada automáticamente desde equipo: ' || NEW.value
    WHERE name = OLD.value AND org_id = NEW.org_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Desactivar la rota correspondiente cuando se elimina el equipo
    UPDATE public.teams 
    SET is_active = false
    WHERE name = OLD.value AND org_id = OLD.org_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS sync_job_department_to_teams_trigger ON public.job_departments;
CREATE TRIGGER sync_job_department_to_teams_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.job_departments
  FOR EACH ROW
  EXECUTE FUNCTION sync_job_department_to_teams();

-- Crear rotas para equipos que no las tienen
INSERT INTO public.teams (name, description, org_id, is_active, order_index)
SELECT 
  jd.value,
  'Rota generada automáticamente desde equipo: ' || jd.value,
  jd.org_id,
  true,
  ROW_NUMBER() OVER (PARTITION BY jd.org_id ORDER BY jd.created_at) + 
    COALESCE((SELECT MAX(order_index) FROM public.teams WHERE org_id = jd.org_id), 0)
FROM public.job_departments jd
WHERE jd.org_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.teams t 
    WHERE t.name = jd.value AND t.org_id = jd.org_id AND t.is_active = true
  );