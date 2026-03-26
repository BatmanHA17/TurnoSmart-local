import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface ColaboradorFull {
  // Datos básicos (mantenidos en tabla base colaboradores)
  id: string;
  org_id: string;
  nombre: string;
  apellidos: string;
  apellidos_uso: string | null;
  empleado_id: string | null;
  email: string;
  telefono_movil: string | null;
  telefono_fijo: string | null;
  pais_movil: string | null;
  pais_fijo: string | null;
  avatar_url: string | null;
  status: string | null;
  responsable_directo: string | null;
  tipo_contrato: string | null;
  fecha_inicio_contrato: string | null;
  fecha_fin_contrato: string | null;
  hora_inicio_contrato: string | null;
  tiempo_trabajo_semanal: number | null;
  disponibilidad_semanal: string | null;
  has_generalized_access: boolean | null;
  created_at: string;
  updated_at: string;
  
  // Datos personales adicionales (mantenidos en tabla base colaboradores)
  fecha_nacimiento: string | null;
  pais_nacimiento: string | null;
  ciudad_nacimiento: string | null;
  nacionalidad: string | null;
  genero: string | null;
  apellidos_nacimiento: string | null;
  estado_civil: string | null;
  numero_personas_dependientes: number | null;
  fecha_antiguedad: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  provincia: string | null;
  pais_residencia: string | null;
  
  // ===== DATOS NORMALIZADOS (de tablas especializadas) =====
  
  // Datos de salud (from employee_health) - ÚNICOS
  numero_seguridad_social: string | null;
  minusvalia: boolean | null;
  ultima_revision_medica: string | null;
  reconocimiento_medico_reforzado: boolean | null;
  exonerado_seguro_medico: boolean | null;
  es_extranjero: boolean | null;
  trabajador_extranjero_permiso: boolean | null;
  
  // Contacto de emergencia (from employee_emergency_contacts) - ÚNICOS
  emergencia_nombre: string | null;
  emergencia_apellidos: string | null;
  emergencia_relacion: string | null;
  emergencia_telefono: string | null;
  emergencia_fijo: string | null;
  
  // ===== CAMPO ELIMINADO EN FASE 5C =====
  // establecimiento_por_defecto: ELIMINADO - usar org_id para lógica de organización
  
  // ===== DATOS DEL SISTEMA =====
  
  // Datos del sistema (from profiles join)
  profile_id: string | null;
  profile_active: boolean | null;
  display_name: string | null;
  
  // Rol y contrato
  rol_principal: string | null;
  contrato_vigente: string | null;
  
  // Estadísticas calculadas
  balance_horas_compensatorias: number | null;
  total_ausencias_aprobadas: number | null;
  
  // ===== COMPATIBILITY LAYER =====
  // Los siguientes campos LEGACY ya NO están en la vista colaborador_full
  // pero mantenemos la interface para compatibilidad temporal
  // ⚠️ ESTOS CAMPOS SERÁN undefined EN RUNTIME - usar los campos emergencia_* en su lugar
  
  /** @deprecated ⚠️ NO DISPONIBLE en colaborador_full view. Use emergencia_nombre instead */
  contacto_emergencia_nombre?: string | null;
  /** @deprecated ⚠️ NO DISPONIBLE en colaborador_full view. Use emergencia_apellidos instead */
  contacto_emergencia_apellidos?: string | null;
  /** @deprecated ⚠️ NO DISPONIBLE en colaborador_full view. Use emergencia_relacion instead */
  contacto_emergencia_relacion?: string | null;
  /** @deprecated ⚠️ NO DISPONIBLE en colaborador_full view. Use emergencia_telefono instead */
  contacto_emergencia_movil?: string | null;
  /** @deprecated ⚠️ NO DISPONIBLE en colaborador_full view. Use emergencia_fijo instead */
  contacto_emergencia_fijo?: string | null;
  /** @deprecated ⚠️ NO DISPONIBLE en colaborador_full view. Legacy field */
  codigo_pais_movil_emergencia?: string | null;
  /** @deprecated ⚠️ NO DISPONIBLE en colaborador_full view. Legacy field */
  codigo_pais_fijo_emergencia?: string | null;
  
  // Información del puesto de trabajo (JOIN con jobs)
  jobs?: {
    id: string;
    title: string;
    department: string;
  } | null;
}

export const useColaboradorFull = (orgId?: string) => {
  const [colaboradores, setColaboradores] = useState<ColaboradorFull[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColaboradores = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('colaboradores')
        .select('*')
        .order('updated_at', { ascending: false });
      
      // Filtrar por org_id si se proporciona
      if (orgId) {
        query = query.eq('org_id', orgId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching colaboradores from view:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los colaboradores",
          variant: "destructive"
        });
        return [];
      }

      const colaboradoresList = (data || []) as any[];
      setColaboradores(colaboradoresList);
      return colaboradoresList;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar los datos",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getColaboradorById = async (id: string): Promise<ColaboradorFull | null> => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching colaborador by id:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, [orgId]);

  return {
    colaboradores,
    loading,
    fetchColaboradores,
    getColaboradorById
  };
};

export const useColaboradorById = (id: string | undefined) => {
  const [colaborador, setColaborador] = useState<ColaboradorFull | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchColaborador = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      
      // Primero obtenemos job_id de la tabla colaboradores
      const { data: colaboradorBase, error: colaboradorBaseError } = await supabase
        .from('colaboradores')
        .select('job_id')
        .eq('id', id)
        .maybeSingle();

      if (colaboradorBaseError) {
        console.error('❌ Error fetching colaborador base:', colaboradorBaseError);
        toast({
          title: "Error",
          description: "No se pudo cargar el colaborador",
          variant: "destructive"
        });
        return;
      }

      // Luego obtenemos los datos extendidos de la vista
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from('colaboradores')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (colaboradorError) {
        console.error('❌ Error fetching colaborador:', colaboradorError);
        toast({
          title: "Error",
          description: "No se pudo cargar el colaborador",
          variant: "destructive"
        });
        return;
      }

      if (!colaboradorData) {
        toast({
          title: "Error",
          description: "Colaborador no encontrado",
          variant: "destructive"
        });
        return;
      }

      const jobId = colaboradorBase?.job_id;

      // Si tiene job_id, obtenemos la información del job
      let jobData = null;
      if (jobId) {
        
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('id, title, department')
          .eq('id', jobId)
          .maybeSingle();
          
        if (jobError) {
          console.error('❌ Error fetching job:', jobError);
        } else if (job) {
          jobData = job;
        } else {
        }
      } else {
      }

      // Combinamos los datos
      const finalColaborador = {
        ...colaboradorData,
        job_id: jobId, // Agregamos el job_id que faltaba
        jobs: jobData
      } as any;
      

      setColaborador(finalColaborador);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar el colaborador",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColaborador();
  }, [id]);

  return { colaborador, loading, refetch: fetchColaborador };
};