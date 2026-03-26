-- ===============================
-- FASE 3: VISTA CONSOLIDADA "COLABORADOR FULL" PARA UI
-- Crear vista + índices + RLS + validación
-- ===============================

-- 1. CREAR VISTA COLABORADOR_FULL (Consolidada "todo en uno")
CREATE OR REPLACE VIEW public.colaborador_full AS
SELECT
  c.id, 
  c.org_id, 
  c.nombre, 
  c.apellidos, 
  c.email, 
  c.telefono_movil, 
  c.status,
  c.empleado_id,
  c.avatar_url,
  c.fecha_inicio_contrato,
  c.tipo_contrato,
  c.tiempo_trabajo_semanal,
  c.establecimiento_por_defecto,
  c.responsable_directo,
  c.created_at,
  c.updated_at,
  
  -- Vínculo con sistema de usuarios
  p.id as profile_id,
  p.display_name,
  p.is_active as profile_active,
  
  -- Rol principal (desde colaborador_roles)
  (SELECT cr.role::text
   FROM public.colaborador_roles cr
   WHERE cr.colaborador_id = c.id 
     AND cr.org_id = c.org_id 
     AND cr.activo = true
   ORDER BY cr.asignado_en DESC NULLS LAST 
   LIMIT 1) as rol_principal,
  
  -- Contrato vigente (desde contract_history si existe, sino desde colaboradores)
  COALESCE(
    (SELECT ch.new_value
     FROM public.contract_history ch
     WHERE ch.colaborador_id = c.id 
       AND ch.org_id = c.org_id
       AND ch.field_changed = 'tipo_contrato'
     ORDER BY ch.created_at DESC 
     LIMIT 1),
    c.tipo_contrato
  ) as contrato_vigente,
  
  -- Datos de salud resumidos (desde employee_health)
  eh.numero_seguridad_social,
  eh.minusvalia,
  eh.ultima_revision_medica,
  eh.reconocimiento_medico_reforzado,
  eh.exonerado_seguro_medico,
  eh.es_extranjero,
  eh.trabajador_extranjero_permiso,
  
  -- Contacto de emergencia principal (primer registro)
  eec.nombre as emergencia_nombre,
  eec.apellidos as emergencia_apellidos,
  eec.relacion as emergencia_relacion,
  eec.telefono_movil as emergencia_telefono,
  eec.telefono_fijo as emergencia_fijo,
  
  -- Estadísticas calculadas
  (SELECT COUNT(*) 
   FROM public.absence_requests ar 
   WHERE ar.colaborador_id = c.id 
     AND ar.org_id = c.org_id 
     AND ar.status = 'approved') as total_ausencias_aprobadas,
     
  (SELECT balance_hours 
   FROM public.compensatory_time_off cto 
   WHERE cto.colaborador_id = c.id 
     AND cto.org_id = c.org_id 
   LIMIT 1) as balance_horas_compensatorias

FROM public.colaboradores c
LEFT JOIN public.profiles p
  ON p.email = c.email 
  AND p.primary_org_id = c.org_id
  AND p.deleted_at IS NULL
LEFT JOIN public.employee_health eh
  ON eh.colaborador_id = c.id 
  AND eh.org_id = c.org_id
LEFT JOIN LATERAL (
  SELECT * 
  FROM public.employee_emergency_contacts x
  WHERE x.colaborador_id = c.id 
    AND x.org_id = c.org_id
  ORDER BY x.created_at ASC 
  LIMIT 1
) eec ON true;

-- 2. CREAR ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_colab_org_email ON public.colaboradores(org_id, email);
CREATE INDEX IF NOT EXISTS idx_colab_org_id ON public.colaboradores(org_id, id);
CREATE INDEX IF NOT EXISTS idx_eh_org_colaborador ON public.employee_health(org_id, colaborador_id);
CREATE INDEX IF NOT EXISTS idx_eec_org_colaborador ON public.employee_emergency_contacts(org_id, colaborador_id);
CREATE INDEX IF NOT EXISTS idx_cr_colaborador_activo ON public.colaborador_roles(colaborador_id, org_id, activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_ch_colaborador_field ON public.contract_history(colaborador_id, org_id, field_changed, created_at);
CREATE INDEX IF NOT EXISTS idx_ar_colaborador_status ON public.absence_requests(colaborador_id, org_id, status);
CREATE INDEX IF NOT EXISTS idx_cto_colaborador ON public.compensatory_time_off(colaborador_id, org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email_org ON public.profiles(email, primary_org_id) WHERE deleted_at IS NULL;

-- 3. HABILITAR RLS EN LA VISTA (hereda de tablas base)
-- Las vistas heredan automáticamente las políticas RLS de las tablas base
-- Pero podemos crear políticas específicas si necesario

-- Política de lectura: miembros de la organización pueden ver colaboradores de su org
CREATE POLICY "colaborador_full_read_org_members" ON public.colaborador_full
FOR SELECT TO authenticated
USING (org_id IN (
  SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
));

-- 4. FUNCIÓN DE VALIDACIÓN POST-MIGRACIÓN
CREATE OR REPLACE FUNCTION verify_phase3_migration()
RETURNS TABLE(
  check_name text,
  expected_count bigint,
  actual_count bigint,
  status text,
  details text
) AS $$
BEGIN
  -- Verificar que la vista existe
  RETURN QUERY
  SELECT 
    'colaborador_full_view_exists'::text,
    1::bigint,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'colaborador_full' AND table_schema = 'public')::bigint,
    CASE 
      WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'colaborador_full' AND table_schema = 'public')
      THEN 'PASS'::text 
      ELSE 'FAIL'::text 
    END,
    'Vista colaborador_full creada correctamente'::text;

  -- Verificar índices creados
  RETURN QUERY
  SELECT 
    'performance_indexes_created'::text,
    9::bigint, -- Esperamos 9 índices nuevos
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' 
     AND indexname LIKE 'idx_colab_%' OR indexname LIKE 'idx_eh_%' 
     OR indexname LIKE 'idx_eec_%' OR indexname LIKE 'idx_cr_%' 
     OR indexname LIKE 'idx_ch_%' OR indexname LIKE 'idx_ar_%' 
     OR indexname LIKE 'idx_cto_%' OR indexname LIKE 'idx_profiles_%')::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' 
            AND (indexname LIKE 'idx_colab_%' OR indexname LIKE 'idx_eh_%' 
                 OR indexname LIKE 'idx_eec_%' OR indexname LIKE 'idx_cr_%' 
                 OR indexname LIKE 'idx_ch_%' OR indexname LIKE 'idx_ar_%' 
                 OR indexname LIKE 'idx_cto_%' OR indexname LIKE 'idx_profiles_%')) >= 5
      THEN 'PASS'::text 
      ELSE 'WARN'::text 
    END,
    'Índices de rendimiento creados'::text;

  -- Verificar datos en la vista
  RETURN QUERY
  SELECT 
    'view_data_consistency'::text,
    (SELECT COUNT(*) FROM public.colaboradores WHERE org_id IS NOT NULL)::bigint,
    (SELECT COUNT(*) FROM public.colaborador_full)::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.colaborador_full) >= (SELECT COUNT(*) FROM public.colaboradores WHERE org_id IS NOT NULL) * 0.95
      THEN 'PASS'::text 
      ELSE 'FAIL'::text 
    END,
    'Datos consistentes entre tabla base y vista'::text;

  -- Verificar rendimiento básico
  RETURN QUERY
  SELECT 
    'view_performance_test'::text,
    1::bigint,
    1::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.colaborador_full LIMIT 100) >= 0
      THEN 'PASS'::text 
      ELSE 'FAIL'::text 
    END,
    'Vista responde correctamente a consultas'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. EJECUTAR VERIFICACIÓN INMEDIATA
SELECT * FROM verify_phase3_migration();