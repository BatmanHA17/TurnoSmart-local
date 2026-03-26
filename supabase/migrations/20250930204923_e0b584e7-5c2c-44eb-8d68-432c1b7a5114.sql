-- Agregar campo para marcar establecimiento por defecto
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS is_default_establishment boolean DEFAULT false;

-- Crear índice para búsquedas rápidas del establecimiento por defecto
CREATE INDEX IF NOT EXISTS idx_organizations_default 
ON public.organizations(is_default_establishment) 
WHERE is_default_establishment = true;

-- Función para asegurar que solo un establecimiento sea por defecto a la vez
CREATE OR REPLACE FUNCTION public.ensure_single_default_establishment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default_establishment = true THEN
    -- Desactivar todos los otros establecimientos como por defecto
    UPDATE public.organizations 
    SET is_default_establishment = false 
    WHERE is_default_establishment = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función antes de actualizar o insertar
DROP TRIGGER IF EXISTS trigger_ensure_single_default_establishment ON public.organizations;
CREATE TRIGGER trigger_ensure_single_default_establishment
  BEFORE INSERT OR UPDATE OF is_default_establishment ON public.organizations
  FOR EACH ROW
  WHEN (NEW.is_default_establishment = true)
  EXECUTE FUNCTION public.ensure_single_default_establishment();

-- Comentario explicativo
COMMENT ON COLUMN public.organizations.is_default_establishment IS 
'Indica si este establecimiento es el por defecto para nuevos colaboradores. Solo un establecimiento puede ser por defecto a la vez.';