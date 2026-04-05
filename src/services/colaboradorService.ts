import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Interfaces for normalized table writes
export interface EmployeeHealthData {
  colaborador_id: string;
  org_id: string;
  numero_seguridad_social?: string | null;
  minusvalia?: boolean;
  ultima_revision_medica?: string | null;
  reconocimiento_medico_reforzado?: boolean;
  exonerado_seguro_medico?: boolean;
  es_extranjero?: boolean;
  trabajador_extranjero_permiso?: boolean;
}

export interface EmployeeEmergencyContactData {
  colaborador_id: string;
  org_id: string;
  nombre?: string | null;
  apellidos?: string | null;
  relacion?: string | null;
  telefono_movil?: string | null;
  telefono_fijo?: string | null;
  pais_movil?: string;
  pais_fijo?: string;
}

export interface EmployeeBankingData {
  colaborador_id: string;
  org_id: string;
  nombre_titular?: string | null;
  iban?: string | null;
  bic?: string | null;
  numero_identificacion_interna?: string | null;
}

export interface ColaboradorBaseData {
  nombre: string;
  apellidos: string;
  apellidos_uso?: string | null;
  empleado_id?: string | null;
  fecha_nacimiento?: string | null;
  email: string;
  telefono_movil?: string | null;
  pais_movil?: string;
  telefono_fijo?: string | null;
  pais_fijo?: string;
  fecha_inicio_contrato?: string | null;
  hora_inicio_contrato?: string | null;
  tipo_contrato?: string | null;
  status?: string;
  avatar_url?: string | null;
  fecha_fin_contrato?: string | null;
  tiempo_trabajo_semanal?: number | null;
  // establecimiento_por_defecto?: string | null; // ELIMINADO en Fase 5C
  responsable_directo?: string | null;
  pais_nacimiento?: string;
  direccion?: string | null;
  ciudad?: string | null;
  codigo_postal?: string | null;
  provincia?: string | null;
  pais_residencia?: string;
  genero?: string | null;
  apellidos_nacimiento?: string | null;
  nacionalidad?: string | null;
  ciudad_nacimiento?: string | null;
  estado_civil?: string | null;
  numero_personas_dependientes?: number | null;
  fecha_antiguedad?: string | null;
  job_id?: string | null; // Nuevo campo para referencia al puesto de trabajo
  engine_role?: string | null; // SMART engine rotation role
  can_cover_nights?: boolean; // Whether employee participates in night coverage rotation
  org_id: string;
  selectedDepartments?: string[]; // For department assignments
}

/**
 * Creates or updates a colaborador with normalized data writes
 */
export const createOrUpdateColaborador = async (
  colaboradorData: ColaboradorBaseData,
  healthData?: EmployeeHealthData,
  emergencyContactData?: EmployeeEmergencyContactData,
  bankingData?: EmployeeBankingData,
  colaboradorId?: string
) => {
  try {
    // Extract selectedDepartments from colaboradorData to handle separately
    const { selectedDepartments, ...colaboradorDataForDB } = colaboradorData;
    
    // 1. Create or update main colaborador record
    let colaboradorResult;
    
    if (colaboradorId) {
      // Update existing colaborador
      const { data: updateData, error: updateError } = await supabase
        .from('colaboradores')
        .update(colaboradorDataForDB)
        .eq('id', colaboradorId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      colaboradorResult = updateData;
    } else {
      // Create new colaborador
      const { data: insertData, error: insertError } = await supabase
        .from('colaboradores')
        .insert([colaboradorDataForDB])
        .select()
        .single();
        
      if (insertError) throw insertError;
      colaboradorResult = insertData;
    }

    // 2. Handle health data in normalized table
    if (healthData) {
      const healthDataWithIds = {
        ...healthData,
        colaborador_id: colaboradorResult.id,
        org_id: colaboradorResult.org_id
      };

      const { error: healthError } = await supabase
        .from('employee_health')
        .upsert(healthDataWithIds, { 
          onConflict: 'colaborador_id'
        });

      if (healthError) {
        console.error('Error saving health data:', healthError);
        // Don't throw - health data is optional
      } else {
      }
    }

    // 3. Handle emergency contact data in normalized table
    if (emergencyContactData && (emergencyContactData.nombre || emergencyContactData.telefono_movil)) {
      const emergencyDataWithIds = {
        ...emergencyContactData,
        colaborador_id: colaboradorResult.id,
        org_id: colaboradorResult.org_id
      };

      const { error: emergencyError } = await supabase
        .from('employee_emergency_contacts')
        .upsert(emergencyDataWithIds, { 
          onConflict: 'colaborador_id'
        });

      if (emergencyError) {
        console.error('Error saving emergency contact data:', emergencyError);
        // Don't throw - emergency contact data is optional
      } else {
      }
    }

    // 4. Handle banking data in normalized table
    if (bankingData && (bankingData.nombre_titular || bankingData.iban || bankingData.bic)) {
      const bankingDataWithIds = {
        ...bankingData,
        colaborador_id: colaboradorResult.id,
        org_id: colaboradorResult.org_id
      };

      const { error: bankingError } = await supabase
        .from('employee_banking')
        .upsert(bankingDataWithIds, { 
          onConflict: 'colaborador_id'
        });

      if (bankingError) {
        console.error('Error saving banking data:', bankingError);
        // Don't throw - banking data is optional
      } else {
      }
    }

    // Handle department assignments if provided
    if (selectedDepartments && selectedDepartments.length > 0) {
      
      // First, delete all existing assignments for this colaborador
      const { error: deleteError } = await supabase
        .from('colaborador_departments')
        .delete()
        .eq('colaborador_id', colaboradorResult.id);

      if (deleteError) {
        console.error('Error deleting existing departments:', deleteError);
      }

      // Then create new assignments
      const user = await supabase.auth.getUser();
      const newAssignments = selectedDepartments.map(deptId => ({
        colaborador_id: colaboradorResult.id,
        department_id: deptId,
        org_id: colaboradorDataForDB.org_id,
        assigned_by: user.data.user?.id,
        is_active: true
      }));

      const { error: assignmentError } = await supabase
        .from('colaborador_departments')
        .insert(newAssignments);

      if (assignmentError) {
        console.error('Error creating department assignments:', assignmentError);
        // Don't throw - department assignments are not critical
      } else {
      }
    }

    return colaboradorResult;
    
  } catch (error) {
    console.error('Error in createOrUpdateColaborador:', error);
    throw error;
  }
};

/**
 * Updates only health data for an existing colaborador
 */
export const updateColaboradorHealth = async (
  colaboradorId: string,
  healthData: Partial<EmployeeHealthData>
) => {
  try {
    // Get org_id from colaborador
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('org_id')
      .eq('id', colaboradorId)
      .single();

    if (colaboradorError) throw colaboradorError;

    const healthDataWithIds = {
      ...healthData,
      colaborador_id: colaboradorId,
      org_id: colaboradorData.org_id
    };

    const { error } = await supabase
      .from('employee_health')
      .upsert(healthDataWithIds, { 
        onConflict: 'colaborador_id'
      });

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating health data:', error);
    throw error;
  }
};

/**
 * Updates only emergency contact data for an existing colaborador
 */
export const updateColaboradorEmergencyContact = async (
  colaboradorId: string,
  emergencyContactData: Partial<EmployeeEmergencyContactData>
) => {
  try {
    // Get org_id from colaborador
    const { data: colaboradorData, error: colaboradorError } = await supabase
      .from('colaboradores')
      .select('org_id')
      .eq('id', colaboradorId)
      .single();

    if (colaboradorError) throw colaboradorError;

    const emergencyDataWithIds = {
      ...emergencyContactData,
      colaborador_id: colaboradorId,
      org_id: colaboradorData.org_id
    };

    const { error } = await supabase
      .from('employee_emergency_contacts')
      .upsert(emergencyDataWithIds, { 
        onConflict: 'colaborador_id'
      });

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating emergency contact data:', error);
    throw error;
  }
};

/**
 * Legacy compatibility helper - maps old form data to normalized structure
 */
export const mapLegacyFormData = (formData: any) => {
  const baseData: ColaboradorBaseData = {
    nombre: formData.nombre,
    apellidos: formData.apellidos,
    apellidos_uso: formData.apellidosUso || null,
    empleado_id: formData.empleadoId || null,
    fecha_nacimiento: formData.fechaNacimiento || null,
    email: formData.email,
    telefono_movil: formData.telefonoMovil || null,
    pais_movil: formData.codigoPaisMovil || 'ES',
    telefono_fijo: formData.telefonoFijo || null,
    pais_fijo: formData.codigoPaisFijo || 'ES',
    fecha_inicio_contrato: formData.fechaInicioContrato || null,
    hora_inicio_contrato: formData.horaInicioContrato || null,
    tipo_contrato: formData.tipoContrato || null,
    status: formData.status || 'activo',
    fecha_fin_contrato: formData.fechaFinContrato || null,
    tiempo_trabajo_semanal: formData.tiempoTrabajoSemanal ? parseInt(formData.tiempoTrabajoSemanal) : null,
    // establecimiento_por_defecto: formData.establecimientoPorDefecto || null, // ELIMINADO
    responsable_directo: formData.responsableDirecto || null,
    pais_nacimiento: formData.paisNacimiento || 'España',
    direccion: formData.direccion || null,
    ciudad: formData.ciudad || null,
    codigo_postal: formData.codigoPostal || null,
    provincia: formData.provincia || null,
    pais_residencia: formData.pais || 'España',
    genero: formData.genero || null,
    apellidos_nacimiento: formData.apellidosNacimiento || null,
    nacionalidad: formData.nacionalidad || null,
    ciudad_nacimiento: formData.ciudadNacimiento || null,
    estado_civil: formData.estadoCivil || null,
    numero_personas_dependientes: formData.numeroPersonasDependientes ? parseInt(formData.numeroPersonasDependientes) : null,
    fecha_antiguedad: formData.fechaAntiguedad || null,
    job_id: formData.jobId || null,
    engine_role: formData.engineRole || 'ROTA_COMPLETO',
    can_cover_nights: formData.canCoverNights !== false,
    org_id: '' // Will be set by the calling function
  };

  const healthData: EmployeeHealthData = {
    colaborador_id: '', // Will be set by the service
    org_id: '', // Will be set by the service
    numero_seguridad_social: formData.numeroSeguridadSocial || null,
    minusvalia: formData.personaConDiscapacidad || false,
    ultima_revision_medica: formData.ultimaRevisionMedica || null,
    reconocimiento_medico_reforzado: formData.reconocimientoMedicoReforzado || false,
    exonerado_seguro_medico: formData.exentoSeguroMedico || false,
    es_extranjero: formData.esExtranjero || false,
    trabajador_extranjero_permiso: formData.trabajadorExtranjeroPermiso || false
  };

  const emergencyContactData: EmployeeEmergencyContactData = {
    colaborador_id: '', // Will be set by the service
    org_id: '', // Will be set by the service
    nombre: formData.nombreContactoEmergencia || null,
    apellidos: formData.apellidoContactoEmergencia || null,
    relacion: formData.relacionContactoEmergencia || null,
    telefono_movil: formData.telefonoMovilEmergencia || null,
    telefono_fijo: formData.telefonoFijoEmergencia || null,
    pais_movil: formData.codigoPaisMovilEmergencia || 'ES',
    pais_fijo: formData.codigoPaisFijoEmergencia || 'ES'
  };

  const bankingData: EmployeeBankingData = {
    colaborador_id: '', // Will be set by the service
    org_id: '', // Will be set by the service
    nombre_titular: formData.nombreTitularCuenta || null,
    iban: formData.iban || null,
    bic: formData.bic || null,
    numero_identificacion_interna: formData.numeroIdentificacionInterna || null
  };

  return {
    baseData,
    healthData,
    emergencyContactData,
    bankingData
  };
};