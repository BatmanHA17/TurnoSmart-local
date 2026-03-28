-- Paso 2: Crear las tablas del sistema de permisos
-- Tabla de permisos disponibles en el sistema
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL, -- 'planificacion', 'gestion_horas', 'perfil_usuario', 'gestion_ausencias'
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Permisos por defecto para cada rol
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_name text NOT NULL REFERENCES public.permissions(name),
  is_enabled boolean DEFAULT true,
  is_configurable boolean DEFAULT false, -- Si puede ser modificado por switches
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_name)
);

-- Permisos específicos por usuario (sobrescriben los del rol)
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  colaborador_id uuid REFERENCES public.colaboradores(id),
  permission_name text NOT NULL REFERENCES public.permissions(name),
  is_enabled boolean NOT NULL,
  granted_by uuid REFERENCES public.profiles(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission_name)
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permissions (solo lectura para todos)
CREATE POLICY "Anyone can view permissions" ON public.permissions
FOR SELECT USING (true);

-- Políticas RLS para role_permissions (solo lectura para todos)
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions
FOR SELECT USING (true);

-- Políticas RLS para user_permissions
CREATE POLICY "Admins can manage user permissions" ON public.user_permissions
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view their own permissions" ON public.user_permissions
FOR SELECT USING (auth.uid() = user_id);

-- Insertar permisos del sistema
INSERT INTO public.permissions (name, category, description) VALUES
-- Planificación
('acceso_planificacion_publicada_equipos', 'planificacion', 'Acceso a la planificación publicada de sus equipos/ubicaciones'),
('acceso_planificacion_no_publicada', 'planificacion', 'Acceso a la planificación no publicada (borrador)'),
('acceso_planificacion_otros_equipos', 'planificacion', 'Acceso a la planificación publicada de otros equipos/ubicaciones'),
('visualizacion_alertas', 'planificacion', 'Visualización de alertas y contadores'),
('creacion_modificacion_planificacion', 'planificacion', 'Creación, modificación y publicación de planificación'),
('editar_planificaciones_publicadas', 'planificacion', 'Puede editar las planificaciones publicadas y validar los turnos de su ubicación'),
('visualizacion_ratios', 'planificacion', 'Visualización de ratios de análisis'),

-- Gestión de Horas
('guardar_propias_horas', 'gestion_horas', 'Guardar sus propias horas de trabajo'),
('ingresar_horas_equipo', 'gestion_horas', 'Ingresar las horas reales de su equipo/ubicación'),
('validar_propias_horas', 'gestion_horas', 'Puede validar sus propias horas reales'),
('ingresar_horas_todos_equipos', 'gestion_horas', 'Ingresar las horas reales de todos los equipos/ubicaciones'),
('anular_validacion_horas', 'gestion_horas', 'Puede anular la validación de horas reales'),
('revalorizar_ausencias', 'gestion_horas', 'Puede revalorizar ausencias'),

-- Perfil de Usuario
('acceso_propio_perfil', 'perfil_usuario', 'Puede acceder a su propio perfil de usuario'),
('modificar_informacion_personal', 'perfil_usuario', 'Puede modificar su información personal y detalles de contacto'),
('consultar_propias_hojas', 'perfil_usuario', 'Puede consultar sus propias hojas de asistencia'),
('acceso_perfil_empleados_equipo', 'perfil_usuario', 'Acceso al perfil de empleados de mi equipo o ubicación'),
('acceso_perfiles_managers', 'perfil_usuario', 'Acceso a los perfiles de los managers de mi equipo o establecimiento'),
('acceso_perfil_todos_empleados', 'perfil_usuario', 'Acceso al perfil de todos los empleados de todas las ubicaciones'),
('eliminar_perfil_empleado', 'perfil_usuario', 'Puede eliminar el perfil de un empleado o manager'),

-- Gestión de Ausencias
('modificar_contadores_vacaciones', 'gestion_ausencias', 'Puede modificar manualmente los contadores de días de vacaciones pagados');

-- Asignar todos los permisos al rol Administrador (todos habilitados)
INSERT INTO public.role_permissions (role, permission_name, is_enabled, is_configurable)
SELECT 'administrador'::app_role, name, true, true
FROM public.permissions;

-- Asignar permisos básicos al rol empleado
INSERT INTO public.role_permissions (role, permission_name, is_enabled, is_configurable) VALUES
('empleado', 'acceso_propio_perfil', true, false),
('empleado', 'modificar_informacion_personal', true, false),
('empleado', 'consultar_propias_hojas', true, false),
('empleado', 'guardar_propias_horas', true, false),
('empleado', 'validar_propias_horas', true, false);

-- Función para obtener permisos de un usuario
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid, _colaborador_id uuid DEFAULT NULL)
RETURNS TABLE(
  permission_name text,
  is_enabled boolean,
  category text,
  description text,
  is_configurable boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      WHEN 'propietario' THEN 2
      WHEN 'administrador' THEN 3
      WHEN 'director' THEN 4
      WHEN 'manager' THEN 5
      WHEN 'empleado' THEN 6
      WHEN 'admin' THEN 7
      WHEN 'user' THEN 8
    END
  LIMIT 1;

  -- Si no tiene rol específico, usar 'empleado' por defecto
  IF user_role IS NULL THEN
    user_role := 'empleado';
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
    AND (_colaborador_id IS NULL OR up.colaborador_id = _colaborador_id)
  WHERE rp.permission_name IS NOT NULL
  ORDER BY p.category, p.name;
END;
$$;