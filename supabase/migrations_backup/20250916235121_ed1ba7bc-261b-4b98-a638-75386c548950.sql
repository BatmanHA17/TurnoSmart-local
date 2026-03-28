-- Fix the get_user_permissions function to respect role-based permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid, _colaborador_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(permission_name text, is_enabled boolean, category text, description text, is_configurable boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  colaborador_role text;
BEGIN
  -- Si se proporciona un colaborador_id, obtener su rol
  IF _colaborador_id IS NOT NULL THEN
    SELECT get_colaborador_main_role(_colaborador_id) INTO colaborador_role;
    
    -- Si no tiene rol específico, usar 'empleado' por defecto
    IF colaborador_role IS NULL THEN
      colaborador_role := 'empleado';
    END IF;

    -- Retornar permisos basados en el rol del colaborador con sobrescrituras específicas del usuario
    RETURN QUERY
    SELECT 
      p.name as permission_name,
      COALESCE(up.is_enabled, rp.is_enabled) as is_enabled,
      p.category,
      p.description,
      rp.is_configurable
    FROM public.permissions p
    LEFT JOIN public.role_permissions rp ON p.name = rp.permission_name AND rp.role = colaborador_role::app_role
    LEFT JOIN public.user_permissions up ON p.name = up.permission_name 
      AND up.user_id = _user_id 
      AND up.colaborador_id = _colaborador_id
    WHERE rp.permission_name IS NOT NULL
    ORDER BY p.category, p.name;
  ELSE
    -- Funcionalidad original para usuarios sin colaborador_id específico
    DECLARE
      user_role app_role;
    BEGIN
      -- Obtener el rol del usuario
      SELECT role INTO user_role
      FROM public.user_roles
      WHERE user_id = _user_id
      ORDER BY 
        CASE role
          WHEN 'super_admin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'user' THEN 3
        END
      LIMIT 1;

      -- Si no tiene rol específico, usar 'user' por defecto
      IF user_role IS NULL THEN
        user_role := 'user';
      END IF;

      -- Retornar permisos con sobrescrituras específicas del usuario
      RETURN QUERY
      SELECT 
        p.name as permission_name,
        COALESCE(up.is_enabled, rp.is_enabled) as is_enabled,
        p.category,
        p.description,
        rp.is_configurable
      FROM public.permissions p
      LEFT JOIN public.role_permissions rp ON p.name = rp.permission_name AND rp.role = user_role
      LEFT JOIN public.user_permissions up ON p.name = up.permission_name 
        AND up.user_id = _user_id 
        AND up.colaborador_id IS NULL
      WHERE rp.permission_name IS NOT NULL
      ORDER BY p.category, p.name;
    END;
  END IF;
END;
$function$;