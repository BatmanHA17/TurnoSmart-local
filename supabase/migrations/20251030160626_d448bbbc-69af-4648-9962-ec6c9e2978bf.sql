-- Fix manual: Crear membership faltante para calltobatmanuk@gmail.com
-- Este usuario completó el flujo de vinculación pero no se creó su membership

-- Insertar membership faltante
INSERT INTO public.memberships (user_id, org_id, role, "primary")
VALUES (
  '7d3f23a6-f18b-4f7a-a1b8-2e8368e5bb05', -- calltobatmanuk colaborador_id que actúa como user_id
  'ae3db3e5-00ec-43c3-a3de-a245de33729d', -- Empresa UNO org_id
  'EMPLOYEE', -- rol asignado
  true -- primera y única org, por tanto primary
)
ON CONFLICT (user_id, org_id) DO NOTHING;

-- Actualizar primary_org_id en profiles si no existe
UPDATE public.profiles
SET primary_org_id = 'ae3db3e5-00ec-43c3-a3de-a245de33729d'
WHERE id = '7d3f23a6-f18b-4f7a-a1b8-2e8368e5bb05'
  AND primary_org_id IS NULL;