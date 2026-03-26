import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Users, Plus, RefreshCw } from 'lucide-react';
import { useJobDepartments } from '@/hooks/useJobDepartments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';

interface TeamAssignmentCardProps {
  colaboradorId: string;
  colaboradorName: string;
  onAssignmentChange?: () => void;
}

interface AssignedDepartment {
  id: string;
  department_id: string;
  department_name: string;
  has_job: boolean;
  job_title?: string;
}

export function TeamAssignmentCard({ colaboradorId, colaboradorName, onAssignmentChange }: TeamAssignmentCardProps) {
  const { departments } = useJobDepartments();
  const { currentOrg } = useCurrentOrganization();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Obtener equipos asignados al colaborador usando colaborador_departments
  const [assignedDepartments, setAssignedDepartments] = useState<AssignedDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedDepartments();
  }, [colaboradorId, currentOrg?.org_id]);

  const fetchAssignedDepartments = async () => {
    if (!colaboradorId || !currentOrg?.org_id) return;

    try {
      setLoading(true);
      
      // Obtener asignaciones usando colaborador_departments (múltiples asignaciones)
      const { data: departmentAssignments, error: deptError } = await supabase
        .from('colaborador_departments')
        .select(`
          id,
          department_id,
          is_active,
          job_departments:department_id (
            id,
            value
          )
        `)
        .eq('colaborador_id', colaboradorId)
        .eq('org_id', currentOrg.org_id)
        .eq('is_active', true);

      if (deptError) {
        console.error('Error fetching department assignments:', deptError);
        return;
      }

      // Para cada departamento asignado, verificar si tiene jobs asociados
      const enrichedAssignments: AssignedDepartment[] = [];
      
      if (departmentAssignments && departmentAssignments.length > 0) {
        for (const assignment of departmentAssignments) {
          // Buscar jobs en este departamento
          const { data: jobs, error: jobsError } = await supabase
            .from('jobs')
            .select('id, title')
            .eq('department_id', assignment.department_id)
            .eq('org_id', currentOrg.org_id)
            .limit(1);

          const hasJob = !jobsError && jobs && jobs.length > 0;
          
          enrichedAssignments.push({
            id: assignment.id,
            department_id: assignment.department_id,
            department_name: (assignment.job_departments as any)?.value || 'Departamento sin nombre',
            has_job: hasJob,
            job_title: hasJob ? jobs[0].title : undefined
          });
        }
      }

      setAssignedDepartments(enrichedAssignments);
    } catch (error) {
      console.error('Error fetching assigned departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToDepartment = async () => {
    if (!selectedDepartmentId || !colaboradorId || !currentOrg?.org_id) {
      toast({
        title: "Error",
        description: "Selecciona un equipo para asignar",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);

    try {
      // Verificar si ya está asignado a este departamento
      const isAlreadyAssigned = assignedDepartments.some(
        assigned => assigned.department_id === selectedDepartmentId
      );

      if (isAlreadyAssigned) {
        toast({
          title: "Error",
          description: "El colaborador ya está asignado a este equipo",
          variant: "destructive"
        });
        setIsAssigning(false);
        return;
      }

      // Insertar asignación en colaborador_departments
      const user = await supabase.auth.getUser();
      const { error: insertError } = await supabase
        .from('colaborador_departments')
        .insert({
          colaborador_id: colaboradorId,
          department_id: selectedDepartmentId,
          org_id: currentOrg.org_id,
          assigned_by: user.data.user?.id,
          is_active: true
        });

      if (insertError) {
        throw insertError;
      }

      // Obtener nombre del departamento
      const selectedDept = departments.find(d => d.id === selectedDepartmentId);
      
      toast({
        title: "Asignación exitosa",
        description: `${colaboradorName} ha sido asignado al equipo ${selectedDept?.value}`
      });
      
      // Refrescar la lista de equipos asignados
      await fetchAssignedDepartments();
      setSelectedDepartmentId('');
      
      // Notificar al componente padre que hubo un cambio
      onAssignmentChange?.();
    } catch (error) {
      console.error('Error assigning to department:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al asignar el colaborador al equipo",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveFromDepartment = async (assignmentId: string, departmentName: string) => {
    setIsRemoving(assignmentId);

    try {
      // Desactivar la asignación en colaborador_departments
      const { error: updateError } = await supabase
        .from('colaborador_departments')
        .update({ is_active: false })
        .eq('id', assignmentId)
        .eq('org_id', currentOrg.org_id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Colaborador removido",
        description: `${colaboradorName} ha sido removido del equipo ${departmentName}`
      });
      
      // Refrescar la lista de equipos asignados
      await fetchAssignedDepartments();
      
      // Notificar al componente padre que hubo un cambio
      onAssignmentChange?.();
    } catch (error) {
      console.error('Error removing from department:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al remover el colaborador del equipo",
        variant: "destructive"
      });
    } finally {
      setIsRemoving(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAssignedDepartments();
    setIsRefreshing(false);
  };

  // Filtrar equipos disponibles (no asignados)
  const availableDepartments = departments.filter(dept => 
    !assignedDepartments.some(assigned => assigned.department_id === dept.id)
  );

  // Verificar si hay equipos sin puestos de trabajo
  const teamsWithoutJobs = assignedDepartments.filter(team => !team.has_job);
  const hasTeamsWithoutJobs = teamsWithoutJobs.length > 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipos Asignados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-pulse">Cargando equipos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          ASIGNACIÓN DE EQUIPOS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropdown de equipo */}
        {availableDepartments.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Equipo</label>
            <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar equipo..." />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                {availableDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Equipos asignados como badges */}
        {assignedDepartments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {assignedDepartments.map((assignment) => (
              <Badge 
                key={assignment.id} 
                variant="secondary"
                className="flex items-center gap-2 py-1 px-3"
              >
                <span>{assignment.department_name}</span>
                <button
                  onClick={() => handleRemoveFromDepartment(assignment.id, assignment.department_name)}
                  disabled={isRemoving === assignment.id}
                  className="hover:bg-destructive hover:text-destructive-foreground rounded-sm p-0.5 transition-colors"
                >
                  {isRemoving === assignment.id ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Botón asignar cuando hay equipos asignados y hay selección */}
        {assignedDepartments.length > 0 && availableDepartments.length > 0 && selectedDepartmentId && (
          <Button 
            onClick={handleAssignToDepartment}
            disabled={isAssigning}
            className="w-full"
          >
            {isAssigning ? (
              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Asignar al equipo seleccionado
              </>
            )}
          </Button>
        )}

        {/* Botón indicador cuando hay equipos asignados pero no hay selección */}
        {assignedDepartments.length > 0 && availableDepartments.length > 0 && !selectedDepartmentId && (
          <div className="text-sm text-muted-foreground text-center py-2">
            👆 Selecciona un equipo arriba para añadirlo
          </div>
        )}

        {/* Mostrar advertencia si hay equipos sin puestos */}
        {hasTeamsWithoutJobs && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              ⚠️ No hay puesto de trabajo en uno o varios de los equipos seleccionados
            </p>
          </div>
        )}

        {/* Botón de asignar (solo cuando no hay equipos asignados) */}
        {assignedDepartments.length === 0 && availableDepartments.length > 0 && (
          <Button 
            onClick={handleAssignToDepartment}
            disabled={!selectedDepartmentId || isAssigning}
            className="w-full"
          >
            {isAssigning ? (
              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              "Asignar"
            )}
          </Button>
        )}

        {departments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay equipos creados. <br />
            <span className="text-xs">Crea equipos en Configuración → Puestos → Equipos</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}