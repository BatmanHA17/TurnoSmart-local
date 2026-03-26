-- Fix Security Definer Views by explicitly setting security_invoker
-- This ensures views execute with the permissions of the querying user, not the view creator

-- Recreate org_usage_daily view with security_invoker
DROP VIEW IF EXISTS public.org_usage_daily CASCADE;

CREATE VIEW public.org_usage_daily 
WITH (security_invoker = true) AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  DATE(al.created_at) as date,
  COUNT(DISTINCT al.user_id) as active_users,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN al.action LIKE '%shift%' THEN 1 END) as shift_actions,
  COUNT(CASE WHEN al.action LIKE '%colaborador%' THEN 1 END) as colaborador_actions
FROM public.organizations o
LEFT JOIN public.activity_log al ON o.id = al.org_id
WHERE al.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY o.id, o.name, DATE(al.created_at)
ORDER BY date DESC, org_name;

-- Recreate colaborador_full view with security_invoker
DROP VIEW IF EXISTS public.colaborador_full CASCADE;

CREATE VIEW public.colaborador_full 
WITH (security_invoker = true) AS
SELECT 
  c.*,
  -- Health data
  eh.numero_seguridad_social,
  eh.minusvalia,
  eh.ultima_revision_medica,
  eh.reconocimiento_medico_reforzado,
  eh.exonerado_seguro_medico,
  eh.es_extranjero,
  eh.trabajador_extranjero_permiso,
  
  -- Emergency contacts
  eec.nombre as emergency_contact_nombre,
  eec.apellidos as emergency_contact_apellidos,
  eec.relacion as emergency_contact_relacion,
  eec.telefono_movil as emergency_contact_telefono_movil,
  eec.telefono_fijo as emergency_contact_telefono_fijo,
  eec.pais_movil as emergency_contact_pais_movil,
  eec.pais_fijo as emergency_contact_pais_fijo,
  
  -- Banking data  
  eb.nombre_titular as banking_titular,
  eb.iban as banking_iban,
  eb.bic as banking_bic,
  eb.numero_identificacion_interna as banking_numero_identificacion
  
FROM public.colaboradores c
LEFT JOIN public.employee_health eh ON c.id = eh.colaborador_id
LEFT JOIN public.employee_emergency_contacts eec ON c.id = eec.colaborador_id  
LEFT JOIN public.employee_banking eb ON c.id = eb.colaborador_id;

-- Recreate the helper function that was dropped with CASCADE
CREATE OR REPLACE FUNCTION public.get_colaborador_full_by_org(org_uuid uuid)
RETURNS SETOF colaborador_full
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT * FROM colaborador_full WHERE org_id = org_uuid;
$$;