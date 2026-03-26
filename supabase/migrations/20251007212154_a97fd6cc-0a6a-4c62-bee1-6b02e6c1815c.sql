-- Crear tabla para backups de operaciones críticas
CREATE TABLE IF NOT EXISTS public.operation_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  operation_description TEXT,
  backup_data JSONB NOT NULL,
  affected_records INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by UUID,
  CONSTRAINT fk_operation_backups_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_operation_backups_org_id ON public.operation_backups(org_id);
CREATE INDEX IF NOT EXISTS idx_operation_backups_user_id ON public.operation_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_backups_created_at ON public.operation_backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operation_backups_expires_at ON public.operation_backups(expires_at);
CREATE INDEX IF NOT EXISTS idx_operation_backups_operation_type ON public.operation_backups(operation_type);

-- Habilitar RLS
ALTER TABLE public.operation_backups ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Los miembros de la org pueden ver sus backups
CREATE POLICY "org_members_view_backups" ON public.operation_backups
  FOR SELECT
  USING (
    org_id IN (
      SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
    )
  );

-- Políticas RLS: Los miembros de la org pueden crear backups
CREATE POLICY "org_members_create_backups" ON public.operation_backups
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Políticas RLS: Los admins/owners pueden actualizar backups (para marcar como restaurados)
CREATE POLICY "org_admins_update_backups" ON public.operation_backups
  FOR UPDATE
  USING (
    org_id IN (
      SELECT m.org_id FROM memberships m 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('OWNER', 'ADMIN')
    )
  );

-- Políticas RLS: Los admins/owners pueden eliminar backups antiguos
CREATE POLICY "org_admins_delete_backups" ON public.operation_backups
  FOR DELETE
  USING (
    org_id IN (
      SELECT m.org_id FROM memberships m 
      WHERE m.user_id = auth.uid() 
      AND m.role IN ('OWNER', 'ADMIN')
    )
  );

-- Función para limpiar backups expirados automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_backups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.operation_backups
  WHERE expires_at < now()
  AND restored_at IS NULL; -- Solo eliminar backups no restaurados
END;
$$;

-- Trigger para actualizar updated_at (opcional, para tracking)
CREATE OR REPLACE FUNCTION public.update_operation_backup_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.restored_at = now();
  RETURN NEW;
END;
$$;

-- Comentarios para documentación
COMMENT ON TABLE public.operation_backups IS 'Almacena backups automáticos antes de operaciones críticas para permitir rollback';
COMMENT ON COLUMN public.operation_backups.operation_type IS 'Tipo de operación: bulk_delete, migration, clear_calendar, etc.';
COMMENT ON COLUMN public.operation_backups.backup_data IS 'Datos completos en formato JSONB para restauración';
COMMENT ON COLUMN public.operation_backups.affected_records IS 'Número de registros afectados por la operación';
COMMENT ON COLUMN public.operation_backups.expires_at IS 'Fecha de expiración del backup (por defecto 30 días)';
COMMENT ON COLUMN public.operation_backups.restored_at IS 'Fecha en que se restauró el backup (NULL si no se ha restaurado)';
COMMENT ON COLUMN public.operation_backups.restored_by IS 'Usuario que restauró el backup';