-- C1: Modo edición delegable FOM → AFOM
-- Permite al FOM activar/desactivar delegación de edición al AFOM

ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS delegation_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delegation_start DATE,
  ADD COLUMN IF NOT EXISTS delegation_end DATE,
  ADD COLUMN IF NOT EXISTS delegation_granted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS delegation_granted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.colaboradores.delegation_active IS 'true = este AFOM tiene permisos de edición delegados por el FOM';
COMMENT ON COLUMN public.colaboradores.delegation_start IS 'Fecha inicio de la delegación (null = manual/inmediata)';
COMMENT ON COLUMN public.colaboradores.delegation_end IS 'Fecha fin de la delegación (null = hasta revocación manual)';
