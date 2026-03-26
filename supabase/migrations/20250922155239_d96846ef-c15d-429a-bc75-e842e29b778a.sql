-- Actualizar la vista colaborador_full para incluir información bancaria
DROP VIEW IF EXISTS public.colaborador_full;

CREATE VIEW public.colaborador_full 
WITH (security_invoker = true) AS
SELECT 
    c.*,
    -- Información de salud
    eh.numero_seguridad_social,
    eh.minusvalia,
    eh.ultima_revision_medica,
    eh.reconocimiento_medico_reforzado,
    eh.exonerado_seguro_medico,
    eh.es_extranjero,
    eh.trabajador_extranjero_permiso,
    
    -- Información de contacto de emergencia
    eec.nombre as emergencia_nombre,
    eec.apellidos as emergencia_apellidos,
    eec.relacion as emergencia_relacion,
    eec.telefono_movil as emergencia_telefono,
    eec.telefono_fijo as emergencia_fijo,
    
    -- Información bancaria
    eb.nombre_titular as banking_titular,
    eb.iban as banking_iban,
    eb.bic as banking_bic,
    eb.numero_identificacion_interna as banking_numero_identificacion,
    
    -- Información del perfil del usuario
    p.id as profile_id,
    p.display_name,
    p.deleted_at IS NULL as profile_active,
    
    -- Rol principal del colaborador
    get_colaborador_main_role(c.id) as rol_principal,
    
    -- Status del contrato
    CASE 
        WHEN c.fecha_fin_contrato IS NULL THEN 'Indefinido'
        WHEN c.fecha_fin_contrato > NOW()::date THEN 'Vigente'
        ELSE 'Vencido'
    END as contrato_vigente,
    
    -- Balance de horas compensatorias
    COALESCE(cto.balance_hours, 0) as balance_horas_compensatorias,
    
    -- Total de ausencias aprobadas
    (SELECT COUNT(*) FROM absence_requests ar 
     WHERE ar.colaborador_id = c.id 
     AND ar.status = 'approved') as total_ausencias_aprobadas

FROM public.colaboradores c
LEFT JOIN public.employee_health eh ON eh.colaborador_id = c.id
LEFT JOIN public.employee_emergency_contacts eec ON eec.colaborador_id = c.id
LEFT JOIN public.employee_banking eb ON eb.colaborador_id = c.id
LEFT JOIN public.profiles p ON p.email = c.email AND p.deleted_at IS NULL
LEFT JOIN public.compensatory_time_off cto ON cto.colaborador_id = c.id
WHERE c.org_id IS NOT NULL;