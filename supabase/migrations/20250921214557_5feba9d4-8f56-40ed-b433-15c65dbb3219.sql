-- Actualizar el trigger handle_new_user para funcionar con el sistema multi-org

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_profile_id uuid;
  user_count integer;
  org_uuid uuid;
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
        last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', last_name),
        primary_org_id = COALESCE((NEW.raw_user_meta_data ->> 'org_id')::uuid, primary_org_id)
      WHERE id = existing_profile_id;
      
      -- Actualizar el user_id en el perfil reactivado
      UPDATE public.profiles SET id = NEW.id WHERE id = existing_profile_id;
      
      -- Crear rol de usuario si no existe
      INSERT INTO public.user_roles (user_id, role, role_canonical)
      VALUES (NEW.id, 'user', 'EMPLOYEE')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      RETURN NEW;
    ELSE
      -- Si pasaron 30 días, no permitir reactivación
      RAISE EXCEPTION 'Account deletion period has expired. Contact support for assistance.';
    END IF;
  END IF;
  
  -- Obtener org_id de los metadatos si existe
  org_uuid := (NEW.raw_user_meta_data ->> 'org_id')::uuid;
  
  -- Si no hay perfil soft-deleted, crear uno nuevo
  INSERT INTO public.profiles (id, email, display_name, first_name, last_name, primary_org_id)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    org_uuid
  );
  
  -- Contar usuarios activos (no eliminados) para determinar si es el primer usuario
  SELECT COUNT(*) INTO user_count 
  FROM public.profiles 
  WHERE deleted_at IS NULL;
  
  -- Si es el primer usuario o si viene con org_id (es un owner), hacerlo owner
  -- Si no, hacerlo empleado normal
  IF user_count = 1 OR org_uuid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, role_canonical)
    VALUES (NEW.id, 'super_admin', 'OWNER')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role, role_canonical)
    VALUES (NEW.id, 'user', 'EMPLOYEE')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;