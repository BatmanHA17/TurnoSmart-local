-- Corregir la función soft_delete_user para manejar mejor los errores
CREATE OR REPLACE FUNCTION public.soft_delete_user(_user_id uuid, _deleted_by uuid, _reason text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_exists boolean;
BEGIN
  -- Verificar si el usuario existe y no está ya eliminado
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id AND deleted_at IS NULL
  ) INTO user_exists;
  
  -- Si el usuario no existe o ya está eliminado, retornar false
  IF NOT user_exists THEN
    RETURN false;
  END IF;
  
  -- Marcar el perfil como eliminado
  UPDATE public.profiles 
  SET 
    deleted_at = now(),
    deleted_by = _deleted_by,
    deletion_reason = _reason,
    notified_at = NULL
  WHERE id = _user_id AND deleted_at IS NULL;
  
  -- Retornar true si se actualizó alguna fila
  RETURN FOUND;
END;
$function$;