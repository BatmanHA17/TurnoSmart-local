-- Actualizar la función audit_trigger para incluir org_id
CREATE OR REPLACE FUNCTION public.audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  old_data jsonb;
  new_data jsonb;
  action_text text;
  user_name_val text;
  user_org_id uuid;
BEGIN
  -- Determinar el tipo de acción
  IF TG_OP = 'DELETE' THEN
    action_text := 'DELETE';
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    action_text := 'UPDATE';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    action_text := 'INSERT';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  END IF;

  -- Obtener nombre del usuario
  SELECT display_name, primary_org_id INTO user_name_val, user_org_id
  FROM profiles 
  WHERE id = auth.uid();
  
  IF user_name_val IS NULL THEN
    user_name_val := 'Sistema';
  END IF;

  -- Si no tenemos org_id del usuario, intentar obtenerlo de la tabla que se está modificando
  IF user_org_id IS NULL THEN
    -- Para organizaciones, usar el ID de la propia organización
    IF TG_TABLE_NAME = 'organizations' THEN
      user_org_id := CASE 
        WHEN TG_OP = 'DELETE' THEN (old_data->>'id')::uuid
        ELSE (new_data->>'id')::uuid
      END;
    -- Para otras tablas, intentar obtener org_id del registro
    ELSIF new_data ? 'org_id' THEN
      user_org_id := (new_data->>'org_id')::uuid;
    ELSIF old_data ? 'org_id' THEN
      user_org_id := (old_data->>'org_id')::uuid;
    END IF;
  END IF;

  -- Solo insertar si tenemos org_id
  IF user_org_id IS NOT NULL THEN
    INSERT INTO activity_log (
      user_id,
      user_name,
      action,
      entity_type,
      entity_id,
      entity_name,
      details,
      org_id
    ) VALUES (
      auth.uid(),
      user_name_val,
      action_text || '_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN (old_data->>'id')::uuid
        ELSE (new_data->>'id')::uuid
      END,
      CASE TG_TABLE_NAME
        WHEN 'organizations' THEN 
          CASE 
            WHEN TG_OP = 'DELETE' THEN old_data->>'name'
            ELSE new_data->>'name'
          END
        WHEN 'profiles' THEN 
          CASE 
            WHEN TG_OP = 'DELETE' THEN old_data->>'display_name'
            ELSE new_data->>'display_name'
          END
        ELSE 'N/A'
      END,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'old_data', old_data,
        'new_data', new_data,
        'timestamp', now()
      ),
      user_org_id
    );
  END IF;

  -- Retornar el registro apropiado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;