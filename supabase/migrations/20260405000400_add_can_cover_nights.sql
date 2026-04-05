-- Add can_cover_nights flag to colaboradores
-- Allows users to mark which employees can cover Night Agent rest nights.
-- Default: true (all ROTA_COMPLETO employees rotate by default)
-- Set to false to exclude an employee from night coverage rotation.

ALTER TABLE public.colaboradores
ADD COLUMN IF NOT EXISTS can_cover_nights boolean DEFAULT true;

COMMENT ON COLUMN public.colaboradores.can_cover_nights IS
  'Whether this employee participates in Night Agent rest coverage rotation. Default true.';
