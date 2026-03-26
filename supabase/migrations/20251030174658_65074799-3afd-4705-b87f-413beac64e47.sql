-- Tabla para almacenar configuración global de notificaciones por organización
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Configuración de notificaciones por email
  shift_notifications_enabled boolean NOT NULL DEFAULT false,
  notify_on_create boolean NOT NULL DEFAULT true,
  notify_on_update boolean NOT NULL DEFAULT true,
  notify_on_delete boolean NOT NULL DEFAULT true,
  
  -- Metadatos
  enabled_by uuid REFERENCES auth.users(id),
  enabled_at timestamptz,
  disabled_by uuid REFERENCES auth.users(id),
  disabled_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Una configuración por organización
  UNIQUE(org_id)
);

-- Índices para rendimiento
CREATE INDEX idx_notification_settings_org_id ON public.notification_settings(org_id);
CREATE INDEX idx_notification_settings_enabled ON public.notification_settings(org_id, shift_notifications_enabled);

-- RLS Policies: Solo roles no-EMPLOYEE pueden modificar
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Lectura: Todos los miembros de la org pueden ver la configuración
CREATE POLICY "Members can view notification settings"
ON public.notification_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() AND org_id = notification_settings.org_id
  )
);

-- Escritura: Solo MANAGER, DIRECTOR, ADMIN, OWNER pueden modificar
CREATE POLICY "Managers can manage notification settings"
ON public.notification_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() 
      AND org_id = notification_settings.org_id
      AND role IN ('MANAGER', 'DIRECTOR', 'ADMIN', 'OWNER')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = auth.uid() 
      AND org_id = notification_settings.org_id
      AND role IN ('MANAGER', 'DIRECTOR', 'ADMIN', 'OWNER')
  )
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar configuración por defecto para organizaciones existentes
INSERT INTO public.notification_settings (org_id, shift_notifications_enabled)
SELECT id, false FROM public.organizations
ON CONFLICT (org_id) DO NOTHING;