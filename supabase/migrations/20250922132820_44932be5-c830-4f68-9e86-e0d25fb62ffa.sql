-- ===============================
-- FASE 2: SEPARACIÓN DE DATOS SENSIBLES
-- Crear tablas nuevas + Backfill + RLS + Triggers
-- ===============================

-- 1. CREAR TABLA EMPLOYEE_HEALTH (Datos médicos sensibles)
CREATE TABLE IF NOT EXISTS public.employee_health (
  colaborador_id uuid PRIMARY KEY REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  numero_seguridad_social text,
  minusvalia boolean DEFAULT false,
  ultima_revision_medica date,
  reconocimiento_medico_reforzado boolean DEFAULT false,
  exonerado_seguro_medico boolean DEFAULT false,
  es_extranjero boolean DEFAULT false,
  trabajador_extranjero_permiso boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. CREAR TABLA EMPLOYEE_EMERGENCY_CONTACTS (Contactos de emergencia)
CREATE TABLE IF NOT EXISTS public.employee_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  nombre text,
  apellidos text,
  relacion text,
  telefono_movil text,
  telefono_fijo text,
  pais_movil text DEFAULT 'ES',
  pais_fijo text DEFAULT 'ES',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. CREAR ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_employee_health_org_id ON public.employee_health(org_id);
CREATE INDEX IF NOT EXISTS idx_employee_emergency_contacts_colaborador_id ON public.employee_emergency_contacts(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_employee_emergency_contacts_org_id ON public.employee_emergency_contacts(org_id);

-- 4. TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_employee_health_updated_at
  BEFORE UPDATE ON public.employee_health
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_emergency_contacts_updated_at
  BEFORE UPDATE ON public.employee_emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. HABILITAR RLS
ALTER TABLE public.employee_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA EMPLOYEE_HEALTH
-- Lectura: Miembros de la organización
CREATE POLICY "eh_read_org_members" ON public.employee_health
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  ));

-- Escritura: Solo OWNER/ADMIN
CREATE POLICY "eh_write_admins" ON public.employee_health
  FOR ALL TO authenticated
  USING (org_id IN (
    SELECT m.org_id FROM public.memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN')
  ))
  WITH CHECK (org_id IN (
    SELECT m.org_id FROM public.memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN')
  ));

-- 7. POLÍTICAS RLS PARA EMPLOYEE_EMERGENCY_CONTACTS
-- Lectura: Miembros de la organización
CREATE POLICY "eec_read_org_members" ON public.employee_emergency_contacts
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
  ));

-- Escritura: OWNER/ADMIN/MANAGER
CREATE POLICY "eec_write_managers" ON public.employee_emergency_contacts
  FOR ALL TO authenticated
  USING (org_id IN (
    SELECT m.org_id FROM public.memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER')
  ))
  WITH CHECK (org_id IN (
    SELECT m.org_id FROM public.memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN', 'MANAGER')
  ));

-- 8. BACKFILL DE DATOS EXISTENTES
-- Migrar datos de salud desde colaboradores
INSERT INTO public.employee_health (
  colaborador_id, 
  org_id, 
  numero_seguridad_social, 
  minusvalia, 
  ultima_revision_medica,
  reconocimiento_medico_reforzado,
  exonerado_seguro_medico,
  es_extranjero,
  trabajador_extranjero_permiso
)
SELECT 
  id, 
  org_id, 
  numero_seguridad_social, 
  COALESCE(minusvalia, false),
  ultima_revision_medica,
  COALESCE(reconocimiento_medico_reforzado, false),
  COALESCE(exonerado_seguro_medico, false),
  COALESCE(es_extranjero, false),
  COALESCE(trabajador_extranjero_permiso, false)
FROM public.colaboradores
WHERE org_id IS NOT NULL
ON CONFLICT (colaborador_id) DO NOTHING;

-- Migrar contactos de emergencia desde colaboradores
INSERT INTO public.employee_emergency_contacts (
  colaborador_id, 
  org_id, 
  nombre, 
  apellidos, 
  relacion,
  telefono_movil, 
  telefono_fijo,
  pais_movil,
  pais_fijo
)
SELECT 
  id, 
  org_id, 
  contacto_emergencia_nombre, 
  contacto_emergencia_apellidos, 
  contacto_emergencia_relacion,
  contacto_emergencia_movil, 
  contacto_emergencia_fijo,
  COALESCE(pais_movil, 'ES'),
  COALESCE(pais_fijo, 'ES')
FROM public.colaboradores
WHERE org_id IS NOT NULL 
  AND contacto_emergencia_nombre IS NOT NULL
ON CONFLICT DO NOTHING;

-- 9. TRIGGERS DE COMPATIBILIDAD (Sincronización bidireccional temporal)
-- Función para sincronizar health data cuando se actualiza colaboradores
CREATE OR REPLACE FUNCTION sync_colaborador_to_health()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar o insertar en employee_health
  INSERT INTO public.employee_health (
    colaborador_id, org_id, numero_seguridad_social, minusvalia, 
    ultima_revision_medica, reconocimiento_medico_reforzado,
    exonerado_seguro_medico, es_extranjero, trabajador_extranjero_permiso
  )
  VALUES (
    NEW.id, NEW.org_id, NEW.numero_seguridad_social, 
    COALESCE(NEW.minusvalia, false), NEW.ultima_revision_medica,
    COALESCE(NEW.reconocimiento_medico_reforzado, false),
    COALESCE(NEW.exonerado_seguro_medico, false),
    COALESCE(NEW.es_extranjero, false),
    COALESCE(NEW.trabajador_extranjero_permiso, false)
  )
  ON CONFLICT (colaborador_id) DO UPDATE SET
    numero_seguridad_social = EXCLUDED.numero_seguridad_social,
    minusvalia = EXCLUDED.minusvalia,
    ultima_revision_medica = EXCLUDED.ultima_revision_medica,
    reconocimiento_medico_reforzado = EXCLUDED.reconocimiento_medico_reforzado,
    exonerado_seguro_medico = EXCLUDED.exonerado_seguro_medico,
    es_extranjero = EXCLUDED.es_extranjero,
    trabajador_extranjero_permiso = EXCLUDED.trabajador_extranjero_permiso,
    updated_at = now();

  -- Actualizar o insertar contacto de emergencia si existe
  IF NEW.contacto_emergencia_nombre IS NOT NULL THEN
    INSERT INTO public.employee_emergency_contacts (
      colaborador_id, org_id, nombre, apellidos, relacion,
      telefono_movil, telefono_fijo, pais_movil, pais_fijo
    )
    VALUES (
      NEW.id, NEW.org_id, NEW.contacto_emergencia_nombre,
      NEW.contacto_emergencia_apellidos, NEW.contacto_emergencia_relacion,
      NEW.contacto_emergencia_movil, NEW.contacto_emergencia_fijo,
      COALESCE(NEW.pais_movil, 'ES'), COALESCE(NEW.pais_fijo, 'ES')
    )
    ON CONFLICT (colaborador_id) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      apellidos = EXCLUDED.apellidos,
      relacion = EXCLUDED.relacion,
      telefono_movil = EXCLUDED.telefono_movil,
      telefono_fijo = EXCLUDED.telefono_fijo,
      pais_movil = EXCLUDED.pais_movil,
      pais_fijo = EXCLUDED.pais_fijo,
      updated_at = now()
    WHERE employee_emergency_contacts.colaborador_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronización automática
CREATE TRIGGER sync_colaborador_health_trigger
  AFTER INSERT OR UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION sync_colaborador_to_health();

-- 10. VERIFICACIÓN POST-MIGRACIÓN
-- Función para verificar integridad de datos
CREATE OR REPLACE FUNCTION verify_phase2_migration()
RETURNS TABLE(
  check_name text,
  expected_count bigint,
  actual_count bigint,
  status text
) AS $$
BEGIN
  -- Verificar conteo de health records
  RETURN QUERY
  SELECT 
    'health_records_count'::text,
    (SELECT COUNT(*) FROM colaboradores WHERE org_id IS NOT NULL)::bigint,
    (SELECT COUNT(*) FROM employee_health)::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM employee_health) >= (SELECT COUNT(*) FROM colaboradores WHERE org_id IS NOT NULL) * 0.95
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END;

  -- Verificar conteo de emergency contacts
  RETURN QUERY
  SELECT 
    'emergency_contacts_count'::text,
    (SELECT COUNT(*) FROM colaboradores WHERE contacto_emergencia_nombre IS NOT NULL AND org_id IS NOT NULL)::bigint,
    (SELECT COUNT(*) FROM employee_emergency_contacts)::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM employee_emergency_contacts) >= (SELECT COUNT(*) FROM colaboradores WHERE contacto_emergencia_nombre IS NOT NULL AND org_id IS NOT NULL) * 0.95
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END;

  -- Verificar políticas RLS activas
  RETURN QUERY
  SELECT 
    'rls_policies_active'::text,
    4::bigint, -- Esperamos 4 políticas (2 por tabla)
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('employee_health', 'employee_emergency_contacts'))::bigint,
    CASE 
      WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('employee_health', 'employee_emergency_contacts')) >= 4
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar verificación
SELECT * FROM verify_phase2_migration();