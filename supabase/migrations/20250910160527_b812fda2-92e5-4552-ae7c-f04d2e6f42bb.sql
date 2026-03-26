-- Implementar sistema de Soft Delete con Grace Period de 30 días

-- Eliminar la tabla deleted_users ya que usaremos soft delete
DROP TABLE IF EXISTS public.deleted_users CASCADE;

-- Agregar campos para soft delete a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notified_at timestamp with time zone DEFAULT NULL;

-- Crear índice para consultas de cleanup
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Modificar RLS policies para excluir usuarios soft-deleted de las consultas normales
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Recrear políticas excluyendo usuarios soft-deleted
CREATE POLICY "Users can view their own active profile" ON public.profiles
FOR SELECT USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Admins can view all active profiles" ON public.profiles
FOR SELECT USING (is_admin(auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Super admins can view all profiles including deleted" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Política especial para auto-reactivación: usuarios pueden ver su propio perfil aunque esté soft-deleted
CREATE POLICY "Users can view their own deleted profile for reactivation" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Función para soft delete de usuarios
CREATE OR REPLACE FUNCTION public.soft_delete_user(_user_id uuid, _deleted_by uuid, _reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Marcar el perfil como eliminado
  UPDATE public.profiles 
  SET 
    deleted_at = now(),
    deleted_by = _deleted_by,
    deletion_reason = _reason,
    notified_at = NULL
  WHERE id = _user_id AND deleted_at IS NULL;
  
  -- Retornar true si se actualizó algún registro
  RETURN FOUND;
END;
$function$;

-- Función para reactivar usuario (auto-reactivación)
CREATE OR REPLACE FUNCTION public.reactivate_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo permitir reactivación si está dentro del período de gracia (30 días)
  UPDATE public.profiles 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL,
    notified_at = NULL
  WHERE id = _user_id 
    AND deleted_at IS NOT NULL 
    AND deleted_at > now() - interval '30 days';
  
  RETURN FOUND;
END;
$function$;

-- Función para obtener usuarios que necesitan notificación (21 días)
CREATE OR REPLACE FUNCTION public.get_users_for_deletion_notification()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  deleted_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.display_name,
    p.deleted_at
  FROM public.profiles p
  WHERE p.deleted_at IS NOT NULL
    AND p.notified_at IS NULL
    AND p.deleted_at <= now() - interval '21 days'
    AND p.deleted_at > now() - interval '30 days';
END;
$function$;

-- Función para marcar usuario como notificado
CREATE OR REPLACE FUNCTION public.mark_user_notified(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET notified_at = now()
  WHERE id = _user_id;
END;
$function$;

-- Función para obtener usuarios para hard delete (30 días)
CREATE OR REPLACE FUNCTION public.get_users_for_hard_delete()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  deleted_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.display_name,
    p.deleted_at
  FROM public.profiles p
  WHERE p.deleted_at IS NOT NULL
    AND p.deleted_at <= now() - interval '30 days';
END;
$function$;

-- Modificar el trigger handle_new_user para permitir reactivación automática
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_profile_id uuid;
BEGIN
  -- Verificar si existe un perfil soft-deleted para este email
  SELECT id INTO existing_profile_id
  FROM public.profiles 
  WHERE email = NEW.email AND deleted_at IS NOT NULL;
  
  -- Si existe un perfil soft-deleted, reactivarlo
  IF existing_profile_id IS NOT NULL THEN
    -- Verificar si está dentro del período de gracia
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = existing_profile_id 
        AND deleted_at > now() - interval '30 days'
    ) THEN
      -- Reactivar el perfil existente
      UPDATE public.profiles 
      SET 
        deleted_at = NULL,
        deleted_by = NULL,
        deletion_reason = NULL,
        notified_at = NULL,
        display_name = COALESCE(NEW.raw_user_meta_data ->> 'display_name', display_name),
        first_name = COALESCE(NEW.raw_user_meta_data ->> 'first_name', first_name),
        last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', last_name)
      WHERE id = existing_profile_id;
      
      -- Actualizar el user_id en el perfil reactivado
      UPDATE public.profiles SET id = NEW.id WHERE id = existing_profile_id;
      
      -- Crear rol de usuario si no existe
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      RETURN NEW;
    ELSE
      -- Si pasaron 30 días, no permitir reactivación
      RAISE EXCEPTION 'Account deletion period has expired. Contact support for assistance.';
    END IF;
  END IF;
  
  -- Si no hay perfil soft-deleted, crear uno nuevo
  INSERT INTO public.profiles (id, email, display_name, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  -- Asignar rol de usuario por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;