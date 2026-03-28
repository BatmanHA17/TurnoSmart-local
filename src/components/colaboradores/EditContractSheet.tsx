import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormField } from "@/components/ui/form-field";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Badge } from "@/components/ui/badge";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
import { useJobDepartments } from "@/hooks/useJobDepartments";
interface EditContractSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: any;
  onUpdateSuccess?: () => void;
}
export const EditContractSheet = ({
  open,
  onOpenChange,
  colaborador,
  onUpdateSuccess
}: EditContractSheetProps) => {
  const {
    logActivity
  } = useActivityLog();
  const {
    organizations,
    currentOrganizationName
  } = useOrganizations();
  const { org: currentOrg } = useCurrentOrganization();
  const { assignments, loading: loadingAssignments, refetch: refetchAssignments } = useTeamAssignments(colaborador?.id);
  const { departments: availableDepartments } = useJobDepartments();
  
  const [jobs, setJobs] = useState<any[]>([]);
  // professionalCategories eliminado - se gestiona desde el job
  const [jobDepartments, setJobDepartments] = useState<any[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [tipoContrato, setTipoContrato] = useState(colaborador?.tipo_contrato || "");
  const [esDiurno, setEsDiurno] = useState(true);
  const [tiempoTrabajoSemanal, setTiempoTrabajoSemanal] = useState(colaborador?.tiempo_trabajo_semanal || 40);
  const [fechaInicioContrato, setFechaInicioContrato] = useState<Date | undefined>(colaborador?.fecha_inicio_contrato ? new Date(colaborador.fecha_inicio_contrato) : new Date());
  const [horaInicioContrato, setHoraInicioContrato] = useState(colaborador?.hora_inicio_contrato || "08:00");
  const [fechaFinContrato, setFechaFinContrato] = useState<Date | undefined>(colaborador?.fecha_fin_contrato ? new Date(colaborador.fecha_fin_contrato) : undefined);
  const [fechaFinPrueba, setFechaFinPrueba] = useState<Date | undefined>(undefined);
  const [diasTrabajados, setDiasTrabajados] = useState(Math.ceil((colaborador?.tiempo_trabajo_semanal || 40) / 8));
  const [disponibilidad, setDisponibilidad] = useState<string[]>(() => {
    if (!colaborador?.disponibilidad_semanal) return [];
    try {
      const parsed = typeof colaborador.disponibilidad_semanal === 'string' 
        ? JSON.parse(colaborador.disponibilidad_semanal)
        : colaborador.disponibilidad_semanal;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [tituloEmpleo, setTituloEmpleo] = useState(colaborador?.titulo_empleo || "");
  const [categoria, setCategoria] = useState(colaborador?.categoria || "");
  const [jobId, setJobId] = useState(colaborador?.job_id || "");
  const [personalizarCalificacion, setPersonalizarCalificacion] = useState(false);
  const [establecimientoId, setEstablecimientoId] = useState<string>(colaborador?.org_id || '');
  const [responsableDirecto, setResponsableDirecto] = useState(colaborador?.responsable_directo || "");
  const [noPublicarRegistro, setNoPublicarRegistro] = useState(false);

  // Estados para nóminas
  const [empleadoConSMI, setEmpleadoConSMI] = useState(colaborador?.empleado_smi || false);
  const [salarioBrutoMensual, setSalarioBrutoMensual] = useState(colaborador?.salario_bruto_mensual?.toString() || "");
  const [tasaHorariaBruta, setTasaHorariaBruta] = useState(colaborador?.tasa_horaria_bruta?.toString() || "");

  // Sincronizar selectedDepartments con assignments
  useEffect(() => {
    if (assignments && assignments.length > 0) {
      setSelectedDepartments(assignments.map(a => a.department_id));
    }
  }, [assignments]);

  // Sincronizar estado cuando cambien las props del colaborador
  useEffect(() => {
    if (colaborador && open) {
      const orgName = organizations.find(org => org.id === colaborador.org_id)?.name;
      
      // Campos de contrato
      setTipoContrato(colaborador.tipo_contrato || "");
      setTiempoTrabajoSemanal(colaborador.tiempo_trabajo_semanal || 40);
      setFechaInicioContrato(colaborador.fecha_inicio_contrato ? new Date(colaborador.fecha_inicio_contrato) : new Date());
      setHoraInicioContrato(colaborador.hora_inicio_contrato || "08:00");
      setFechaFinContrato(colaborador.fecha_fin_contrato ? new Date(colaborador.fecha_fin_contrato) : undefined);
      
      // IMPORTANTE: Asegurarse de que el establecimiento se setea correctamente
      const newEstablecimientoId = colaborador.org_id || '';
      setEstablecimientoId(newEstablecimientoId);
      
      setResponsableDirecto(colaborador.responsable_directo || "");
      setDiasTrabajados(Math.ceil((colaborador.tiempo_trabajo_semanal || 40) / 8));
      setDisponibilidad(
        colaborador.disponibilidad_semanal 
          ? (typeof colaborador.disponibilidad_semanal === 'string' 
              ? JSON.parse(colaborador.disponibilidad_semanal) 
              : colaborador.disponibilidad_semanal)
          : []
      );

      // Campos de empleo y cualificación
      setTituloEmpleo(colaborador.titulo_empleo || "");
      setCategoria(colaborador.categoria || "");
      setJobId(colaborador.job_id || "");

      // Campos de nóminas
      setEmpleadoConSMI(colaborador.empleado_smi || false);
      setSalarioBrutoMensual(colaborador.salario_bruto_mensual?.toString() || "");
      setTasaHorariaBruta(colaborador.tasa_horaria_bruta?.toString() || "");
    }
  }, [colaborador, organizations, open]);

  // Cargar jobs, categorías y departamentos disponibles
  useEffect(() => {
    const loadJobsData = async () => {
      
      if (!open) {
        return;
      }

      try {
        // Cargar jobs de manera simple sin joins complejos
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .order('title');
        
        if (!jobsError && jobsData) {
          setJobs(jobsData);
        } else {
          console.error('❌ Error cargando jobs:', jobsError);
          setJobs([]); // Asegurar que jobs esté definido
        }

        // Categorías eliminadas - se gestiona automáticamente desde el job seleccionado

        // Cargar departamentos
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('job_departments')
          .select('*')
          .order('value');
        
        if (!departmentsError && departmentsData) {
          setJobDepartments(departmentsData);
        } else {
          console.error('❌ Error cargando departamentos:', departmentsError);
          setJobDepartments([]);
        }
      } catch (error) {
        console.error('❌ Error general cargando datos:', error);
        // Inicializar arrays vacíos en caso de error
        setJobs([]);
        setJobDepartments([]);
      }
    };
    
    loadJobsData();
  }, [open]); // Simplificar dependencias
  const getContractTypeDisplay = (tipo: string) => {
    if (!tipo || tipo === "none") return "Selecciona el tipo de contrato";
    switch (tipo) {
      case "Práctica profesional":
        return "Contrato de prácticas";
      case "Contrato temporal":
        return "Contrato temporal";
      case "Contrato indefinido":
        return "Contrato indefinido";
      case "Extra (colaborador externo)":
        return "Colaborador externo";
      case "Empleado trabajo temporal (ETT)":
        return "ETT";
      case "Contrato de formación":
        return "Contrato de formación";
      case "Contrato fijo discontinuo":
        return "Contrato fijo discontinuo";
      default:
        return tipo;
    }
  };
  const handleSave = async () => {
    
    try {
      // Preparar los datos para actualizar
      const updateData: any = {};
      const changes: Array<{
        field: string;
        old_value: string;
        new_value: string;
        description: string;
      }> = [];

      // Datos de contrato
      if (tipoContrato !== colaborador?.tipo_contrato) {
        const finalTipoContrato = tipoContrato === 'none' ? null : tipoContrato;
        updateData.tipo_contrato = finalTipoContrato;
        changes.push({
          field: 'tipo_contrato',
          old_value: colaborador?.tipo_contrato || '',
          new_value: finalTipoContrato || '',
          description: `Tipo de contrato cambiado de "${colaborador?.tipo_contrato || 'No especificado'}" a "${finalTipoContrato || 'Sin especificar'}"`
        });
      }
      if (fechaInicioContrato && fechaInicioContrato.toISOString().split('T')[0] !== colaborador?.fecha_inicio_contrato) {
        const newDate = fechaInicioContrato.toISOString().split('T')[0];
        updateData.fecha_inicio_contrato = newDate;
        changes.push({
          field: 'fecha_inicio_contrato',
          old_value: colaborador?.fecha_inicio_contrato || '',
          new_value: newDate,
          description: `Fecha de inicio cambiada de "${colaborador?.fecha_inicio_contrato || 'No especificado'}" a "${newDate}"`
        });
      }
      if (horaInicioContrato !== colaborador?.hora_inicio_contrato) {
        updateData.hora_inicio_contrato = horaInicioContrato;
        changes.push({
          field: 'hora_inicio_contrato',
          old_value: colaborador?.hora_inicio_contrato || '',
          new_value: horaInicioContrato,
          description: `Hora de inicio cambiada de "${colaborador?.hora_inicio_contrato || 'No especificado'}" a "${horaInicioContrato}"`
        });
      }
      if (fechaFinContrato && fechaFinContrato.toISOString().split('T')[0] !== colaborador?.fecha_fin_contrato) {
        const newDate = fechaFinContrato.toISOString().split('T')[0];
        updateData.fecha_fin_contrato = newDate;
        changes.push({
          field: 'fecha_fin_contrato',
          old_value: colaborador?.fecha_fin_contrato || '',
          new_value: newDate,
          description: `Fecha fin contrato cambiada de "${colaborador?.fecha_fin_contrato || 'No especificado'}" a "${newDate}"`
        });
      }
      if (tiempoTrabajoSemanal !== colaborador?.tiempo_trabajo_semanal) {
        updateData.tiempo_trabajo_semanal = tiempoTrabajoSemanal;
        changes.push({
          field: 'tiempo_trabajo_semanal',
          old_value: colaborador?.tiempo_trabajo_semanal?.toString() || '',
          new_value: tiempoTrabajoSemanal.toString(),
          description: `Horas semanales cambiadas de "${colaborador?.tiempo_trabajo_semanal || 'No especificado'}" a "${tiempoTrabajoSemanal}"`
        });
      }

      // Disponibilidad semanal
      const newDisponibilidad = JSON.stringify(disponibilidad);
      const oldDisponibilidad = colaborador?.disponibilidad_semanal 
        ? (typeof colaborador.disponibilidad_semanal === 'string' 
            ? colaborador.disponibilidad_semanal 
            : JSON.stringify(colaborador.disponibilidad_semanal))
        : '[]';
      
      if (newDisponibilidad !== oldDisponibilidad) {
        updateData.disponibilidad_semanal = disponibilidad;
        changes.push({
          field: 'disponibilidad_semanal',
          old_value: oldDisponibilidad,
          new_value: newDisponibilidad,
          description: `Disponibilidad cambiada: ${disponibilidad.length} días seleccionados (${disponibilidad.join(', ')})`
        });
      }

      // Establecimiento por defecto (org_id)
      
      if (establecimientoId !== colaborador?.org_id) {
        updateData.org_id = establecimientoId;
        const oldOrgName = organizations.find(org => org.id === colaborador?.org_id)?.name || 'No especificado';
        const newOrgName = organizations.find(org => org.id === establecimientoId)?.name || 'No especificado';
        changes.push({
          field: 'org_id',
          old_value: colaborador?.org_id || '',
          new_value: establecimientoId,
          description: `Establecimiento cambiado de "${oldOrgName}" a "${newOrgName}"`
        });
      }

      if (responsableDirecto !== colaborador?.responsable_directo) {
        updateData.responsable_directo = responsableDirecto;
        changes.push({
          field: 'responsable_directo',
          old_value: colaborador?.responsable_directo || '',
          new_value: responsableDirecto,
          description: `Responsable directo cambiado de "${colaborador?.responsable_directo || 'No especificado'}" a "${responsableDirecto}"`
        });
      }
      if (jobId !== colaborador?.job_id) {
        
        const finalJobId = (jobId === "" || jobId === "none") ? null : jobId;
        updateData.job_id = finalJobId;
        
        // Obtener nombres de los puestos para el historial
        const oldJobName = colaborador?.job_id ? 
          jobs.find(job => job.id === colaborador.job_id)?.title || 'Puesto desconocido' : 
          'Sin puesto';
        const newJobName = finalJobId ? 
          jobs.find(job => job.id === finalJobId)?.title || 'Puesto desconocido' : 
          'Sin puesto';
        
        changes.push({
          field: 'job_id',
          old_value: colaborador?.job_id || '',
          new_value: finalJobId || '',
          description: `Puesto de trabajo cambiado de "${oldJobName}" a "${newJobName}"`
        });
        
      }

      // Solo actualizar si hay cambios
      if (Object.keys(updateData).length > 0) {
        
        // Actualizar el colaborador
        const { data: updatedData, error } = await supabase
          .from('colaboradores')
          .update(updateData)
          .eq('id', colaborador.id)
          .select()
          .single();
          
        if (error) {
          console.error('❌ Error al actualizar:', error);
          toast({
            title: "Error",
            description: "No se pudieron guardar los cambios",
            variant: "destructive"
          });
          return;
        }
        

        // Sincronizar asignaciones de departamentos
        
        // Primero, desactivar todas las asignaciones actuales
        const { error: deactivateError } = await supabase
          .from('colaborador_departments')
          .update({ is_active: false })
          .eq('colaborador_id', colaborador.id);
        
        if (deactivateError) {
          console.error('Error desactivando departamentos:', deactivateError);
        }
        
        // Luego, crear o reactivar las asignaciones seleccionadas
        if (selectedDepartments.length > 0) {
          const user = await supabase.auth.getUser();
          const newAssignments = selectedDepartments.map(deptId => ({
            colaborador_id: colaborador.id,
            department_id: deptId,
            org_id: updatedData.org_id, // Usar el org_id actualizado
            assigned_by: user.data.user?.id,
            is_active: true
          }));

          const { error: assignmentError } = await supabase
            .from('colaborador_departments')
            .upsert(newAssignments, {
              onConflict: 'colaborador_id,department_id'
            });

          if (assignmentError) {
            console.error('Error guardando asignaciones de departamentos:', assignmentError);
          } else {
          }
        }

        // Registrar cambios en el historial
        for (const change of changes) {
          await supabase.from('contract_history').insert({
            colaborador_id: colaborador.id,
            change_type: 'modified',
            change_description: change.description,
            field_changed: change.field,
            old_value: change.old_value,
            new_value: change.new_value,
            changed_by: 'Usuario' // Aquí se podría obtener el usuario actual
          });
        }

        // Sincronizar con el calendario si el empleado está siendo usado allí
        const updatedColaboradorForCalendar = {
          id: colaborador.id,
          nombre: colaborador.nombre,
          apellidos: colaborador.apellidos,
          email: colaborador.email,
          tipo_contrato: tipoContrato,
          tiempo_trabajo_semanal: tiempoTrabajoSemanal
        };
        localStorage.setItem('updatedEmployeeForCalendar', JSON.stringify(updatedColaboradorForCalendar));

        // Verificar que se guardó correctamente
        const stored = localStorage.getItem('updatedEmployeeForCalendar');

        // Disparar evento personalizado para forzar sincronización inmediata
        window.dispatchEvent(new CustomEvent('employeeUpdated', {
          detail: updatedColaboradorForCalendar
        }));
        toast({
          title: "Cambios guardados",
          description: "El contrato ha sido actualizado correctamente"
        });

        // Log the activity
        const changesDescription = changes.map(c => c.description).join(', ');
        await logActivity({
          action: `ha modificado el contrato de ${colaborador.nombre} ${colaborador.apellidos}${changes.length > 0 ? `: ${changesDescription}` : ''}`,
          entityType: 'colaborador',
          entityId: colaborador.id,
          entityName: `${colaborador.nombre} ${colaborador.apellidos}`,
          establishment: organizations.find(org => org.id === establecimientoId)?.name || 'GOTHAM',
          details: {
            changes
          }
        });

        // Llamar a la función de actualización si existe
        if (onUpdateSuccess) {
          await onUpdateSuccess();
        }
        
        // Refrescar asignaciones de equipos para actualizar el UI
        await refetchAssignments();
        
        // Cerrar el diálogo
        onOpenChange(false);
      } else {
        // Si no hay cambios, solo cerrar
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving contract changes:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }
  };

  const handleAddDepartment = async (departmentId: string) => {
    if (!colaborador?.id || !currentOrg?.org_id) return;
    
    setIsAddingDepartment(true);
    try {
      const { error } = await supabase
        .from('colaborador_departments')
        .upsert({
          colaborador_id: colaborador.id,
          department_id: departmentId,
          org_id: currentOrg.org_id,
          is_active: true,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'colaborador_id,department_id'
        });

      if (error) throw error;

      setSelectedDepartments([...selectedDepartments, departmentId]);
      await refetchAssignments();
      
      toast({
        title: "Equipo asignado",
        description: "El colaborador ha sido asignado al equipo correctamente"
      });
    } catch (error) {
      console.error('Error assigning department:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el equipo",
        variant: "destructive"
      });
    } finally {
      setIsAddingDepartment(false);
    }
  };

  const handleRemoveDepartment = async (departmentId: string) => {
    if (!colaborador?.id) return;
    
    try {
      const { error } = await supabase
        .from('colaborador_departments')
        .update({ is_active: false })
        .eq('colaborador_id', colaborador.id)
        .eq('department_id', departmentId);

      if (error) throw error;

      setSelectedDepartments(selectedDepartments.filter(id => id !== departmentId));
      await refetchAssignments();
      
      toast({
        title: "Equipo eliminado",
        description: "El colaborador ha sido desasignado del equipo"
      });
    } catch (error) {
      console.error('Error removing department:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el equipo",
        variant: "destructive"
      });
    }
  };

  return <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto" onKeyDown={e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    }}>
        <SheetHeader className="pb-6">
          <SheetTitle className="text-lg font-medium">
            Contrato de {colaborador?.nombre || 'Colaborador'}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="contrato" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contrato">Contrato</TabsTrigger>
            <TabsTrigger value="nominas">Nóminas</TabsTrigger>
          </TabsList>

          <TabsContent value="contrato" className="space-y-6">
            {/* Sección CONTRATO */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                CONTRATO
              </h3>
              
              <FormField label="Tipo de contrato">
                <Select value={tipoContrato} onValueChange={setTipoContrato}>
                  <SelectTrigger>
                    <SelectValue placeholder={getContractTypeDisplay(tipoContrato)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="Contrato indefinido">Contrato indefinido</SelectItem>
                    <SelectItem value="Contrato temporal">Contrato temporal</SelectItem>
                    <SelectItem value="Práctica profesional">Contrato de prácticas</SelectItem>
                    <SelectItem value="Contrato de formación">Contrato de formación</SelectItem>
                    <SelectItem value="Contrato fijo discontinuo">Contrato fijo discontinuo</SelectItem>
                    <SelectItem value="Extra (colaborador externo)">Colaborador externo</SelectItem>
                    <SelectItem value="Empleado trabajo temporal (ETT)">ETT</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <div className="flex items-center space-x-2">
                <Checkbox id="contrato-diurno" checked={esDiurno} onCheckedChange={checked => setEsDiurno(checked === true)} />
                <Label htmlFor="contrato-diurno" className="text-sm">
                  Este contrato es un contrato de trabajo diurno
                </Label>
              </div>

              <FormField label="Tiempo de trabajo semanal">
                <div className="flex items-center space-x-2">
                  <Input type="number" value={tiempoTrabajoSemanal} onChange={e => {
                  const valor = parseInt(e.target.value);
                  setTiempoTrabajoSemanal(valor);
                  setDiasTrabajados(Math.ceil(valor / 8));
                }} />
                  <span className="text-sm text-muted-foreground">h</span>
                </div>
              </FormField>

              <FormField label="Fecha de inicio del contrato" required>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fechaInicioContrato && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaInicioContrato ? format(fechaInicioContrato, "dd/MM/yyyy") : <span>14/09/2025</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaInicioContrato} onSelect={setFechaInicioContrato} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </FormField>

              <FormField label="Hora de inicio del contrato">
                <Input type="time" value={horaInicioContrato} onChange={e => setHoraInicioContrato(e.target.value)} />
              </FormField>

              <FormField label="Fecha de fin de período de prueba">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !fechaFinPrueba && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaFinPrueba ? format(fechaFinPrueba, "dd/MM/yyyy") : <span>dd/mm/aaaa</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaFinPrueba} onSelect={setFechaFinPrueba} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </FormField>

              <FormField label="Días trabajados por semana" required>
                <div className="flex items-center space-x-2">
                  <Input type="number" value={diasTrabajados} onChange={e => setDiasTrabajados(parseInt(e.target.value))} min={1} max={7} />
                  <span className="text-sm text-muted-foreground">d</span>
                </div>
              </FormField>

              <FormField label="Disponibilidad" required>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    Selecciona los días de la semana en los que el empleado tiene disponibilidad para trabajar
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'Lunes', label: 'Lunes' },
                      { value: 'Martes', label: 'Martes' },
                      { value: 'Miércoles', label: 'Miércoles' },
                      { value: 'Jueves', label: 'Jueves' },
                      { value: 'Viernes', label: 'Viernes' },
                      { value: 'Sábado', label: 'Sábado' },
                      { value: 'Domingo', label: 'Domingo' },
                    ].map((dia) => (
                      <div key={dia.value} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`disponibilidad-${dia.value}`}
                          checked={disponibilidad.includes(dia.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDisponibilidad([...disponibilidad, dia.value]);
                            } else {
                              setDisponibilidad(disponibilidad.filter((d) => d !== dia.value));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`disponibilidad-${dia.value}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {dia.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {disponibilidad.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {disponibilidad.length} {disponibilidad.length === 1 ? 'día seleccionado' : 'días seleccionados'}
                    </p>
                  )}
                </div>
              </FormField>
            </div>

            {/* Sección EMPLEO Y CUALIFICACIÓN */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                EMPLEO Y CUALIFICACIÓN
              </h3>
              
               <FormField label="Puesto de trabajo" required>
                 <Select value={jobId || "none"} onValueChange={(value) => {
                   setJobId(value === "none" ? "" : value);
                   // Auto-sincronizar categoría cuando se selecciona un puesto
                   if (value && value !== "none") {
                     const selectedJob = jobs.find(job => job.id === value);
                     if (selectedJob?.professional_categories?.name) {
                      setCategoria(selectedJob.professional_categories.name);
                    }
                    // Auto-sincronizar horas semanales del puesto
                    if (selectedJob?.hours) {
                      const weeklyHours = selectedJob.hours * 5; // Asumiendo 5 días laborales
                      setTiempoTrabajoSemanal(weeklyHours);
                      setDiasTrabajados(Math.ceil(weeklyHours / 8));
                    }
                  } else {
                    // Limpiar categoría si no hay puesto seleccionado
                    setCategoria("");
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={`Seleccionar puesto (${jobs.length} disponibles)`} 
                    />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">Sin puesto asignado</SelectItem>
                     {jobs.length > 0 ? (
                       jobs.map(job => (
                         <SelectItem key={job.id} value={job.id}>
                           <div className="flex items-center justify-between w-full">
                             <span className="font-medium">{job.title}</span>
                             <span className="text-xs text-muted-foreground">
                               {job.department || 'Sin departamento'}
                             </span>
                           </div>
                         </SelectItem>
                       ))
                     ) : (
                       <SelectItem value="loading" disabled>
                         Cargando puestos...
                       </SelectItem>
                     )}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Categoría eliminada - se gestiona automáticamente desde el puesto de trabajo */}
            </div>

            {/* Sección ASIGNACIÓN DE EQUIPOS */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                ASIGNACIÓN DE EQUIPOS
              </h3>
              
              <FormField label="Equipos asignados">
                <div className="space-y-3">
                  <Select 
                    value="" 
                    onValueChange={handleAddDepartment}
                    disabled={isAddingDepartment || availableDepartments.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        availableDepartments.length === 0 
                          ? "No hay equipos creados" 
                          : "Seleccionar equipo..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartments
                        .filter(dept => !selectedDepartments.includes(dept.id))
                        .map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {selectedDepartments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {assignments
                        .filter(a => selectedDepartments.includes(a.department_id))
                        .map(assignment => (
                          <Badge 
                            key={assignment.department_id} 
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1"
                          >
                            {assignment.department_name}
                            <button
                              onClick={() => handleRemoveDepartment(assignment.department_id)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                    </div>
                  )}

                  {availableDepartments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay equipos creados. Crea equipos en la configuración para poder asignarlos.
                    </p>
                  )}
                </div>
              </FormField>
            </div>

            {/* Sección AFILIACIÓN */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                AFILIACIÓN
              </h3>
              
              <FormField label="Establecimiento por defecto" required>
                {(() => {
                  const selectedOrg = organizations.find(org => org.id === establecimientoId);
                  return null;
                })()}
                <Select value={establecimientoId} onValueChange={(value) => {
                  setEstablecimientoId(value);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

               

            </div>
          </TabsContent>

          <TabsContent value="nominas" className="space-y-6">
            {/* Sección SALARIO */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                SALARIO
              </h3>
              

              <FormField label="Salario bruto mensual">
                <div className="relative">
                  <Input type="text" value={salarioBrutoMensual} onChange={e => setSalarioBrutoMensual(e.target.value)} className="pr-8" placeholder="" />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                </div>
              </FormField>

              <FormField label="Tasa horaria bruta">
                <div className="relative">
                  <Input type="text" value={tasaHorariaBruta} onChange={e => setTasaHorariaBruta(e.target.value)} className="pr-8" placeholder="" />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                </div>
              </FormField>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-6 border-t">
          <Button onClick={handleSave} className="w-full bg-teal-600 hover:bg-teal-700 text-white" onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
          }
        }}>
            Guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>;
};