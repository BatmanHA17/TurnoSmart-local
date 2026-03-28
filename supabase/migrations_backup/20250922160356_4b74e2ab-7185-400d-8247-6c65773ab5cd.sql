-- Fix tables constraints and field lengths
-- First, add unique constraints for ON CONFLICT to work
ALTER TABLE public.employee_emergency_contacts 
ADD CONSTRAINT unique_emergency_contact_per_colaborador 
UNIQUE (colaborador_id);

ALTER TABLE public.employee_banking 
ADD CONSTRAINT unique_banking_per_colaborador 
UNIQUE (colaborador_id);

-- Fix BIC field length (BIC codes can be 8-11 characters, but some test data might be longer)
ALTER TABLE public.employee_banking 
ALTER COLUMN bic TYPE VARCHAR(15);

-- Update colaborador_full view to include banking and emergency contact data
CREATE OR REPLACE VIEW public.colaborador_full AS
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