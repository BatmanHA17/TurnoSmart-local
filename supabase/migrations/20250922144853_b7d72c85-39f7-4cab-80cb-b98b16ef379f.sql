-- FASE 5C: Limpieza final - Estrategia por etapas para evitar dependencias

-- ===== PASO 1: ELIMINAR DEPENDENCIAS EXISTENTES =====
DROP VIEW IF EXISTS public.colaborador_full CASCADE;
DROP FUNCTION IF EXISTS public.get_colaborador_full_by_org(uuid) CASCADE;

-- ===== PASO 2: ELIMINAR CAMPOS DUPLICADOS DE COLABORADORES =====
-- Campos de salud ya están en employee_health
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS numero_seguridad_social;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS minusvalia;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS ultima_revision_medica;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS reconocimiento_medico_reforzado;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS exonerado_seguro_medico;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS es_extranjero;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS trabajador_extranjero_permiso;

-- Campos de contacto emergencia ya están en employee_emergency_contacts
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS contacto_emergencia_nombre;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS contacto_emergencia_apellidos;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS contacto_emergencia_relacion;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS contacto_emergencia_movil;
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS contacto_emergencia_fijo;

-- Campo establecimiento_por_defecto - ahora se puede eliminar sin dependencias
ALTER TABLE public.colaboradores DROP COLUMN IF EXISTS establecimiento_por_defecto;

-- ===== PASO 3: RECREAR VISTA COLABORADOR_FULL LIMPIA =====
CREATE VIEW public.colaborador_full AS
SELECT 
  -- Datos básicos de colaboradores (tabla base)
  c.id,
  c.org_id,
  c.nombre,
  c.apellidos,
  c.apellidos_uso,
  c.empleado_id,
  c.email,
  c.telefono_movil,
  c.telefono_fijo,
  c.pais_movil,
  c.pais_fijo,
  c.avatar_url,
  c.status,
  c.responsable_directo,
  c.tipo_contrato,
  c.fecha_inicio_contrato,
  c.fecha_fin_contrato,
  c.hora_inicio_contrato,
  c.tiempo_trabajo_semanal,
  c.created_at,
  c.updated_at,
  
  -- Datos personales adicionales
  c.fecha_nacimiento,
  c.pais_nacimiento,
  c.ciudad_nacimiento,
  c.nacionalidad,
  c.genero,
  c.apellidos_nacimiento,
  c.estado_civil,
  c.numero_personas_dependientes,
  c.fecha_antiguedad,
  c.direccion,
  c.ciudad,
  c.codigo_postal,
  c.provincia,
  c.pais_residencia,
  
  -- Datos de salud (de employee_health) - ÚNICOS
  eh.numero_seguridad_social,
  eh.minusvalia,
  eh.ultima_revision_medica,
  eh.reconocimiento_medico_reforzado,
  eh.exonerado_seguro_medico,
  eh.es_extranjero,
  eh.trabajador_extranjero_permiso,
  
  -- Contacto de emergencia (de employee_emergency_contacts) - ÚNICOS
  eec.nombre as emergencia_nombre,
  eec.apellidos as emergencia_apellidos,
  eec.relacion as emergencia_relacion,
  eec.telefono_movil as emergencia_telefono,
  eec.telefono_fijo as emergencia_fijo,
  
  -- Datos del sistema (de profiles)
  p.id as profile_id,
  p.is_active as profile_active,
  p.display_name,
  
  -- Rol principal (de colaborador_roles)
  get_colaborador_main_role(c.id) as rol_principal,
  
  -- Contrato vigente
  c.tipo_contrato as contrato_vigente,
  
  -- Balance de horas compensatorias
  COALESCE(cto.balance_hours, 0) as balance_horas_compensatorias,
  
  -- Total de ausencias aprobadas
  (SELECT COUNT(*) 
   FROM absence_requests ar 
   WHERE ar.colaborador_id = c.id 
     AND ar.status = 'approved') as total_ausencias_aprobadas

FROM public.colaboradores c
LEFT JOIN public.employee_health eh ON c.id = eh.colaborador_id
LEFT JOIN public.employee_emergency_contacts eec ON c.id = eec.colaborador_id
LEFT JOIN public.profiles p ON p.email = c.email AND p.deleted_at IS NULL
LEFT JOIN public.compensatory_time_off cto ON c.id = cto.colaborador_id;

-- ===== PASO 4: RECREAR FUNCIÓN AUXILIAR =====
CREATE OR REPLACE FUNCTION public.get_colaborador_full_by_org(org_uuid uuid)
RETURNS SETOF colaborador_full
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM colaborador_full WHERE org_id = org_uuid;
$$;

-- ===== PASO 5: COMENTARIOS Y VERIFICACIÓN =====
COMMENT ON VIEW public.colaborador_full IS 'Vista consolidada sin campos duplicados. Fase 5C completada - normalización de datos de salud y contactos de emergencia finalizada.';

COMMENT ON FUNCTION public.get_colaborador_full_by_org(uuid) IS 'Función auxiliar para obtener colaboradores completos por organización desde vista normalizada.';

-- Verificación final
DO $$
DECLARE
  view_count INTEGER;
  base_count INTEGER;
  health_count INTEGER;
  emergency_count INTEGER;
BEGIN
  -- Contar registros
  SELECT COUNT(*) INTO view_count FROM public.colaborador_full;
  SELECT COUNT(*) INTO base_count FROM public.colaboradores WHERE org_id IS NOT NULL;
  SELECT COUNT(*) INTO health_count FROM public.employee_health;
  SELECT COUNT(*) INTO emergency_count FROM public.employee_emergency_contacts;
  
  -- Reporte de migración
  RAISE NOTICE '=== MIGRACIÓN FASE 5C COMPLETADA ===';
  RAISE NOTICE 'Colaboradores en vista: %', view_count;
  RAISE NOTICE 'Colaboradores base: %', base_count;
  RAISE NOTICE 'Registros de salud: %', health_count;
  RAISE NOTICE 'Contactos de emergencia: %', emergency_count;
  
  IF view_count = base_count THEN
    RAISE NOTICE '✅ Migración exitosa - integridad de datos verificada';
  ELSE
    RAISE WARNING '⚠️ Diferencia en conteos - revisar integridad';
  END IF;
END $$;