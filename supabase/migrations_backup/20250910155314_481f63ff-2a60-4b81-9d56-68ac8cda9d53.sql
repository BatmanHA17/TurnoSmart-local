-- Modificar el trigger para verificar si un usuario fue eliminado previamente
-- Primero creamos una tabla para trackear usuarios eliminados
CREATE TABLE IF NOT EXISTS public.deleted_users (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    deleted_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan ver usuarios eliminados
CREATE POLICY "Only admins can view deleted users" ON public.deleted_users
FOR SELECT USING (is_admin(auth.uid()));

-- Política para que solo admins puedan insertar usuarios eliminados
CREATE POLICY "Only admins can track deleted users" ON public.deleted_users
FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Modificar el trigger handle_new_user para verificar usuarios eliminados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar si este usuario fue eliminado previamente
  IF EXISTS (SELECT 1 FROM public.deleted_users WHERE email = NEW.email) THEN
    -- Si fue eliminado previamente, no crear el perfil y eliminar el usuario
    PERFORM auth.admin.delete_user(NEW.id);
    RAISE EXCEPTION 'User account was previously deleted and cannot be recreated';
  END IF;
  
  -- Insertar perfil si no fue eliminado previamente
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