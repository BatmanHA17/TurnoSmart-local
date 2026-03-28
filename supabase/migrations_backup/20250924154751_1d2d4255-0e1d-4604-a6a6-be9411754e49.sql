-- Corregir función para manejar conflictos de nombres en sincronización
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
    -- Solo actualizar si no existe conflicto de nombre o si es el mismo registro
    IF NOT EXISTS (
      SELECT 1 FROM public.teams 
      WHERE name = NEW.value AND org_id = NEW.org_id AND name != OLD.value
    ) THEN
      UPDATE public.teams 
      SET 
        name = NEW.value,
        description = 'Rota generada automáticamente desde equipo: ' || NEW.value
      WHERE name = OLD.value AND org_id = NEW.org_id;
    END IF;
    
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