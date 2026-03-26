-- FASE 0: Crear backups de seguridad
CREATE TABLE IF NOT EXISTS _bak_colaboradores AS TABLE public.colaboradores WITH DATA;
CREATE TABLE IF NOT EXISTS _bak_colaborador_roles AS TABLE public.colaborador_roles WITH DATA;
CREATE TABLE IF NOT EXISTS _bak_absence_requests AS TABLE public.absence_requests WITH DATA;
CREATE TABLE IF NOT EXISTS _bak_contract_history AS TABLE public.contract_history WITH DATA;

-- FASE 1A: Crear índice único (sin CONCURRENTLY para evitar bloque de transacción)
CREATE UNIQUE INDEX IF NOT EXISTS idx_colaboradores_org_email_uniq
ON public.colaboradores (org_id, lower(email));

-- FASE 1B: Añadir constraint unique reutilizando el índice
ALTER TABLE public.colaboradores
  ADD CONSTRAINT colaboradores_org_email_uniq
  UNIQUE USING INDEX idx_colaboradores_org_email_uniq;

-- FASE 1C: Añadir CHECK constraint para validación de formato de email
ALTER TABLE public.colaboradores
  ADD CONSTRAINT colaboradores_email_format_chk
  CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');