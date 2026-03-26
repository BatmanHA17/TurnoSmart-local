-- Fix RLS policies for user registration flow

-- 1. Allow new users to create their own initial role during registration
CREATE POLICY "Allow users to create their own initial role during registration" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. Ensure establishments can reference auth.users temporarily during registration
-- (This is already handled by existing policies)

-- 3. Update the handle_new_user trigger to properly set both role and role_canonical
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  existing_profile_id uuid;
  user_count integer;
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
      INSERT INTO public.user_roles (user_id, role, role_canonical)
      VALUES (NEW.id, 'user', 'EMPLOYEE')
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
  
  -- Contar usuarios activos (no eliminados) 
  SELECT COUNT(*) INTO user_count 
  FROM public.profiles 
  WHERE deleted_at IS NULL;
  
  -- Si es el primer usuario, hacerlo super_admin/OWNER, sino user/EMPLOYEE normal
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role, role_canonical)
    VALUES (NEW.id, 'super_admin', 'OWNER');
  ELSE
    INSERT INTO public.user_roles (user_id, role, role_canonical)
    VALUES (NEW.id, 'user', 'EMPLOYEE');
  END IF;
  
  RETURN NEW;
END;
$$;