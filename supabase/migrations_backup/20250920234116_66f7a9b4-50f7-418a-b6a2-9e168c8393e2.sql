-- Crear una función para manejar el registro con envío de email de confirmación
CREATE OR REPLACE FUNCTION public.handle_user_signup(
  user_email text,
  user_password text,
  confirmation_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  verification_code text;
  result jsonb;
BEGIN
  -- Generar código de verificación de 6 dígitos
  verification_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  
  -- Insertar código de verificación
  INSERT INTO public.verification_codes (email, code, expires_at)
  VALUES (user_email, verification_code, NOW() + INTERVAL '10 minutes')
  ON CONFLICT (email) DO UPDATE 
  SET 
    code = EXCLUDED.code,
    expires_at = EXCLUDED.expires_at,
    verified_at = NULL,
    created_at = NOW();
  
  -- Retornar resultado exitoso
  result := jsonb_build_object(
    'success', true,
    'message', 'Código de verificación enviado',
    'email', user_email
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Retornar error
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;