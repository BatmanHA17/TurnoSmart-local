// State + business logic extracted from AddColaboradorSheet.tsx (D2 refactor)

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createOrUpdateColaborador, mapLegacyFormData } from "@/services/colaboradorService";
import { useNavigate } from "react-router-dom";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useJobDepartments } from "@/hooks/useJobDepartments";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
import { toast } from "@/hooks/use-toast";

// ─── Shared constants ────────────────────────────────────────────────────────

export const generateEmployeeId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `EMP${timestamp}${randomNum}`;
};

export const TIPOS_CONTRATO = [
  "Sin especificar",
  "Contrato indefinido",
  "Contrato temporal",
  "Práctica profesional",
  "Contrato de formación",
  "Contrato fijo discontinuo",
  "Extra (colaborador externo)",
  "Empleado trabajo temporal (ETT)",
];

export const COUNTRY_PHONE_CODES: Record<string, string> = {
  ES: "+34",
  FR: "+33",
  DE: "+49",
  IT: "+39",
  GB: "+44",
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ColaboradorFormData {
  nombre: string;
  apellidos: string;
  apellidosUso: string;
  empleadoId: string;
  fechaNacimiento: string;
  email: string;
  telefonoMovil: string;
  paisMovil: string;
  telefonoFijo: string;
  paisFijo: string;
  fechaInicioContrato: string;
  horaInicioContrato: string;
  tipoContrato: string;
  fechaFinContrato: string;
  tiempoTrabajoSemanal: string;
  jobId: string;
  responsableDirecto: string;
  esExtranjero: boolean;
  direccion: string;
  complementoDireccion: string;
  codigoPostal: string;
  ciudad: string;
  pais: string;
  nombreTitularCuenta: string;
  iban: string;
  bic: string;
  numeroIdentificacionInterna: string;
  numeroSeguridadSocial: string;
  personaConDiscapacidad: boolean;
  ultimaRevisionMedica: string;
  reconocimientoMedicoReforzado: boolean;
  exentoSeguroMedico: boolean;
  nombreContactoEmergencia: string;
  apellidoContactoEmergencia: string;
  relacionContactoEmergencia: string;
  telefonoMovilEmergencia: string;
  telefonoFijoEmergencia: string;
  codigoPaisMovilEmergencia: string;
  codigoPaisFijoEmergencia: string;
  genero: string;
  apellidosNacimiento: string;
  nacionalidad: string;
  provincia: string;
  ciudadNacimiento: string;
  estadoCivil: string;
  numeroPersonasDependientes: string;
  fechaAntiguedad: string;
  trabajadorExtranjeroPermiso: boolean;
}

const EMPTY_FORM: ColaboradorFormData = {
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
  trabajadorExtranjeroPermiso: false,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseAddColaboradorFormProps {
  open: boolean;
  isEditMode: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colaboradorData?: any;
  onOpenChange: (open: boolean) => void;
  onColaboradorAdded?: () => void;
  onColaboradorUpdated?: () => void;
}

export function useAddColaboradorForm({
  open,
  isEditMode,
  colaboradorData,
  onOpenChange,
  onColaboradorAdded,
  onColaboradorUpdated,
}: UseAddColaboradorFormProps) {
  const navigate = useNavigate();
  const { logActivity } = useActivityLog();
  const { organizations, currentOrganizationName } = useOrganizations();
  const { departments } = useJobDepartments();
  const { assignments } = useTeamAssignments(colaboradorData?.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedDepartments, setSelectedDepartments] = useState<{ id: string; name: string }[]>([]);
  const [tempJobWarningAccepted, setTempJobWarningAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState("datos-personales");
  const [formData, setFormData] = useState<ColaboradorFormData>({ ...EMPTY_FORM });

  // Load jobs filtered by selected departments
  useEffect(() => {
    const loadJobs = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query: any = supabase.from("jobs").select("*");
        if (selectedDepartments.length > 0) {
          const departmentIds = selectedDepartments.map((dept) => dept.id);
          query = query.in("department_id", departmentIds);
        }
        const { data, error } = await query.order("title");
        if (!error && data) setJobs(data);
      } catch (error) {
        console.error("Error loading jobs:", error);
      }
    };
    if (open) loadJobs();
  }, [open, selectedDepartments]);

  // Load managers for the Responsable Directo dropdown
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const { data: currentOrgData } = await supabase
          .from("organizations")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (!currentOrgData?.id) return;

        const { data, error } = await supabase
          .from("colaborador_roles")
          .select(`
            colaborador_id,
            role,
            colaboradores!inner (
              id,
              nombre,
              apellidos
            )
          `)
          .eq("org_id", currentOrgData.id)
          .eq("activo", true)
          .in("role", ["manager", "director", "administrador", "propietario"])
          .order("colaboradores(apellidos)");

        if (!error && data) {
          const uniqueManagers = Array.from(
            new Map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.map((item: any) => [
                item.colaborador_id,
                {
                  id: item.colaborador_id,
                  nombre: item.colaboradores.nombre,
                  apellidos: item.colaboradores.apellidos,
                  role: item.role,
                },
              ])
            ).values()
          );
          setManagers(uniqueManagers);
        }
      } catch (error) {
        console.error("Error loading managers:", error);
      }
    };
    if (open) loadManagers();
  }, [open]);

  // Auto-generate employee ID for new colaboradors
  useEffect(() => {
    if (!isEditMode && !formData.empleadoId) {
      setFormData((prev) => ({ ...prev, empleadoId: generateEmployeeId() }));
    }
  }, [isEditMode]);

  // Auto-complete apellidosUso with nombre + apellidos
  useEffect(() => {
    if (!isEditMode && formData.nombre && formData.apellidos && !formData.apellidosUso) {
      setFormData((prev) => ({
        ...prev,
        apellidosUso: `${formData.nombre} ${formData.apellidos}`,
      }));
    }
  }, [formData.nombre, formData.apellidos, isEditMode]);

  // Populate form when in edit mode
  useEffect(() => {
    if (isEditMode && colaboradorData) {
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
        jobId,
        responsableDirecto: colaboradorData.responsable_directo || "",
        esExtranjero: colaboradorData.es_extranjero || false,
        direccion: colaboradorData.direccion || "",
        complementoDireccion: "",
        codigoPostal: colaboradorData.codigo_postal || "",
        ciudad: colaboradorData.ciudad || "",
        pais: colaboradorData.pais_residencia || "España",
        nombreTitularCuenta: colaboradorData.banking_titular || "",
        iban: colaboradorData.banking_iban || "",
        bic: colaboradorData.banking_bic || "",
        numeroIdentificacionInterna: colaboradorData.banking_numero_identificacion || "",
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
        genero: colaboradorData.genero || "",
        apellidosNacimiento: colaboradorData.apellidos_nacimiento || "",
        nacionalidad: colaboradorData.nacionalidad || "",
        provincia: colaboradorData.provincia || "",
        ciudadNacimiento: colaboradorData.ciudad_nacimiento || "",
        estadoCivil: colaboradorData.estado_civil || "",
        numeroPersonasDependientes: colaboradorData.numero_personas_dependientes?.toString() || "",
        fechaAntiguedad: colaboradorData.fecha_antiguedad || "",
        trabajadorExtranjeroPermiso: colaboradorData.trabajador_extranjero_permiso || false,
      });

      if (colaboradorData.jobs?.department) {
        const department = departments.find(
          (dept) => dept.value === colaboradorData.jobs?.department
        );
        if (department) {
          setSelectedDepartments([{ id: department.id, name: department.value }]);
        }
      }
    }
  }, [isEditMode, colaboradorData, departments]);

  // Sync selectedDepartments from team assignments hook
  useEffect(() => {
    if (isEditMode && assignments && assignments.length > 0 && open) {
      const deptList = assignments.map((a) => ({
        id: a.department_id,
        name: a.department_name,
      }));
      setSelectedDepartments(deptList);
    }
  }, [assignments, isEditMode, open]);

  // Initialize department from job when jobs are loaded
  useEffect(() => {
    if (
      isEditMode &&
      colaboradorData?.job_id &&
      jobs.length > 0 &&
      selectedDepartments.length === 0 &&
      open
    ) {
      const currentJob = jobs.find((job) => job.id === colaboradorData.job_id);
      if (currentJob?.department_id) {
        const department = departments.find(
          (dept) => dept.id === currentJob.department_id
        );
        if (department) {
          setSelectedDepartments([{ id: department.id, name: department.value }]);
        }
      }
    }
  }, [isEditMode, colaboradorData?.job_id, jobs, selectedDepartments.length, departments, open]);

  // ─── Phone country handlers ────────────────────────────────────────────────

  const handlePaisMovilChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paisMovil: value,
      telefonoMovil: prev.telefonoMovil.replace(/^\+\d+\s?/, ""),
    }));
  };

  const handlePaisFijoChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paisFijo: value,
      telefonoFijo: prev.telefonoFijo.replace(/^\+\d+\s?/, ""),
    }));
  };

  const handleCodigoPaisMovilEmergenciaChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      codigoPaisMovilEmergencia: value,
      telefonoMovilEmergencia: prev.telefonoMovilEmergencia.replace(/^\+\d+\s?/, ""),
    }));
  };

  const handleCodigoPaisFijoEmergenciaChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      codigoPaisFijoEmergencia: value,
      telefonoFijoEmergencia: prev.telefonoFijoEmergencia.replace(/^\+\d+\s?/, ""),
    }));
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const requiredFields: string[] = [];
    if (!formData.nombre) requiredFields.push("nombre");
    if (!formData.apellidos) requiredFields.push("apellidos");
    if (!formData.apellidosUso) requiredFields.push("nombre a mostrar");
    if (!formData.email) requiredFields.push("correo electrónico");
    if (!formData.fechaInicioContrato) requiredFields.push("fecha de inicio de contrato");
    if (!formData.horaInicioContrato) requiredFields.push("hora de inicio de contrato");
    if (!formData.tipoContrato || formData.tipoContrato === "Sin especificar")
      requiredFields.push("tipo de contrato");
    if (!formData.tiempoTrabajoSemanal) requiredFields.push("tiempo de trabajo semanal");
    if (selectedDepartments.length === 0) requiredFields.push("al menos un equipo");
    if (
      formData.tipoContrato &&
      formData.tipoContrato !== "Contrato indefinido" &&
      !formData.fechaFinContrato
    ) {
      requiredFields.push("fecha de fin del contrato");
    }

    if (requiredFields.length > 0) {
      toast({
        title: "Campos obligatorios faltantes",
        description: `Por favor completa: ${requiredFields.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    await doSubmitWithoutWarning();
  };

  const doSubmitWithoutWarning = async () => {
    const horasSemanales = parseInt(formData.tiempoTrabajoSemanal);
    if (isNaN(horasSemanales) || horasSemanales < 1 || horasSemanales > 40) {
      toast({
        title: "Error en tiempo de trabajo",
        description: "El tiempo de trabajo semanal debe ser entre 1 y 40 horas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const finalEmpleadoId = formData.empleadoId || generateEmployeeId();
      const { baseData, healthData, emergencyContactData, bankingData } = mapLegacyFormData({
        ...formData,
        empleadoId: finalEmpleadoId,
      });

      if (isEditMode && colaboradorData?.org_id) {
        baseData.org_id = colaboradorData.org_id;
      } else if (organizations && organizations.length > 0) {
        baseData.org_id = organizations[0].id;
      } else {
        toast({
          title: "Error",
          description: "No se pudo determinar la organización",
          variant: "destructive",
        });
        return;
      }

      baseData.selectedDepartments = selectedDepartments.map((dept) => dept.id);

      if (isEditMode && colaboradorData?.id) {
        const emailHasChanged =
          colaboradorData.email &&
          formData.email &&
          colaboradorData.email.toLowerCase() !== formData.email.toLowerCase();

        if (selectedDepartment) {
          delete baseData.job_id;
        }

        await createOrUpdateColaborador(
          baseData,
          healthData,
          emergencyContactData,
          bankingData,
          colaboradorData.id
        );

        toast({
          title: "Colaborador actualizado",
          description: `${formData.nombre} ${formData.apellidos} ha sido actualizado exitosamente.`,
        });

        await logActivity({
          action: `ha modificado la información de ${formData.nombre} ${formData.apellidos}`,
          entityType: "colaborador",
          entityId: colaboradorData.id,
          entityName: `${formData.nombre} ${formData.apellidos}`,
          establishment: currentOrganizationName || "Recepción",
        });

        if (emailHasChanged) {
          await logActivity({
            action: "email_changed",
            entityType: "colaborador",
            entityId: colaboradorData.id,
            entityName: `${formData.nombre} ${formData.apellidos}`,
            establishment: currentOrganizationName || "Recepción",
            details: {
              old_email: colaboradorData.email,
              new_email: formData.email,
            },
          });
          toast({
            title: "Email actualizado",
            description:
              "El email ha sido modificado. Puedes enviar una nueva invitación desde el perfil del colaborador.",
          });
        }
      } else {
        baseData.status = "activo";
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

        await logActivity({
          action: `ha añadido un nuevo colaborador: ${formData.nombre} ${formData.apellidos}`,
          entityType: "colaborador",
          entityId: insertedColaborador.id,
          entityName: `${formData.nombre} ${formData.apellidos}`,
          establishment: currentOrganizationName || "Recepción",
        });

        if (formData.jobId) {
          const { error: jobError } = await supabase
            .from("colaboradores")
            .update({ job_id: formData.jobId })
            .eq("id", insertedColaborador.id);
          if (jobError) console.error("Error assigning job:", jobError);
        }

        if (baseData.fecha_inicio_contrato && insertedColaborador.id) {
          const startDate = new Date(baseData.fecha_inicio_contrato);
          const today = new Date();
          const daysDiff = Math.ceil(
            (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff >= -7 && daysDiff <= 30) {
            try {
              const existingEmployees = JSON.parse(
                localStorage.getItem("calendar-employees") || "[]"
              );
              const isAlreadyInCalendar = existingEmployees.some(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (emp: any) => emp.id === insertedColaborador.id
              );
              if (!isAlreadyInCalendar) {
                existingEmployees.push({
                  id: insertedColaborador.id,
                  name: `${baseData.nombre} ${baseData.apellidos}`,
                  nombre: baseData.nombre,
                  apellidos: baseData.apellidos,
                  start_date: baseData.fecha_inicio_contrato,
                });
                localStorage.setItem(
                  "calendar-employees",
                  JSON.stringify(existingEmployees)
                );
                toast({
                  title: "Añadido al calendario",
                  description: `${baseData.nombre} ${baseData.apellidos} ha sido añadido automáticamente al calendario de turnos.`,
                });
              }
            } catch (error) {
              console.error("Error adding to calendar:", error);
            }
          }
        }
      }

      setTempJobWarningAccepted(false);

      if (isEditMode && onColaboradorUpdated) {
        await onColaboradorUpdated();
      } else if (!isEditMode && onColaboradorAdded) {
        await onColaboradorAdded();
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Unexpected error:", error);
      let errorMessage = "Error inesperado al guardar el colaborador";

      if (error && typeof error === "object" && "code" in error) {
        const dbError = error as { code: string; message?: string };
        switch (dbError.code) {
          case "23505":
            if (dbError.message?.includes("colaboradores_empleado_id_key")) {
              errorMessage = `El ID de empleado "${formData.empleadoId}" ya está registrado. Por favor, usa un ID diferente.`;
            } else if (dbError.message?.includes("colaboradores_org_email_uniq")) {
              errorMessage = `El email "${formData.email}" ya está registrado en esta organización. Por favor, usa un email diferente.`;
            } else {
              errorMessage =
                "Ya existe un colaborador con estos datos. Verifica que el ID de empleado y email sean únicos.";
            }
            break;
          default:
            errorMessage = `Error de base de datos: ${dbError.message || "Error desconocido"}`;
        }
      }

      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  // ─── Sheet close handler ──────────────────────────────────────────────────

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isEditMode) {
      setSelectedDepartments([]);
      setTempJobWarningAccepted(false);
      setFormData({ ...EMPTY_FORM });
    } else if (!isOpen) {
      setTempJobWarningAccepted(false);
    }
    onOpenChange(isOpen);
  };

  // ─── Department select handlers ───────────────────────────────────────────

  /** Used in CREATE mode — checks if dept has jobs before adding */
  const handleDepartmentSelectCreate = async (value: string) => {
    const isAlreadySelected = selectedDepartments.some((dept) => dept.id === value);
    if (isAlreadySelected) {
      toast({
        title: "Equipo ya seleccionado",
        description: "Este equipo ya está asignado al colaborador",
        variant: "destructive",
      });
      return;
    }

    const { data: jobData, error: jobsError } = await supabase
      .from("jobs")
      .select("id")
      .eq("department_id", value)
      .limit(1);

    const hasJob = !jobsError && jobData && jobData.length > 0;
    const departmentName = departments.find((d) => d.id === value)?.value || "";

    if (!hasJob) {
      console.warn(`⚠️ No hay puestos de trabajo definidos en el equipo "${departmentName}"`);
      setSelectedDepartments((prev) => [...prev, { id: value, name: departmentName }]);
      setSelectedDepartment("");
      toast({
        title: "📋 Información",
        description: `Equipo "${departmentName}" añadido. Puedes crear puestos de trabajo más tarde si es necesario.`,
      });
      return;
    }

    setSelectedDepartments((prev) => [...prev, { id: value, name: departmentName }]);
    setSelectedDepartment("");
  };

  /** Used in EDIT mode — simple add without job check */
  const handleDepartmentSelectEdit = (value: string) => {
    if (value && !selectedDepartments.find((d) => d.id === value)) {
      const department = departments.find((d) => d.id === value);
      if (department) {
        setSelectedDepartments((prev) => [
          ...prev,
          { id: department.id, name: department.value },
        ]);
      }
    }
  };

  // Expose navigate to avoid unused-var warning (may be needed by callers in future)
  void navigate;

  return {
    // State
    formData,
    setFormData,
    jobs,
    managers,
    selectedDepartment,
    setSelectedDepartment,
    selectedDepartments,
    setSelectedDepartments,
    activeTab,
    setActiveTab,
    // Handlers
    handlePaisMovilChange,
    handlePaisFijoChange,
    handleCodigoPaisMovilEmergenciaChange,
    handleCodigoPaisFijoEmergenciaChange,
    handleSubmit,
    handleOpenChange,
    handleDepartmentSelectCreate,
    handleDepartmentSelectEdit,
    // External data needed by JSX
    organizations,
    departments,
    currentOrganizationName,
  };
}
