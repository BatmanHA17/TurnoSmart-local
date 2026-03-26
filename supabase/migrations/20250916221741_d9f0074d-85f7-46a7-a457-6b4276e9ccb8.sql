-- Insertar permisos específicos para cada rol según la jerarquía organizacional

-- Primero limpiar datos existentes específicos
DELETE FROM public.role_permissions WHERE role IN ('propietario', 'director', 'manager');

-- PROPIETARIO: Acceso completo a todo
INSERT INTO public.role_permissions (role, permission_name, is_enabled, is_configurable) VALUES 
-- Planificación
('propietario', 'acceso_planificacion_avanzada_departamentos', true, true),
('propietario', 'acceso_planificacion_solicitudes_firmadas', true, true),
('propietario', 'acceso_planificacion_solicitudes_departamentos_externos', true, true),
('propietario', 'visualizacion_alertas_completas', true, true),
('propietario', 'calendario_modificacion_planificacion', true, true),
('propietario', 'envio_notificaciones_automaticas_cambios_horarios_situacion', true, true),
('propietario', 'visualizacion_datos_archivo', true, true),

-- Gestión de Horas
('propietario', 'acceder_propias_horas_trabajo', true, true),
('propietario', 'registrar_horas_departamentales', true, true),
('propietario', 'envio_informes_horas_libres', true, true),
('propietario', 'registrar_horas_todas_departamentales', true, true),
('propietario', 'envio_notificacion_horas_libres', true, true),
('propietario', 'envio_mensajeria_automatica', true, true),

-- Perfil de Usuario
('propietario', 'envio_acceder_propios_datos_usuario', true, true),
('propietario', 'envio_modificar_informacion_personal_dentro_limites', true, true),
('propietario', 'envio_consultar_propios_datos_asistencia', true, true),
('propietario', 'acceder_perfil_informacion_empleados_equipos_direccion', true, true),
('propietario', 'acceder_perfil_todos_empleados_todas_ubicaciones', true, true),
('propietario', 'envio_informacion_generada_equipos_ubicaciones_organizacion', true, true),

-- Gestión de Ausencias
('propietario', 'envio_modificar_documentos_completos_datos_ocupaciones_paginas', true, true);

-- DIRECTOR: Acceso amplio con algunas restricciones
INSERT INTO public.role_permissions (role, permission_name, is_enabled, is_configurable) VALUES 
-- Planificación
('director', 'acceso_planificacion_avanzada_departamentos', true, true),
('director', 'acceso_planificacion_solicitudes_firmadas', true, true),
('director', 'acceso_planificacion_solicitudes_departamentos_externos', true, true),
('director', 'visualizacion_alertas_completas', true, true),
('director', 'calendario_modificacion_planificacion', true, true),
('director', 'envio_notificaciones_automaticas_cambios_horarios_situacion', true, true),
('director', 'visualizacion_datos_archivo', true, true),

-- Gestión de Horas
('director', 'acceder_propias_horas_trabajo', true, true),
('director', 'registrar_horas_departamentales', true, true),
('director', 'envio_informes_horas_libres', true, true),
('director', 'registrar_horas_todas_departamentales', true, true),
('director', 'envio_notificacion_horas_libres', true, true),
('director', 'envio_mensajeria_automatica', true, true),

-- Perfil de Usuario
('director', 'envio_acceder_propios_datos_usuario', true, true),
('director', 'envio_modificar_informacion_personal_dentro_limites', true, true),
('director', 'envio_consultar_propios_datos_asistencia', true, true),
('director', 'acceder_perfil_informacion_empleados_equipos_direccion', true, true),
('director', 'acceder_perfil_todos_empleados_todas_ubicaciones', false, true),
('director', 'envio_informacion_generada_equipos_ubicaciones_organizacion', true, true),

-- Gestión de Ausencias
('director', 'envio_modificar_documentos_completos_datos_ocupaciones_paginas', true, true);

-- MANAGER: Acceso medio, principalmente a su departamento
INSERT INTO public.role_permissions (role, permission_name, is_enabled, is_configurable) VALUES 
-- Planificación
('manager', 'acceso_planificacion_avanzada_departamentos', true, true),
('manager', 'acceso_planificacion_solicitudes_firmadas', true, true),
('manager', 'acceso_planificacion_solicitudes_departamentos_externos', false, true),
('manager', 'visualizacion_alertas_completas', true, true),
('manager', 'calendario_modificacion_planificacion', true, true),
('manager', 'envio_notificaciones_automaticas_cambios_horarios_situacion', true, true),
('manager', 'visualizacion_datos_archivo', false, true),

-- Gestión de Horas
('manager', 'acceder_propias_horas_trabajo', true, true),
('manager', 'registrar_horas_departamentales', true, true),
('manager', 'envio_informes_horas_libres', true, true),
('manager', 'registrar_horas_todas_departamentales', false, true),
('manager', 'envio_notificacion_horas_libres', true, true),
('manager', 'envio_mensajeria_automatica', true, true),

-- Perfil de Usuario
('manager', 'envio_acceder_propios_datos_usuario', true, true),
('manager', 'envio_modificar_informacion_personal_dentro_limites', true, true),
('manager', 'envio_consultar_propios_datos_asistencia', true, true),
('manager', 'acceder_perfil_informacion_empleados_equipos_direccion', true, true),
('manager', 'acceder_perfil_todos_empleados_todas_ubicaciones', false, true),
('manager', 'envio_informacion_generada_equipos_ubicaciones_organizacion', false, true),

-- Gestión de Ausencias
('manager', 'envio_modificar_documentos_completos_datos_ocupaciones_paginas', false, true);