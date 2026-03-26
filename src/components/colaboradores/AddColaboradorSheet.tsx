import React, { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateColaborador, mapLegacyFormData } from "@/services/colaboradorService";
import { useNavigate } from "react-router-dom";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useJobDepartments } from "@/hooks/useJobDepartments";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

// Función para generar ID único - movida fuera del componente
const generateEmployeeId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `EMP${timestamp}${randomNum}`;
};

interface AddColaboradorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColaboradorAdded?: () => void;
  colaboradorData?: any;
  isEditMode?: boolean;
  onColaboradorUpdated?: () => void;
  showOnlyPersonalInfo?: boolean; // Nueva prop para mostrar solo "Información Personal"
}

export const AddColaboradorSheet = ({ 
  open, 
  onOpenChange, 
  onColaboradorAdded, 
  colaboradorData, 
  isEditMode = false, 
  onColaboradorUpdated,
  showOnlyPersonalInfo = false
}: AddColaboradorSheetProps) => {
  const navigate = useNavigate();
  const { logActivity } = useActivityLog();
  const { organizations, currentOrganizationName } = useOrganizations();
  const { departments } = useJobDepartments();
  const { assignments, loading: loadingAssignments, refetch: refetchAssignments } = useTeamAssignments(colaboradorData?.id);
  const [jobs, setJobs] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedDepartments, setSelectedDepartments] = useState<{id: string, name: string}[]>([]);
  const [tempJobWarningAccepted, setTempJobWarningAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState("datos-personales");
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    apellidosUso: "",
    empleadoId: "", // Se inicializa vacío y se genera en useEffect
    fechaNacimiento: "",
    email: "",
    telefonoMovil: "",
    paisMovil: "ES",
    telefonoFijo: "",
    paisFijo: "ES",
    fechaInicioContrato: "",
    horaInicioContrato: "09:00", // Valor por defecto
    tipoContrato: "Contrato indefinido",
    fechaFinContrato: "",
    tiempoTrabajoSemanal: "",
    jobId: "", // Nuevo campo para el puesto de trabajo
    // establecimientoPorDefecto: "", // ELIMINADO en Fase 5C - usar org_id
    responsableDirecto: "",
    esExtranjero: false,
    // Campos adicionales para la sección Contacto
    direccion: "",
    complementoDireccion: "",
    codigoPostal: "",
    ciudad: "",
    pais: "España",
    // Información bancaria
    nombreTitularCuenta: "",
    iban: "",
    bic: "",
    numeroIdentificacionInterna: "",
    // Información de salud
    numeroSeguridadSocial: "",
    personaConDiscapacidad: false,
    ultimaRevisionMedica: "",
    reconocimientoMedicoReforzado: false,
    exentoSeguroMedico: false,
    nombreContactoEmergencia: "",
    apellidoContactoEmergencia: "",
    relacionContactoEmergencia: "",
    telefonoMovilEmergencia: "",
    telefonoFijoEmergencia: "",
    codigoPaisMovilEmergencia: "+34",
    codigoPaisFijoEmergencia: "+34",
    // Campos adicionales del formulario de edición
    genero: "",
    apellidosNacimiento: "",
    nacionalidad: "",
    provincia: "",
    ciudadNacimiento: "",
    estadoCivil: "",
    numeroPersonasDependientes: "",
    fechaAntiguedad: "",
    trabajadorExtranjeroPermiso: false
  });

  // Mapeo de códigos de país a códigos telefónicos
  const countryToPhoneCode = {
    'ES': '+34',
    'FR': '+33', 
    'DE': '+49',
    'IT': '+39',
    'GB': '+44'
  };

  // Función para actualizar código de teléfono móvil cuando cambia el país
  const handlePaisMovilChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      paisMovil: value,
      telefonoMovil: prev.telefonoMovil.replace(/^\+\d+\s?/, '') // Remover código anterior si existe
    }));
  };

  // Función para actualizar código de teléfono fijo cuando cambia el país
  const handlePaisFijoChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      paisFijo: value,
      telefonoFijo: prev.telefonoFijo.replace(/^\+\d+\s?/, '') // Remover código anterior si existe
    }));
  };

  // Función para actualizar código de teléfono móvil de emergencia
  const handleCodigoPaisMovilEmergenciaChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      codigoPaisMovilEmergencia: value,
      telefonoMovilEmergencia: prev.telefonoMovilEmergencia.replace(/^\+\d+\s?/, '') // Remover código anterior si existe
    }));
  };

  // Función para actualizar código de teléfono fijo de emergencia
  const handleCodigoPaisFijoEmergenciaChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      codigoPaisFijoEmergencia: value,
      telefonoFijoEmergencia: prev.telefonoFijoEmergencia.replace(/^\+\d+\s?/, '') // Remover código anterior si existe
    }));
  };

  // useEffect para establecimiento eliminado en Fase 5C - usar org_id en su lugar

  // Cargar jobs disponibles - filtrados por departamentos seleccionados
  useEffect(() => {
    const loadJobs = async () => {
      try {
        let query = supabase
          .from('jobs')
          .select('*');
        
        // Si hay departamentos seleccionados, filtrar jobs por esos departamentos
        if (selectedDepartments.length > 0) {
          const departmentIds = selectedDepartments.map(dept => dept.id);
          query = query.in('department_id', departmentIds);
        }
        
        const { data, error } = await query.order('title');
        
        if (!error && data) {
          setJobs(data);
        }
      } catch (error) {
        console.error('Error loading jobs:', error);
      }
    };
    
    if (open) {
      loadJobs();
    }
   }, [open, selectedDepartments]);

  // Cargar managers y roles superiores para el dropdown de Responsable Directo
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const { data: currentOrgData } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle();
        
        if (!currentOrgData?.id) return;

        const { data, error } = await supabase
          .from('colaborador_roles')
          .select(`
            colaborador_id,
            role,
            colaboradores!inner (
              id,
              nombre,
              apellidos
            )
          `)
          .eq('org_id', currentOrgData.id)
          .eq('activo', true)
          .in('role', ['manager', 'director', 'administrador', 'propietario'])
          .order('colaboradores(apellidos)');

        if (!error && data) {
          const uniqueManagers = Array.from(
            new Map(
              data.map(item => [
                item.colaborador_id,
                {
                  id: item.colaborador_id,
                  nombre: item.colaboradores.nombre,
                  apellidos: item.colaboradores.apellidos,
                  role: item.role
                }
              ])
            ).values()
          );
          setManagers(uniqueManagers);
        }
      } catch (error) {
        console.error('Error loading managers:', error);
      }
    };

    if (open) {
      loadManagers();
    }
  }, [open]);

  // Este useEffect ya no es necesario porque usamos useJobDepartments

  // Generar ID automáticamente si no estamos en modo edición
  useEffect(() => {
    if (!isEditMode && !formData.empleadoId) {
      setFormData(prev => ({ ...prev, empleadoId: generateEmployeeId() }));
    }
  }, [isEditMode]);

  // Auto-complete apellidosUso with nombre + apellidos
  useEffect(() => {
    if (!isEditMode && formData.nombre && formData.apellidos && !formData.apellidosUso) {
      setFormData(prev => ({ 
        ...prev, 
        apellidosUso: `${formData.nombre} ${formData.apellidos}` 
      }));
    }
  }, [formData.nombre, formData.apellidos, isEditMode]);

  // Populate form data when in edit mode
  useEffect(() => {
    if (isEditMode && colaboradorData) {
      
      // Get the job_id from colaboradorData (which should include jobs data)
      const jobId = colaboradorData.job_id || colaboradorData.jobs?.id || "";
      
      setFormData({
        nombre: colaboradorData.nombre || "",
        apellidos: colaboradorData.apellidos || "",
        apellidosUso: colaboradorData.apellidos_uso || "",
        empleadoId: colaboradorData.empleado_id || generateEmployeeId(),
        fechaNacimiento: colaboradorData.fecha_nacimiento || "",
        email: colaboradorData.email || "",
        telefonoMovil: colaboradorData.telefono_movil || "",
        paisMovil: "ES",
        telefonoFijo: colaboradorData.telefono_fijo || "",
        paisFijo: "ES",
        fechaInicioContrato: colaboradorData.fecha_inicio_contrato || "",
        horaInicioContrato: colaboradorData.hora_inicio_contrato || "",
        tipoContrato: colaboradorData.tipo_contrato || "",
        fechaFinContrato: colaboradorData.fecha_fin_contrato || "",
        tiempoTrabajoSemanal: colaboradorData.tiempo_trabajo_semanal?.toString() || "",
        jobId: jobId, // Use the properly extracted job_id
        responsableDirecto: colaboradorData.responsable_directo || "",
        esExtranjero: colaboradorData.es_extranjero || false,
        // Campos adicionales mapeados desde la BD
        direccion: colaboradorData.direccion || "",
        complementoDireccion: "",
        codigoPostal: colaboradorData.codigo_postal || "",
        ciudad: colaboradorData.ciudad || "",
        pais: colaboradorData.pais_residencia || "España",
        // Información bancaria
        nombreTitularCuenta: colaboradorData.banking_titular || "",
        iban: colaboradorData.banking_iban || "",
        bic: colaboradorData.banking_bic || "",
        numeroIdentificacionInterna: colaboradorData.banking_numero_identificacion || "",
        // Información de salud
        numeroSeguridadSocial: colaboradorData.numero_seguridad_social || "",
        personaConDiscapacidad: colaboradorData.minusvalia || false,
        ultimaRevisionMedica: colaboradorData.ultima_revision_medica || "",
        reconocimientoMedicoReforzado: colaboradorData.reconocimiento_medico_reforzado || false,
        exentoSeguroMedico: colaboradorData.exonerado_seguro_medico || false,
         nombreContactoEmergencia: colaboradorData.emergency_contact_nombre || "",
         apellidoContactoEmergencia: colaboradorData.emergency_contact_apellidos || "",
         relacionContactoEmergencia: colaboradorData.emergency_contact_relacion || "",
         telefonoMovilEmergencia: colaboradorData.emergency_contact_telefono_movil || "",
         telefonoFijoEmergencia: colaboradorData.emergency_contact_telefono_fijo || "",
        codigoPaisMovilEmergencia: "+34",
        codigoPaisFijoEmergencia: "+34",
        // Campos adicionales del formulario de edición
        genero: colaboradorData.genero || "",
        apellidosNacimiento: colaboradorData.apellidos_nacimiento || "",
        nacionalidad: colaboradorData.nacionalidad || "",
        provincia: colaboradorData.provincia || "",
        ciudadNacimiento: colaboradorData.ciudad_nacimiento || "",
        estadoCivil: colaboradorData.estado_civil || "",
        numeroPersonasDependientes: colaboradorData.numero_personas_dependientes?.toString() || "",
        fechaAntiguedad: colaboradorData.fecha_antiguedad || "",
        trabajadorExtranjeroPermiso: colaboradorData.trabajador_extranjero_permiso || false
      });
      
      // Set selected departments if colaborador has team assignments
      
      if (colaboradorData.jobs?.department) {
        // Find the department ID that matches the job's department
        const department = departments.find(dept => dept.value === colaboradorData.jobs?.department);
        if (department) {
          setSelectedDepartments([{ id: department.id, name: department.value }]);
        }
      } else if (colaboradorData.job_id) {
        // If no department in jobs but there's a job_id, try to find the department via job_departments
        // This will be handled by useEffect when jobs are loaded
      }
    }
  }, [isEditMode, colaboradorData, departments]);

  // Sincronizar selectedDepartments con los assignments del hook
  useEffect(() => {
    if (isEditMode && assignments && assignments.length > 0 && open) {
      const deptList = assignments.map(a => ({
        id: a.department_id,
        name: a.department_name
      }));
      setSelectedDepartments(deptList);
    }
  }, [assignments, isEditMode, open]);

  // useEffect para cargar departamentos asignados existentes desde colaborador_departments
  // DEPRECADO - ahora usamos useTeamAssignments hook
  /*
  useEffect(() => {
    const loadExistingDepartments = async () => {
      if (isEditMode && colaboradorData?.id && open) {
        
        try {
          const { data: assignedDepts, error } = await supabase
            .from('colaborador_departments')
            .select(`
              department_id,
              job_departments!inner(
                id,
                value
              )
            `)
            .eq('colaborador_id', colaboradorData.id)
            .eq('is_active', true);

          if (error) {
            console.error('❌ Error cargando departamentos asignados:', error);
            return;
          }

          if (assignedDepts && assignedDepts.length > 0) {
            const deptList = assignedDepts.map(assigned => ({
              id: assigned.department_id,
              name: (assigned.job_departments as any).value
            }));
            
            setSelectedDepartments(deptList);
          } else {
            // Solo limpiar si no hay departamentos asignados
            setSelectedDepartments([]);
          }
        } catch (error) {
          console.error('❌ Error inesperado cargando departamentos:', error);
        }
      }
    };

    loadExistingDepartments();
  }, [isEditMode, colaboradorData?.id, open]);
  */

  // useEffect adicional para manejar la inicialización del departamento cuando se cargan los trabajos
  useEffect(() => {
    if (isEditMode && colaboradorData?.job_id && jobs.length > 0 && selectedDepartments.length === 0 && open) {
      
      // Buscar el trabajo específico y obtener su department_id
      const currentJob = jobs.find(job => job.id === colaboradorData.job_id);
      if (currentJob?.department_id) {
        const department = departments.find(dept => dept.id === currentJob.department_id);
        if (department) {
          setSelectedDepartments([{ id: department.id, name: department.value }]);
        }
      }
    }
  }, [isEditMode, colaboradorData?.job_id, jobs, selectedDepartments.length, departments, open]);

  const tiposContrato = [
    "Sin especificar",
    "Contrato indefinido",
    "Contrato temporal", 
    "Práctica profesional",
    "Contrato de formación",
    "Contrato fijo discontinuo",
    "Extra (colaborador externo)",
    "Empleado trabajo temporal (ETT)"
  ];

  const generateEmployeeId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${timestamp}${randomNum}`;
  };

  const handleSubmit = async () => {
    // Validaciones básicas obligatorias
    const requiredFields = [];
    
    if (!formData.nombre) requiredFields.push("nombre");
    if (!formData.apellidos) requiredFields.push("apellidos");
    if (!formData.apellidosUso) requiredFields.push("nombre a mostrar");
    if (!formData.email) requiredFields.push("correo electrónico");
    if (!formData.fechaInicioContrato) requiredFields.push("fecha de inicio de contrato");
    if (!formData.horaInicioContrato) requiredFields.push("hora de inicio de contrato");
    if (!formData.tipoContrato || formData.tipoContrato === "Sin especificar") requiredFields.push("tipo de contrato");
    if (!formData.tiempoTrabajoSemanal) requiredFields.push("tiempo de trabajo semanal");
    // Solo requerir equipo si no se ha seleccionado ninguno
    if (selectedDepartments.length === 0) requiredFields.push("al menos un equipo");
    
    // Si el contrato NO es indefinido, fecha de fin es obligatoria
    if (formData.tipoContrato && formData.tipoContrato !== "Contrato indefinido" && !formData.fechaFinContrato) {
      requiredFields.push("fecha de fin del contrato");
    }

    if (requiredFields.length > 0) {
      toast({
        title: "Campos obligatorios faltantes",
        description: `Por favor completa: ${requiredFields.join(", ")}.`,
        variant: "destructive"
      });
      return;
    }

    // Puesto de trabajo es opcional, no mostrar warning
    
    // Si llegamos aquí, podemos proceder con el submit
    await doSubmitWithoutWarning();
  };

  const doSubmitWithoutWarning = async () => {
    // Validar tiempo de trabajo semanal
    const horasSemanales = parseInt(formData.tiempoTrabajoSemanal);
    if (isNaN(horasSemanales) || horasSemanales < 1 || horasSemanales > 40) {
      toast({
        title: "Error en tiempo de trabajo",
        description: "El tiempo de trabajo semanal debe ser entre 1 y 40 horas.",
        variant: "destructive"
      });
      return;
    }

    try {
      const finalEmpleadoId = formData.empleadoId || generateEmployeeId();

      // Map form data to normalized structure
      const { baseData, healthData, emergencyContactData, bankingData } = mapLegacyFormData({
        ...formData,
        empleadoId: finalEmpleadoId
      });

      // Set the org_id - preservar el original en modo edición
      if (isEditMode && colaboradorData?.org_id) {
        // En modo edición, SIEMPRE preservar el org_id original del colaborador
        baseData.org_id = colaboradorData.org_id;
      } else if (organizations && organizations.length > 0) {
        // Solo para nuevos colaboradores, usar la primera organización disponible
        baseData.org_id = organizations[0].id;
      } else {
        toast({
          title: "Error",
          description: "No se pudo determinar la organización",
          variant: "destructive"
        });
        return;
      }

      // Add selected departments to baseData
      baseData.selectedDepartments = selectedDepartments.map(dept => dept.id);

      if (isEditMode && colaboradorData?.id) {
        // DETECTAR CAMBIO DE EMAIL
        const emailHasChanged = colaboradorData.email && 
                               formData.email && 
                               colaboradorData.email.toLowerCase() !== formData.email.toLowerCase();
        
        if (emailHasChanged) {
        }
        
        // Si se está usando selección por departamento, limpiar job_id del baseData para evitar conflictos
        if (selectedDepartment) {
          delete baseData.job_id;
        }
        
        // Update existing colaborador using normalized service
        await createOrUpdateColaborador(
          baseData,
          healthData,
          emergencyContactData,
          bankingData,
          colaboradorData.id
        );

        // Department assignments are now handled in the service

        toast({
          title: "Colaborador actualizado",
          description: `${formData.nombre} ${formData.apellidos} ha sido actualizado exitosamente.`,
        });

        // Log the activity
        await logActivity({
          action: `ha modificado la información de ${formData.nombre} ${formData.apellidos}`,
          entityType: 'colaborador',
          entityId: colaboradorData.id,
          entityName: `${formData.nombre} ${formData.apellidos}`,
          establishment: currentOrganizationName || 'GOTHAM'
        });

        // Si el email cambió, registrar un log específico para reactivar el botón Invitar
        if (emailHasChanged) {
          await logActivity({
            action: 'email_changed',
            entityType: 'colaborador',
            entityId: colaboradorData.id,
            entityName: `${formData.nombre} ${formData.apellidos}`,
            establishment: currentOrganizationName || 'GOTHAM',
            details: {
              old_email: colaboradorData.email,
              new_email: formData.email
            }
          });
          
          toast({
            title: "Email actualizado",
            description: "El email ha sido modificado. Puedes enviar una nueva invitación desde el perfil del colaborador.",
          });
        }

      } else {
        // Create new colaborador using normalized service
        baseData.status = 'activo';
        
        const insertedColaborador = await createOrUpdateColaborador(
          baseData,
          healthData,
          emergencyContactData,
          bankingData
        );

        toast({
          title: "Colaborador creado",
          description: `${formData.nombre} ${formData.apellidos} ha sido creado exitosamente con ID: ${finalEmpleadoId}`,
        });

        // Log the activity
        await logActivity({
          action: `ha añadido un nuevo colaborador: ${formData.nombre} ${formData.apellidos}`,
          entityType: 'colaborador',
          entityId: insertedColaborador.id,
          entityName: `${formData.nombre} ${formData.apellidos}`,
          establishment: currentOrganizationName || 'GOTHAM'
        });

        // Department assignments are handled in the service now

        // Assign specific job if selected
        if (formData.jobId) {
          const { error: jobError } = await supabase
            .from('colaboradores')
            .update({ job_id: formData.jobId })
            .eq('id', insertedColaborador.id);

          if (jobError) {
            console.error('Error assigning job:', jobError);
          }
        }

        // 3. Auto-add to calendar based on start date
        if (baseData.fecha_inicio_contrato && insertedColaborador.id) {
          const startDate = new Date(baseData.fecha_inicio_contrato);
          const today = new Date();
          
          // Solo añadir si la fecha de inicio es dentro de los próximos 30 días
          const daysDiff = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff >= -7 && daysDiff <= 30) { // Últimos 7 días o próximos 30 días
            try {
              const existingEmployees = JSON.parse(localStorage.getItem('calendar-employees') || '[]');
              const isAlreadyInCalendar = existingEmployees.some(emp => emp.id === insertedColaborador.id);
              
              if (!isAlreadyInCalendar) {
                const calendarEmployee = {
                  id: insertedColaborador.id,
                  name: `${baseData.nombre} ${baseData.apellidos}`,
                  nombre: baseData.nombre,
                  apellidos: baseData.apellidos,
                  start_date: baseData.fecha_inicio_contrato
                };
                
                existingEmployees.push(calendarEmployee);
                localStorage.setItem('calendar-employees', JSON.stringify(existingEmployees));
                
                toast({
                  title: "Añadido al calendario",
                  description: `${baseData.nombre} ${baseData.apellidos} ha sido añadido automáticamente al calendario de turnos.`,
                });
              }
            } catch (error) {
              console.error('Error adding to calendar:', error);
            }
          }
        }
      }

      // Reset the warning state
      setTempJobWarningAccepted(false);

      // Llamar callback para refrescar los datos ANTES de cerrar el diálogo
      if (isEditMode && onColaboradorUpdated) {
            // El componente padre (ColaboradorDetail) se encarga de refrescar todas las asignaciones
            await onColaboradorUpdated();
      } else if (!isEditMode && onColaboradorAdded) {
        await onColaboradorAdded();
      }

      // Close sheet DESPUÉS de actualizar los datos
      onOpenChange(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      
      // Manejo específico de errores de base de datos
      let errorMessage = "Error inesperado al guardar el colaborador";
      
      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
          case '23505':
            if (error.message?.includes('colaboradores_empleado_id_key')) {
              errorMessage = `El ID de empleado "${formData.empleadoId}" ya está registrado. Por favor, usa un ID diferente.`;
            } else if (error.message?.includes('colaboradores_org_email_uniq')) {
              errorMessage = `El email "${formData.email}" ya está registrado en esta organización. Por favor, usa un email diferente.`;
            } else {
              errorMessage = "Ya existe un colaborador con estos datos. Verifica que el ID de empleado y email sean únicos.";
            }
            break;
          default:
            errorMessage = `Error de base de datos: ${error.message || 'Error desconocido'}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Función para resetear el formulario cuando se cierre
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isEditMode) {
      // Solo resetear cuando se cierra y NO estamos en modo edición
      setSelectedDepartments([]);
      setTempJobWarningAccepted(false);
      setFormData({
        nombre: "",
        apellidos: "",
        apellidosUso: "",
        empleadoId: "",
        fechaNacimiento: "",
        email: "",
        telefonoMovil: "",
        paisMovil: "ES",
        telefonoFijo: "",
        paisFijo: "ES",
        fechaInicioContrato: "",
        horaInicioContrato: "09:00",
        tipoContrato: "Contrato indefinido",
        fechaFinContrato: "",
        tiempoTrabajoSemanal: "",
        jobId: "",
        responsableDirecto: "",
        esExtranjero: false,
        direccion: "",
        complementoDireccion: "",
        codigoPostal: "",
        ciudad: "",
        pais: "España",
        nombreTitularCuenta: "",
        iban: "",
        bic: "",
        numeroIdentificacionInterna: "",
        numeroSeguridadSocial: "",
        personaConDiscapacidad: false,
        ultimaRevisionMedica: "",
        reconocimientoMedicoReforzado: false,
        exentoSeguroMedico: false,
        nombreContactoEmergencia: "",
        apellidoContactoEmergencia: "",
        relacionContactoEmergencia: "",
        telefonoMovilEmergencia: "",
        telefonoFijoEmergencia: "",
        codigoPaisMovilEmergencia: "+34",
        codigoPaisFijoEmergencia: "+34",
        genero: "",
        apellidosNacimiento: "",
        nacionalidad: "",
        provincia: "",
        ciudadNacimiento: "",
        estadoCivil: "",
        numeroPersonasDependientes: "",
        fechaAntiguedad: "",
        trabajadorExtranjeroPermiso: false
      });
    } else if (!isOpen) {
      // En modo edición, solo resetear las flags temporales
      setTempJobWarningAccepted(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold">
            {(isEditMode || showOnlyPersonalInfo) ? "Información Personal" : "Añadir nuevo colaborador"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {(isEditMode || showOnlyPersonalInfo)
              ? "Formulario para editar información personal del colaborador"
              : "Formulario para añadir un nuevo colaborador al sistema"}
          </SheetDescription>
        </SheetHeader>

        {isEditMode ? (
          // Versión con tabs para editar información
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="datos-personales">Datos personales</TabsTrigger>
              <TabsTrigger value="contacto">Contacto</TabsTrigger>
              <TabsTrigger value="salud">Salud</TabsTrigger>
            </TabsList>

            <TabsContent value="datos-personales" className="space-y-4">
              {/* Contenido de Datos Personales */}
              <FormField label="Nombre" required>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Introduce el nombre"
                />
              </FormField>

              <FormField label="Apellidos" required>
                <Input
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Introduce los apellidos"
                />
              </FormField>

              <FormField label="Nombre a mostrar" required>
                <Input
                  value={formData.apellidosUso}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidosUso: e.target.value }))}
                  placeholder="Nombre que aparecerá en los turnos"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nombre que aparecerá en el turno (se completa automáticamente con Nombre + Apellidos)
                </p>
              </FormField>

              <FormField label="ID de colaborador interno">
                <Input
                  value={formData.empleadoId}
                  placeholder="ID generado automáticamente"
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID único generado automáticamente por el sistema
                </p>
              </FormField>

              <FormField label="Fecha de nacimiento">
                <Input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>

              {/* Campos adicionales solo en modo edición */}
              {isEditMode && (
                <>
                  <FormField label="Género">
                    <Select value={formData.genero} onValueChange={(value) => setFormData(prev => ({ ...prev, genero: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                        <SelectItem value="no-especificar">Prefiero no especificar</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Apellidos de nacimiento">
                    <Input
                      value={formData.apellidosNacimiento}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellidosNacimiento: e.target.value }))}
                      placeholder="Apellidos de nacimiento"
                    />
                  </FormField>

                  <FormField label="Nacionalidad">
                    <Select value={formData.nacionalidad} onValueChange={(value) => setFormData(prev => ({ ...prev, nacionalidad: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="española">Española</SelectItem>
                        <SelectItem value="alemana">Alemana</SelectItem>
                        <SelectItem value="francesa">Francesa</SelectItem>
                        <SelectItem value="italiana">Italiana</SelectItem>
                        <SelectItem value="británica">Británica</SelectItem>
                        <SelectItem value="otra">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="País de nacimiento">
                    <Select value={formData.pais} onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alemania" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="España">🇪🇸 España</SelectItem>
                        <SelectItem value="Alemania">🇩🇪 Alemania</SelectItem>
                        <SelectItem value="Francia">🇫🇷 Francia</SelectItem>
                        <SelectItem value="Italia">🇮🇹 Italia</SelectItem>
                        <SelectItem value="Reino Unido">🇬🇧 Reino Unido</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Provincia">
                    <Select value={formData.provincia} onValueChange={(value) => setFormData(prev => ({ ...prev, provincia: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="99 - Extranjero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="99 - Extranjero">99 - Extranjero</SelectItem>
                        <SelectItem value="28 - Madrid">28 - Madrid</SelectItem>
                        <SelectItem value="08 - Barcelona">08 - Barcelona</SelectItem>
                        <SelectItem value="35 - Las Palmas">35 - Las Palmas</SelectItem>
                        <SelectItem value="38 - Santa Cruz de Tenerife">38 - Santa Cruz de Tenerife</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Ciudad de nacimiento">
                    <Input
                      value={formData.ciudadNacimiento}
                      onChange={(e) => setFormData(prev => ({ ...prev, ciudadNacimiento: e.target.value }))}
                      placeholder="Ciudad"
                    />
                  </FormField>

                  <FormField label="Estado civil">
                    <Select value={formData.estadoCivil} onValueChange={(value) => setFormData(prev => ({ ...prev, estadoCivil: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Soltero/a" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soltero">Soltero/a</SelectItem>
                        <SelectItem value="casado">Casado/a</SelectItem>
                        <SelectItem value="divorciado">Divorciado/a</SelectItem>
                        <SelectItem value="viudo">Viudo/a</SelectItem>
                        <SelectItem value="pareja-de-hecho">Pareja de hecho</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Número de personas dependientes">
                    <Input
                      type="number"
                      value={formData.numeroPersonasDependientes}
                      onChange={(e) => setFormData(prev => ({ ...prev, numeroPersonasDependientes: e.target.value }))}
                      placeholder="0"
                      min="0"
                    />
                  </FormField>

                  <FormField label="Fecha de antigüedad">
                    <Input
                      type="date"
                      value={formData.fechaAntiguedad}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaAntiguedad: e.target.value }))}
                    />
                  </FormField>

                </>
              )}

              {/* Información de Contacto en la misma pestaña */}
              <div className="pt-4 border-t border-border/20">
                <h4 className="text-md font-medium text-foreground mb-4">Información de Contacto</h4>
                
                <div className="space-y-4">
                  <FormField label="Correo electrónico" required>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ejemplo@hotel.com"
                    />
                  </FormField>

                  <FormField label="Teléfono móvil">
                    <div className="flex gap-2">
                      <Select value={formData.paisMovil} onValueChange={handlePaisMovilChange}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ES">🇪🇸 +34</SelectItem>
                          <SelectItem value="FR">🇫🇷 +33</SelectItem>
                          <SelectItem value="DE">🇩🇪 +49</SelectItem>
                          <SelectItem value="IT">🇮🇹 +39</SelectItem>
                          <SelectItem value="GB">🇬🇧 +44</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="flex-1"
                        value={formData.telefonoMovil}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefonoMovil: e.target.value }))}
                        placeholder={`${countryToPhoneCode[formData.paisMovil]} 628 123 456`}
                      />
                    </div>
                  </FormField>

                  <FormField label="Teléfono fijo (opcional)">
                    <div className="flex gap-2">
                      <Select value={formData.paisFijo} onValueChange={handlePaisFijoChange}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ES">🇪🇸 +34</SelectItem>
                          <SelectItem value="FR">🇫🇷 +33</SelectItem>
                          <SelectItem value="DE">🇩🇪 +49</SelectItem>
                          <SelectItem value="IT">🇮🇹 +39</SelectItem>
                          <SelectItem value="GB">🇬🇧 +44</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="flex-1"
                        value={formData.telefonoFijo}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefonoFijo: e.target.value }))}
                        placeholder={`${countryToPhoneCode[formData.paisFijo]} 928 123 456`}
                      />
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Información de Contrato en la misma pestaña */}
              <div className="pt-4 border-t border-border/20">
                <h4 className="text-md font-medium text-foreground mb-4">Información de Contrato</h4>
                
                <div className="space-y-4">
                   <FormField label="Fecha de inicio de contrato" required>
                     <Input
                       type="date"
                       value={formData.fechaInicioContrato}
                       onChange={(e) => setFormData(prev => ({ ...prev, fechaInicioContrato: e.target.value }))}
                       placeholder="dd/mm/aaaa"
                     />
                   </FormField>

                   <FormField label="Hora de inicio de contrato" required>
                     <Input
                       type="time"
                       value={formData.horaInicioContrato}
                       onChange={(e) => setFormData(prev => ({ ...prev, horaInicioContrato: e.target.value }))}
                       placeholder="09:00"
                     />
                   </FormField>

                    <FormField label="Tipo de contrato" required>
                      <Select 
                        value={formData.tipoContrato} 
                        onValueChange={(value) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            tipoContrato: value,
                            // Limpiar fecha de fin si se selecciona contrato indefinido
                            fechaFinContrato: value === "Contrato indefinido" ? "" : prev.fechaFinContrato
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de contrato" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposContrato.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))}
                       </SelectContent>
                     </Select>
                   </FormField>

                   <FormField 
                     label="Fecha de fin del contrato" 
                     required={formData.tipoContrato !== "Contrato indefinido"}
                   >
                     <Input
                       type="date"
                       value={formData.fechaFinContrato}
                       onChange={(e) => setFormData(prev => ({ ...prev, fechaFinContrato: e.target.value }))}
                       placeholder="dd/mm/aaaa"
                       disabled={formData.tipoContrato === "Contrato indefinido"}
                       className={formData.tipoContrato === "Contrato indefinido" ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                     />
                     {formData.tipoContrato === "Contrato indefinido" && (
                       <p className="text-xs text-muted-foreground mt-1">
                         No requerido para contratos indefinidos
                       </p>
                     )}
                   </FormField>

                 {/* ASIGNACIÓN DE EQUIPOS */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                     ASIGNACIÓN DE EQUIPOS
                   </h3>

                    <FormField label="Equipo" required={true}>
                     <div className="space-y-3">
                       <div data-department-select>
                         <Select 
                           value="" 
                           onValueChange={(value) => {
                             if (value && !selectedDepartments.find(d => d.id === value)) {
                               const department = departments.find(d => d.id === value);
                               if (department) {
                                 setSelectedDepartments(prev => [...prev, { id: department.id, name: department.value }]);
                               }
                             }
                           }}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Seleccionar equipo" />
                           </SelectTrigger>
                           <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                             {departments
                               .filter(dept => !selectedDepartments.find(sd => sd.id === dept.id))
                               .map((dept) => (
                                 <SelectItem key={dept.id} value={dept.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                   {dept.value}
                                 </SelectItem>
                               ))}
                           </SelectContent>
                         </Select>
                       </div>

                       {selectedDepartments.length > 0 && (
                         <div className="flex flex-wrap gap-2">
                           {selectedDepartments.map((dept) => (
                             <Badge key={dept.id} variant="secondary" className="flex items-center gap-1">
                               {dept.name}
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDepartments(prev => {
                                      const newDepts = prev.filter(d => d.id !== dept.id);
                                      return newDepts;
                                    });
                                    // Also clear the job when removing department
                                    setFormData(prev => ({ ...prev, jobId: "" }));
                                  }}
                                />
                              </Badge>
                           ))}
                         </div>
                       )}

                       {departments.length === 0 && (
                         <p className="text-sm text-muted-foreground">
                           No hay equipos creados. Crea equipos en Configuración → Puestos → Equipos
                         </p>
                       )}
                     </div>
                   </FormField>

                   {/* Selección de puesto de trabajo */}
                   {selectedDepartments.length > 0 && (
                     <FormField label="Puesto de trabajo" required={false}>
                       <Select value={formData.jobId} onValueChange={(value) => setFormData(prev => ({ ...prev, jobId: value }))}>
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar puesto de trabajo" />
                         </SelectTrigger>
                         <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                           {jobs
                             .filter(job => selectedDepartments.some(dept => dept.id === job.department_id))
                             .map((job) => (
                               <SelectItem key={job.id} value={job.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                 {job.title}
                               </SelectItem>
                             ))}
                         </SelectContent>
                       </Select>
                     </FormField>
                    )}

                    {/* AFILIACIÓN */}
                    <div className="space-y-4 mt-6">
                      <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                        AFILIACIÓN
                      </h3>

                      <FormField label="Establecimiento por defecto" required>
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="text-sm text-muted-foreground">
                            {colaboradorData?.org_id 
                              ? (organizations.find(org => org.id === colaboradorData.org_id)?.name || 'Organización no encontrada')
                              : (currentOrganizationName || 'Organización actual')
                            }
                          </span>
                        </div>
                      </FormField>

                      <FormField label="Tiempo de trabajo semanal (en horas)" required>
                        <Input
                          type="number"
                          value={formData.tiempoTrabajoSemanal}
                          onChange={(e) => setFormData(prev => ({ ...prev, tiempoTrabajoSemanal: e.target.value }))}
                          placeholder="Introducir número de horas"
                          min="1"
                          max="48"
                        />
                      </FormField>

                      <FormField label="">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-foreground">
                              Responsable directo
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">El responsable directo seleccionado, recibirá notificaciones de las solicitudes de ausencia de este colaborador</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select value={formData.responsableDirecto} onValueChange={(value) => setFormData(prev => ({ ...prev, responsableDirecto: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar el responsable directo" />
                            </SelectTrigger>
                            <SelectContent>
                              {managers.length === 0 ? (
                                <SelectItem value="_none" disabled>No hay managers disponibles</SelectItem>
                              ) : (
                                managers.map((manager) => (
                                  <SelectItem key={manager.id} value={manager.id}>
                                    {manager.apellidos}, {manager.nombre} - {manager.role === 'manager' ? 'Manager' : manager.role === 'director' ? 'Director' : manager.role === 'administrador' ? 'Admin' : 'Owner'}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormField>
                    </div>
                  </div>

                    <FormField label="">
                    </FormField>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contacto" className="space-y-4">
              {/* CONTACTO */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">CONTACTO</h4>
                
                <FormField label="Correo electrónico">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Teléfono móvil">
                  <div className="flex gap-2">
                    <Select value={formData.paisMovil} onValueChange={(value) => setFormData(prev => ({ ...prev, paisMovil: value }))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ES">🇪🇸</SelectItem>
                        <SelectItem value="FR">🇫🇷</SelectItem>
                        <SelectItem value="DE">🇩🇪</SelectItem>
                        <SelectItem value="IT">🇮🇹</SelectItem>
                        <SelectItem value="GB">🇬🇧</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={formData.telefonoMovil}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefonoMovil: e.target.value }))}
                      placeholder="+44"
                    />
                  </div>
                </FormField>

                <FormField label="Teléfono fijo">
                  <div className="flex gap-2">
                    <Select value={formData.paisFijo} onValueChange={(value) => setFormData(prev => ({ ...prev, paisFijo: value }))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ES">🇪🇸</SelectItem>
                        <SelectItem value="FR">🇫🇷</SelectItem>
                        <SelectItem value="DE">🇩🇪</SelectItem>
                        <SelectItem value="IT">🇮🇹</SelectItem>
                        <SelectItem value="GB">🇬🇧</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={formData.telefonoFijo}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefonoFijo: e.target.value }))}
                      placeholder="+44"
                    />
                  </div>
                </FormField>

                <FormField label="Dirección">
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Complemento de dirección">
                  <Input
                    value={formData.complementoDireccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, complementoDireccion: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Código postal" className="relative">
                  <Input
                    value={formData.codigoPostal}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigoPostal: e.target.value }))}
                    placeholder="OPAE (solo FR)"
                    className="pr-20"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                    OPAE (solo FR)
                  </span>
                </FormField>

                <FormField label="Ciudad">
                  <Input
                    value={formData.ciudad}
                    onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="País">
                  <Select value={formData.pais} onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="España">España</SelectItem>
                      <SelectItem value="Francia">Francia</SelectItem>
                      <SelectItem value="Alemania">Alemania</SelectItem>
                      <SelectItem value="Italia">Italia</SelectItem>
                      <SelectItem value="Reino Unido">Reino Unido</SelectItem>
                      <SelectItem value="Portugal">Portugal</SelectItem>
                      <SelectItem value="Marruecos">Marruecos</SelectItem>
                      <SelectItem value="Argentina">Argentina</SelectItem>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                      <SelectItem value="Venezuela">Venezuela</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              {/* INFORMACIÓN BANCARIA */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">INFORMACIÓN BANCARIA</h4>
                
                <FormField label="Nombre del titular de la cuenta">
                  <Input
                    value={formData.nombreTitularCuenta}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreTitularCuenta: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="IBAN">
                  <Input
                    value={formData.iban}
                    onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="BIC">
                  <Input
                    value={formData.bic}
                    onChange={(e) => setFormData(prev => ({ ...prev, bic: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Número de identificación empleado(a)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">Número de identificación interna</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary underline"
                      onClick={() => {
                        // Generar automáticamente un número
                        const autoNumber = Math.floor(Math.random() * 1000000000).toString();
                        setFormData(prev => ({ ...prev, numeroIdentificacionInterna: autoNumber }));
                      }}
                    >
                      Cambiar a generación automática
                    </Button>
                  </div>
                  <Input
                    value={formData.numeroIdentificacionInterna}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroIdentificacionInterna: e.target.value }))}
                    placeholder="1234567890"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="salud" className="space-y-4">
              {/* SEGURIDAD SOCIAL */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">SEGURIDAD SOCIAL</h4>
                
                <FormField label="Nº de seguridad social">
                  <Input
                    value={formData.numeroSeguridadSocial}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroSeguridadSocial: e.target.value }))}
                    placeholder="XXXX XXXX XXXX"
                  />
                </FormField>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    Persona con discapacidad
                  </Label>
                  <Switch
                    checked={formData.personaConDiscapacidad}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, personaConDiscapacidad: checked }))}
                  />
                </div>
              </div>

              {/* EXAMEN MÉDICO */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">EXAMEN MÉDICO</h4>
                
                <FormField label="Última revisión médica realizada">
                  <Input
                    type="date"
                    value={formData.ultimaRevisionMedica}
                    onChange={(e) => setFormData(prev => ({ ...prev, ultimaRevisionMedica: e.target.value }))}
                    placeholder="dd/mm/aaaa"
                  />
                </FormField>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reconocimiento-medico"
                    checked={formData.reconocimientoMedicoReforzado}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reconocimientoMedicoReforzado: checked as boolean }))}
                  />
                  <Label 
                    htmlFor="reconocimiento-medico" 
                    className="text-sm text-foreground cursor-pointer"
                  >
                    Reconocimiento médico reforzado
                  </Label>
                </div>

                {/* Próxima cita médica */}
                {formData.ultimaRevisionMedica && (
                  <div className="flex items-center gap-2 mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-700">
                      Próxima cita médica antes del {(() => {
                        const lastReview = new Date(formData.ultimaRevisionMedica);
                        const yearsToAdd = formData.reconocimientoMedicoReforzado ? 3 : 5;
                        const nextAppointment = new Date(lastReview);
                        nextAppointment.setFullYear(lastReview.getFullYear() + yearsToAdd);
                        return nextAppointment.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* MUTUALIDAD */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">MUTUALIDAD</h4>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    El empleado está exento de seguro médico
                  </Label>
                  <Switch
                    checked={formData.exentoSeguroMedico}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, exentoSeguroMedico: checked }))}
                  />
                </div>
              </div>

              {/* PERSONA DE CONTACTO EN CASO DE EMERGENCIA */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">PERSONA DE CONTACTO EN CASO DE EMERGENCIA</h4>
                
                <FormField label="Nombre del contacto de emergencia">
                  <Input
                    value={formData.nombreContactoEmergencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreContactoEmergencia: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Apellido del contacto de emergencia">
                  <Input
                    value={formData.apellidoContactoEmergencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, apellidoContactoEmergencia: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Relación con el contacto de emergencia">
                  <Select value={formData.relacionContactoEmergencia} onValueChange={(value) => setFormData(prev => ({ ...prev, relacionContactoEmergencia: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="padre">Padre</SelectItem>
                      <SelectItem value="madre">Madre</SelectItem>
                      <SelectItem value="hermano">Hermano/a</SelectItem>
                      <SelectItem value="conyugue">Cónyuge</SelectItem>
                      <SelectItem value="pareja">Pareja</SelectItem>
                      <SelectItem value="hijo">Hijo/a</SelectItem>
                      <SelectItem value="abuelo">Abuelo/a</SelectItem>
                      <SelectItem value="tio">Tío/a</SelectItem>
                      <SelectItem value="primo">Primo/a</SelectItem>
                      <SelectItem value="amigo">Amigo/a</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Teléfono móvil del contacto de emergencia">
                  <div className="flex gap-2">
                    <Select value={formData.codigoPaisMovilEmergencia} onValueChange={handleCodigoPaisMovilEmergenciaChange}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+34">🇪🇸</SelectItem>
                        <SelectItem value="+33">🇫🇷</SelectItem>
                        <SelectItem value="+49">🇩🇪</SelectItem>
                        <SelectItem value="+39">🇮🇹</SelectItem>
                        <SelectItem value="+44">🇬🇧</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={formData.telefonoMovilEmergencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefonoMovilEmergencia: e.target.value }))}
                      placeholder={formData.codigoPaisMovilEmergencia}
                    />
                  </div>
                </FormField>

                <FormField label="Teléfono fijo del contacto de emergencia">
                  <div className="flex gap-2">
                    <Select value={formData.codigoPaisFijoEmergencia} onValueChange={handleCodigoPaisFijoEmergenciaChange}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+34">🇪🇸</SelectItem>
                        <SelectItem value="+33">🇫🇷</SelectItem>
                        <SelectItem value="+49">🇩🇪</SelectItem>
                        <SelectItem value="+39">🇮🇹</SelectItem>
                        <SelectItem value="+44">🇬🇧</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={formData.telefonoFijoEmergencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefonoFijoEmergencia: e.target.value }))}
                      placeholder={formData.codigoPaisFijoEmergencia}
                    />
                  </div>
                </FormField>
              </div>
            </TabsContent>

            {/* Button para versión con tabs */}
            <div className="pt-6 border-t border-border/40">
              <Button
                onClick={handleSubmit}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Actualizar
              </Button>
            </div>
          </Tabs>
        ) : (
          // Versión lineal para añadir nuevo colaborador
          <div className="space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              {!showOnlyPersonalInfo && (
                <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                  Información Personal
                </h3>
              )}

              <FormField label="Nombre" required>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Introduce el nombre"
                />
              </FormField>

              <FormField label="Apellidos" required>
                <Input
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Introduce los apellidos"
                />
              </FormField>

              <FormField label="Nombre a mostrar" required>
                <Input
                  value={formData.apellidosUso}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidosUso: e.target.value }))}
                  placeholder="Nombre que aparecerá en los turnos"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nombre que aparecerá en el turno (se completa automáticamente con Nombre + Apellidos)
                </p>
              </FormField>

              <FormField label="ID de colaborador interno">
                <Input
                  value={formData.empleadoId}
                  placeholder="ID generado automáticamente"
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID único generado automáticamente por el sistema
                </p>
              </FormField>

              <FormField label="Fecha de nacimiento">
                <Input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                Información de Contacto
              </h3>

              <FormField label="Correo electrónico" required>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@hotel.com"
                />
              </FormField>

              <FormField label="Teléfono móvil">
                <div className="flex gap-2">
                  <Select value={formData.paisMovil} onValueChange={(value) => setFormData(prev => ({ ...prev, paisMovil: value }))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ES">🇪🇸 +34</SelectItem>
                      <SelectItem value="FR">🇫🇷 +33</SelectItem>
                      <SelectItem value="DE">🇩🇪 +49</SelectItem>
                      <SelectItem value="IT">🇮🇹 +39</SelectItem>
                      <SelectItem value="GB">🇬🇧 +44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="flex-1"
                    value={formData.telefonoMovil}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefonoMovil: e.target.value }))}
                    placeholder="628 123 456"
                  />
                </div>
              </FormField>

              <FormField label="Teléfono fijo (opcional)">
                <div className="flex gap-2">
                  <Select value={formData.paisFijo} onValueChange={(value) => setFormData(prev => ({ ...prev, paisFijo: value }))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ES">🇪🇸 +34</SelectItem>
                      <SelectItem value="FR">🇫🇷 +33</SelectItem>
                      <SelectItem value="DE">🇩🇪 +49</SelectItem>
                      <SelectItem value="IT">🇮🇹 +39</SelectItem>
                      <SelectItem value="GB">🇬🇧 +44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="flex-1"
                    value={formData.telefonoFijo}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefonoFijo: e.target.value }))}
                    placeholder="928 123 456"
                  />
                </div>
              </FormField>
            </div>

            {/* Información de Contrato */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                Información de Contrato
              </h3>

              <FormField label="Fecha de inicio de contrato" required>
                <Input
                  type="date"
                  value={formData.fechaInicioContrato}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaInicioContrato: e.target.value }))}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>

              <FormField label="Hora de inicio de contrato" required>
                <Input
                  type="time"
                  value={formData.horaInicioContrato}
                  onChange={(e) => setFormData(prev => ({ ...prev, horaInicioContrato: e.target.value }))}
                  placeholder="09:00"
                />
              </FormField>

               <FormField label="Tipo de contrato" required>
                 <Select 
                   value={formData.tipoContrato} 
                   onValueChange={(value) => {
                     setFormData(prev => ({ 
                       ...prev, 
                       tipoContrato: value,
                       // Limpiar fecha de fin si se selecciona contrato indefinido
                       fechaFinContrato: value === "Contrato indefinido" ? "" : prev.fechaFinContrato
                     }));
                   }}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Selecciona el tipo de contrato" />
                   </SelectTrigger>
                   <SelectContent>
                     {tiposContrato.map((tipo) => (
                       <SelectItem key={tipo} value={tipo}>
                         {tipo}
                       </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField 
                label="Fecha de fin del contrato" 
                required={formData.tipoContrato !== "Contrato indefinido"}
              >
                <Input
                  type="date"
                  value={formData.fechaFinContrato}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaFinContrato: e.target.value }))}
                  placeholder="dd/mm/aaaa"
                  disabled={formData.tipoContrato === "Contrato indefinido"}
                  className={formData.tipoContrato === "Contrato indefinido" ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                />
                {formData.tipoContrato === "Contrato indefinido" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No requerido para contratos indefinidos
                  </p>
                )}
              </FormField>

               {/* ASIGNACIÓN DE EQUIPOS */}
               <div className="space-y-4">
                 <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                   ASIGNACIÓN DE EQUIPOS
                 </h3>

                 <FormField label="Equipo" required={true}>
                    <div className="space-y-3">
                       <Select value={selectedDepartment} data-department-select onValueChange={async (value) => {
                        
                        // Verificar si el equipo ya está seleccionado
                        const isAlreadySelected = selectedDepartments.some(dept => dept.id === value);
                        if (isAlreadySelected) {
                          toast({
                            title: "Equipo ya seleccionado",
                            description: "Este equipo ya está asignado al colaborador",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Verificar si el equipo tiene puestos de trabajo
                        const { data: jobs, error: jobsError } = await supabase
                          .from('jobs')
                          .select('id')
                          .eq('department_id', value)
                          .limit(1);

                        const hasJob = !jobsError && jobs && jobs.length > 0;
                        const departmentName = departments.find(d => d.id === value)?.value || '';
                        
                        if (!hasJob) {
                          // Solo mostrar una advertencia sutil sin bloquear el flujo
                          console.warn(`⚠️ No hay puestos de trabajo definidos en el equipo "${departmentName}"`);
                          
                          // Continuar añadiendo el equipo directamente
                          setSelectedDepartments(prev => [...prev, { id: value, name: departmentName }]);
                          setSelectedDepartment('');
                          
                          // Mostrar un toast informativo menos intrusivo
                          toast({
                            title: "📋 Información",
                            description: `Equipo "${departmentName}" añadido. Puedes crear puestos de trabajo más tarde si es necesario.`,
                          });
                          return;
                        }
                        
                        // Añadir el nuevo equipo a la lista
                        setSelectedDepartments(prev => [...prev, { id: value, name: departmentName }]);
                        setSelectedDepartment('');
                      }}>
                       <SelectTrigger>
                         <SelectValue placeholder="Seleccionar equipo..." />
                       </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                          {departments.filter(dept => !selectedDepartments.some(selected => selected.id === dept.id)).map((dept) => (
                            <SelectItem key={dept.id} value={dept.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                              {dept.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                     </Select>

                     {/* Mostrar equipos seleccionados como badges */}
                     {selectedDepartments.length > 0 && (
                       <div className="flex flex-wrap gap-2">
                         {selectedDepartments.map((dept) => (
                           <Badge key={dept.id} variant="secondary" className="flex items-center gap-1">
                             {dept.name}
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDepartments(prev => {
                                    const newDepts = prev.filter(d => d.id !== dept.id);
                                    return newDepts;
                                  });
                                  // Also clear the job when removing department
                                  setFormData(prev => ({ ...prev, jobId: "" }));
                                }}
                             />
                           </Badge>
                         ))}
                       </div>
                     )}

                     {departments.length === 0 && (
                       <p className="text-sm text-muted-foreground">
                         No hay equipos creados. Crea equipos en Configuración → Puestos → Equipos
                       </p>
                     )}
                    </div>
                  </FormField>

                  {/* Selección de puesto de trabajo */}
                  {selectedDepartments.length > 0 && (
                    <FormField label="Puesto de trabajo" required={false}>
                      <Select value={formData.jobId} onValueChange={(value) => setFormData(prev => ({ ...prev, jobId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar puesto de trabajo" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                          {jobs
                            .filter(job => selectedDepartments.some(dept => dept.id === job.department_id))
                            .map((job) => (
                              <SelectItem key={job.id} value={job.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                {job.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}

                  {/* AFILIACIÓN */}
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                      AFILIACIÓN
                    </h3>

                    <FormField label="Establecimiento por defecto" required>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          {colaboradorData?.org_id 
                            ? (organizations.find(org => org.id === colaboradorData.org_id)?.name || 'Organización no encontrada')
                            : (currentOrganizationName || 'Organización actual')
                          }
                        </span>
                      </div>
                    </FormField>

                    <FormField label="Tiempo de trabajo semanal (en horas)" required>
                      <Input
                        type="number"
                        value={formData.tiempoTrabajoSemanal}
                        onChange={(e) => setFormData(prev => ({ ...prev, tiempoTrabajoSemanal: e.target.value }))}
                        placeholder="Introducir número de horas"
                        min="1"
                        max="48"
                      />
                    </FormField>

                    <FormField label="">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium text-foreground">
                            Responsable directo
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">El responsable directo seleccionado, recibirá notificaciones de las solicitudes de ausencia de este colaborador</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Select value={formData.responsableDirecto} onValueChange={(value) => setFormData(prev => ({ ...prev, responsableDirecto: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar el responsable directo" />
                          </SelectTrigger>
                          <SelectContent>
                            {managers.length === 0 ? (
                              <SelectItem value="_none" disabled>No hay managers disponibles</SelectItem>
                            ) : (
                              managers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  {manager.apellidos}, {manager.nombre} - {manager.role === 'manager' ? 'Manager' : manager.role === 'director' ? 'Director' : manager.role === 'administrador' ? 'Admin' : 'Owner'}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormField>
                  </div>
                </div>
            </div>

            {/* Button para versión lineal */}
            <div className="pt-6 border-t border-border/40">
              <Button
                onClick={handleSubmit}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Guardar
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};