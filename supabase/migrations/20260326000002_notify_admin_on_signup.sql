-- Trigger: notificar al admin cuando se crea un nuevo usuario en auth.users
-- Usa pg_net para llamar a la edge function notify-admin-signup de forma asíncrona

CREATE OR REPLACE FUNCTION public.notify_admin_on_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url text;
BEGIN
  function_url := 'https://povgwdbnyqdcygedcijl.supabase.co/functions/v1/notify-admin-signup';

  -- Llamada asíncrona — no bloquea el signup aunque falle
  PERFORM net.http_post(
    url     := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body    := jsonb_build_object(
      'email',   NEW.email,
      'user_id', NEW.id::text,
      'action',  'signup',
      'metadata', jsonb_build_object(
        'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
        'created_at', NEW.created_at::text
      )
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Si falla la notificación no bloqueamos el registro del usuario
  RAISE WARNING '[notify_admin_on_new_user] Error calling edge function: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Eliminar trigger previo si existe
DROP TRIGGER IF EXISTS on_auth_user_created_notify_admin ON auth.users;

CREATE TRIGGER on_auth_user_created_notify_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_user();
