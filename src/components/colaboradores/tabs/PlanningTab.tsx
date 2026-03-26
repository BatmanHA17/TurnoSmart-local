import { NotionCard } from "@/components/ui/notion-components";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronUp, ChevronDown, Edit, FileText, Settings } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useColaboradorById } from "@/hooks/useColaboradorFull";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AccessManagementDialog } from "@/components/AccessManagementDialog";
import { EmployeePlanningConfig } from "@/components/EmployeePlanningConfig";
import { AvailabilitySheet } from "@/components/AvailabilitySheet";
import { useEmployeeViewPermissions } from "@/hooks/useEmployeeViewPermissions";

export default function PlanningTab() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colaborador } = useColaboradorById(id);
  const { assignments: teamAssignments } = useTeamAssignments(id || '');
  const { organizations } = useOrganizations();
  const { isEmployee } = useEmployeeViewPermissions();
  
  const [isAccessMenuExpanded, setIsAccessMenuExpanded] = useState(false);
  const [isPlanningMenuExpanded, setIsPlanningMenuExpanded] = useState(false);
  const [generalizedAccess, setGeneralizedAccess] = useState(colaborador?.has_generalized_access || false);
  const [savingGeneralizedAccess, setSavingGeneralizedAccess] = useState(false);
  const [employeePlannable, setEmployeePlannable] = useState(true);
  const [isAccessManagementOpen, setIsAccessManagementOpen] = useState(false);
  const [isPlanningConfigOpen, setIsPlanningConfigOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);

  const isInactive = colaborador?.status === 'inactivo';

  const handleGeneralizedAccessToggle = async (checked: boolean) => {
    if (!colaborador) return;
    
    setSavingGeneralizedAccess(true);
    try {
      const { error } = await supabase
        .from('colaboradores')
        .update({ has_generalized_access: checked })
        .eq('id', colaborador.id);

      if (error) throw error;
      
      setGeneralizedAccess(checked);
      toast.success(checked ? "Acceso generalizado activado" : "Acceso generalizado desactivado");
    } catch (error) {
      console.error('Error updating generalized access:', error);
      toast.error("Error al actualizar el acceso");
    } finally {
      setSavingGeneralizedAccess(false);
    }
  };

  return (
    <>
      <div className={`space-y-6 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Acceso y planificación */}
        <NotionCard className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 text-sm">📅</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Acceso y planificación</h2>
          </div>

          <div className="space-y-4">
            {!isEmployee ? (
              <>
                {/* Acceso a los equipos */}
                <div className="border border-border/30 rounded-lg">
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => setIsAccessMenuExpanded(!isAccessMenuExpanded)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">👁️</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Acceso a los equipos</h4>
                        <p className="text-sm text-muted-foreground">Da al empleado visibilidad sobre más equipos. Necesario para la planificación.</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isAccessMenuExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Menú expandible de acceso generalizado */}
                  {isAccessMenuExpanded && (
                    <div className="border-t border-border/30 p-6 bg-muted/5">
                      {/* Acceso Generalizado con toggle */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground mb-1">Acceso Generalizado</h5>
                          <p className="text-xs text-muted-foreground">
                            Habilite el acceso generalizado para que este usuario pueda ver los horarios de todas las ubicaciones y equipos.
                          </p>
                        </div>
                        <Switch
                          checked={generalizedAccess}
                          disabled={savingGeneralizedAccess}
                          onCheckedChange={handleGeneralizedAccessToggle}
                          className="ml-4"
                        />
                      </div>
                      
                      {/* Botón Editar Acceso */}
                      <div className="flex justify-end mt-4 mb-6">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={generalizedAccess}
                          onClick={() => setIsAccessManagementOpen(true)}
                          className="text-sm h-8 px-3"
                        >
                          Editar Acceso
                        </Button>
                      </div>

                      {/* Tabla de Establecimiento y Equipos */}
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h6 className="text-sm font-semibold text-foreground mb-3">Establecimiento</h6>
                          <p className="text-sm text-foreground">
                            {organizations.find(org => org.id === colaborador?.org_id)?.name || 'Sin asignar'}
                          </p>
                        </div>
                        <div>
                          <h6 className="text-sm font-semibold text-foreground mb-3">Equipos</h6>
                          <p className="text-sm text-foreground">
                            {teamAssignments.length > 0 
                              ? teamAssignments
                                  .filter(assignment => assignment.has_job || teamAssignments.length === 1)
                                  .map(assignment => assignment.department_name)
                                  .join(', ')
                              : 'Sin asignar'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Turnos en el planning */}
                <div className="border border-border/30 rounded-lg">
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => setIsPlanningMenuExpanded(!isPlanningMenuExpanded)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">📋</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Turnos en el planning</h4>
                        <p className="text-sm text-muted-foreground">Permite que el empleado sea programado en varios equipos. Requiere acceso a los equipos mencionados.</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isPlanningMenuExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Menú expandible de empleado planificable */}
                  {isPlanningMenuExpanded && (
                    <div className="border-t border-border/30 p-6 bg-muted/5">
                      {/* Empleado Planificable con toggle */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground mb-1">Empleado planificable</h5>
                          <p className="text-xs text-muted-foreground">
                            Permite que el empleado aparezca en el planning en las fechas de su contrato. Si desactiva esta opción, se ocultará todo el historial de horarios. Para bloquear el acceso al empleado, puede{" "}
                            <button className="text-foreground underline hover:no-underline">
                              suspender su acceso
                            </button>
                          </p>
                        </div>
                        <Switch
                          checked={employeePlannable}
                          onCheckedChange={setEmployeePlannable}
                          className="ml-4"
                        />
                      </div>
                      
                      {/* Botón Editar */}
                      <div className="flex justify-end mt-4 mb-6">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={!employeePlannable}
                          onClick={() => setIsPlanningConfigOpen(true)}
                          className="text-sm h-8 px-3"
                        >
                          <Edit className="w-3 h-3 mr-1.5" />
                          Editar
                        </Button>
                      </div>

                      {/* Tabla de Establecimiento y Equipos */}
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h6 className="text-sm font-semibold text-foreground mb-3">Establecimiento</h6>
                          <p className="text-sm text-foreground">
                            {organizations.find(org => org.id === colaborador?.org_id)?.name || 'Sin asignar'}
                          </p>
                        </div>
                        <div>
                          <h6 className="text-sm font-semibold text-foreground mb-3">Equipos</h6>
                          <p className="text-sm text-foreground">
                            {teamAssignments.length > 0 
                              ? teamAssignments
                                  .filter(assignment => assignment.has_job || teamAssignments.length === 1)
                                  .map(assignment => assignment.department_name)
                                  .join(', ')
                              : 'Sin asignar'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  No tienes permisos para acceder a estas configuraciones.
                </p>
              </div>
            )}
          </div>
        </NotionCard>

        {/* Horas Trabajadas y Disponibilidad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Horas Trabajadas */}
          <NotionCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-xs">📊</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Horas Trabajadas</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80"
                onClick={() => navigate(`/colaboradores/${colaborador?.id}/tiempo-trabajo`)}
              >
                <FileText className="w-4 h-4 mr-1" />
                Ver Historial
              </Button>
            </div>

            <div className="space-y-3">
              {/* Header con fondo gris sutil */}
              <div className="grid grid-cols-2 bg-muted/30 p-3 rounded-lg">
                <span className="text-sm font-medium text-foreground">Periodo</span>
                <span className="text-sm font-medium text-foreground">Horas Trabajadas</span>
              </div>
              
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <p className="text-center text-muted-foreground text-sm">
                  Puede ver las últimas hojas de asistencia de<br />
                  {colaborador?.nombre} {colaborador?.apellidos} aquí
                </p>
              </div>
            </div>
          </NotionCard>

          {/* Disponibilidad */}
          <NotionCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-xs">⏰</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">Disponibilidad</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80"
                onClick={() => setIsAvailabilityOpen(true)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </div>

            {(() => {
              try {
                const disponibilidad = colaborador?.disponibilidad_semanal 
                  ? (typeof colaborador.disponibilidad_semanal === 'string' 
                      ? JSON.parse(colaborador.disponibilidad_semanal)
                      : colaborador.disponibilidad_semanal)
                  : [];
                
                const hasAvailability = Array.isArray(disponibilidad) && disponibilidad.length > 0;
                
                if (hasAvailability) {
                  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                  
                  return (
                    <div className="space-y-3">
                      {daysOfWeek.map(day => {
                        const dayData = disponibilidad.find((d: any) => d.day === day);
                        const status = dayData?.status || 'disponible';
                        
                        return (
                          <div key={day} className="flex items-center justify-between py-2 border-b border-border/20 last:border-b-0">
                            <span className="text-sm text-foreground">{day}</span>
                            <div className="flex items-center gap-2">
                              {status === 'disponible' && (
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                                  <span>✓</span> Disponible
                                </span>
                              )}
                              {status === 'disponible_parte' && (
                                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                  Disponible en parte
                                  {dayData?.timeRange && ` (${dayData.timeRange})`}
                                </span>
                              )}
                              {status === 'no_disponible' && (
                                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                  No disponible
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <p className="text-center text-muted-foreground text-sm">
                        Ninguna disponibilidad configurada para<br />
                        {colaborador?.nombre} {colaborador?.apellidos}
                      </p>
                    </div>
                  );
                }
              } catch (error) {
                console.error('Error rendering availability:', error);
                return (
                  <div className="text-center py-8">
                    <p className="text-center text-muted-foreground text-sm">
                      Error al cargar la disponibilidad
                    </p>
                  </div>
                );
              }
            })()}
          </NotionCard>
        </div>
      </div>

      {/* Dialogs */}
      {colaborador && (
        <>
          <AccessManagementDialog
            isOpen={isAccessManagementOpen}
            onClose={() => setIsAccessManagementOpen(false)}
            colaboradorId={colaborador.id}
            employeeName={`${colaborador.nombre} ${colaborador.apellidos}`}
          />
          <EmployeePlanningConfig
            isOpen={isPlanningConfigOpen}
            onClose={() => setIsPlanningConfigOpen(false)}
            employeeName={`${colaborador.nombre} ${colaborador.apellidos}`}
            colaboradorId={colaborador.id}
          />
          <AvailabilitySheet
            open={isAvailabilityOpen}
            onOpenChange={setIsAvailabilityOpen}
            employeeName={`${colaborador.nombre} ${colaborador.apellidos}`}
            colaboradorId={colaborador.id}
            currentAvailability={colaborador.disponibilidad_semanal}
          />
        </>
      )}
    </>
  );
}
