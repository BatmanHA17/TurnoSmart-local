-- Insertar permisos específicos para cada rol según la jerarquía organizacional

-- Primero limpiar datos existentes específicos
DELETE FROM public.role_permissions WHERE role IN ('propietario', 'director', 'manager');

-- PROPIETARIO: Acceso completo a todo
INSERT INTO public.role_permissions (role, permission_name, is_enabled, is_configurable) VALUES 
-- Planificación
('propietario', 'acceso_planificacion_no_publicada', true, true),
('propietario', 'acceso_planificacion_publicada_equipos', true, true),
('propietario', 'acceso_planificacion_otros_equipos', true, true),
('propietario', 'visualizacion_alertas', true, true),
('propietario', 'creacion_modificacion_planificacion', true, true),
('propietario', 'editar_planificaciones_publicadas', true, true),
('propietario', 'visualizacion_ratios', true, true),

-- Gestión de Horas
('propietario', 'guardar_propias_horas', true, true),
('propietario', 'ingresar_horas_equipo', true, true),
('propietario', 'validar_propias_horas', true, true),
('propietario', 'ingresar_horas_todos_equipos', true, true),
('propietario', 'revalorizar_ausencias', true, true),
('propietario', 'anular_validacion_horas', true, true),

-- Perfil de Usuario
('propietario', 'acceso_propio_perfil', true, true),
('propietario', 'modificar_informacion_personal', true, true),
('propietario', 'consultar_propias_hojas', true, true),
('propietario', 'acceso_perfil_empleados_equipo', true, true),
('propietario', 'acceso_perfil_todos_empleados', true, true),
('propietario', 'acceso_perfiles_managers', true, true),
('propietario', 'eliminar_perfil_empleado', true, true),

-- Gestión de Ausencias
('propietario', 'modificar_contadores_vacaciones', true, true);

-- DIRECTOR: Acceso amplio con algunas restricciones
INSERT INTO public.role_permissions (role, permission_name, is_enabled, is_configurable) VALUES 
-- Planificación
('director', 'acceso_planificacion_no_publicada', true, true),
('director', 'acceso_planificacion_publicada_equipos', true, true),
('director', 'acceso_planificacion_otros_equipos', true, true),
('director', 'visualizacion_alertas', true, true),
('director', 'creacion_modificacion_planificacion', true, true),
('director', 'editar_planificaciones_publicadas', true, true),
('director', 'visualizacion_ratios', true, true),

-- Gestión de Horas
('director', 'guardar_propias_horas', true, true),
('director', 'ingresar_horas_equipo', true, true),
('director', 'validar_propias_horas', true, true),
('director', 'ingresar_horas_todos_equipos', true, true),
('director', 'revalorizar_ausencias', true, true),
('director', 'anular_validacion_horas', false, true),

-- Perfil de Usuario
('director', 'acceso_propio_perfil', true, true),
('director', 'modificar_informacion_personal', true, true),
('director', 'consultar_propias_hojas', true, true),
('director', 'acceso_perfil_empleados_equipo', true, true),
('director', 'acceso_perfil_todos_empleados', false, true),
('director', 'acceso_perfiles_managers', true, true),
('director', 'eliminar_perfil_empleado', true, true),

-- Gestión de Ausencias
('director', 'modificar_contadores_vacaciones', true, true);

-- MANAGER: Acceso medio, principalmente a su departamento
INSERT INTO public.role_permissions (role, permission_name, is_enabled, is_configurable) VALUES 
-- Planificación
('manager', 'acceso_planificacion_no_publicada', true, true),
('manager', 'acceso_planificacion_publicada_equipos', true, true),
('manager', 'acceso_planificacion_otros_equipos', false, true),
('manager', 'visualizacion_alertas', true, true),
('manager', 'creacion_modificacion_planificacion', true, true),
('manager', 'editar_planificaciones_publicadas', true, true),
('manager', 'visualizacion_ratios', false, true),

-- Gestión de Horas
('manager', 'guardar_propias_horas', true, true),
('manager', 'ingresar_horas_equipo', true, true),
('manager', 'validar_propias_horas', true, true),
('manager', 'ingresar_horas_todos_equipos', false, true),
('manager', 'revalorizar_ausencias', true, true),
('manager', 'anular_validacion_horas', false, true),

-- Perfil de Usuario
('manager', 'acceso_propio_perfil', true, true),
('manager', 'modificar_informacion_personal', true, true),
('manager', 'consultar_propias_hojas', true, true),
('manager', 'acceso_perfil_empleados_equipo', true, true),
('manager', 'acceso_perfil_todos_empleados', false, true),
('manager', 'acceso_perfiles_managers', false, true),
('manager', 'eliminar_perfil_empleado', false, true),

-- Gestión de Ausencias
('manager', 'modificar_contadores_vacaciones', false, true);