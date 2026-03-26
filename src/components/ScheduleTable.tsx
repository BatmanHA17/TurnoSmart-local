import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusCell } from "@/components/ui/status-cell";
import { getStatusLegend } from "@/utils/calculations";
import { EmployeeCompensatoryBalance } from "./EmployeeCompensatoryBalance";
import { RotaFilter } from "./RotaFilter";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddEmployeesToCalendarDialog } from "./AddEmployeesToCalendarDialog";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export function ScheduleTable() {
  const legend = getStatusLegend();
  const daysOfWeek = ['S', 'D', 'L', 'M', 'MI', 'J', 'V'];
  const currentDate = new Date();
  const monthDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [selectedRotaId, setSelectedRotaId] = useState<string | null>(null);
  const [filteredColaboradores, setFilteredColaboradores] = useState<any[]>([]);
  const [realShifts, setRealShifts] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user } = useAuth();
  const { role } = useUserRole();
  const { currentOrg } = useCurrentOrganization();

  // Fetch colaboradores from database with contract start date filtering
  useEffect(() => {
    const fetchColaboradores = async () => {
      if (!currentOrg?.org_id) {
        setColaboradores([]);
        return;
      }
      
      const currentDate = new Date();
      const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
      const thirtyDaysFromNow = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const today = new Date().toISOString().split('T')[0];
      
      // FILTRAR por org_id de la organización actual
      const { data, error } = await supabase
        .from('colaborador_full')
        .select('*')
        .eq('org_id', currentOrg.org_id)
        .or(`status.eq.activo,and(status.eq.inactivo,fecha_fin_contrato.gte.${today})`)
        .not('fecha_inicio_contrato', 'is', null)
        .gte('fecha_inicio_contrato', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('fecha_inicio_contrato', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('fecha_inicio_contrato', { ascending: false });
      
      if (!error && data) {
        
        // Obtener la fecha actual real (hoy)
        const hoy = new Date();
        const fechaActual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        
        
        // FILTRO ESTRICTO: Solo mostrar colaboradores que ya han comenzado su contrato
        const colaboradoresValidos = data.filter(colaborador => {
          if (!colaborador.fecha_inicio_contrato) {
            return false;
          }
          
          const fechaInicio = new Date(colaborador.fecha_inicio_contrato);
          const fechaInicioLimpia = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
          
          // Solo incluir si la fecha de inicio es HOY o en el pasado
          const yaComenzo = fechaInicioLimpia <= fechaActual;
          
          
          return yaComenzo;
        });
        
        
        setColaboradores(colaboradoresValidos);
      }
    };

    fetchColaboradores();
  }, [currentOrg?.org_id]);

  // Debug effect para monitorear cambios
  useEffect(() => {
  }, [colaboradores]);

  // Filter colaboradores by selected rota
  useEffect(() => {
    const filterByRota = async () => {
      if (!selectedRotaId || colaboradores.length === 0) {
        setFilteredColaboradores(colaboradores);
        return;
      }

      try {
        // Get members of the selected rota
        const { data: rotaMembers, error } = await supabase
          .from('team_members')
          .select('colaborador_id')
          .eq('team_id', selectedRotaId)
          .eq('is_active', true);

        if (error) throw error;

        const memberIds = rotaMembers?.map(member => member.colaborador_id) || [];
        const filtered = colaboradores.filter(col => memberIds.includes(col.id));
        setFilteredColaboradores(filtered);
      } catch (error) {
        console.error('Error filtering by rota:', error);
        setFilteredColaboradores(colaboradores);
      }
    };

    filterByRota();
  }, [selectedRotaId, colaboradores]);

  // Fetch real shifts from calendar_shifts table
  useEffect(() => {
    const fetchRealShifts = async () => {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('calendar_shifts')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date');
      
      if (!error && data) {
        setRealShifts(data);
      }
    };

    if (colaboradores.length > 0) {
      fetchRealShifts();
    }
  }, [colaboradores]);

  const generateRealSchedule = (colaboradorId: string, colaborador: any) => {
    const schedule = [];
    // Usar el año y mes actuales para el calendario
    const calendarYear = currentDate.getFullYear();
    const calendarMonth = currentDate.getMonth();
    
    for (let day = 1; day <= monthDays; day++) {
      const dateToCheck = new Date(calendarYear, calendarMonth, day);
      const dateStr = dateToCheck.toISOString().split('T')[0];
      
      // Verificar si el colaborador ya ha comenzado su contrato
      if (colaborador.fecha_inicio_contrato) {
        const startDate = new Date(colaborador.fecha_inicio_contrato);
        
        if (dateToCheck < startDate) {
          schedule.push('-'); // No ha comenzado aún
          continue;
        }
      }
      
      // Buscar turnos reales para este colaborador en esta fecha
      const dayShift = realShifts.find(shift => 
        shift.employee_id === colaboradorId && 
        shift.date === dateStr
      );
      
      if (dayShift) {
        // Si hay un turno específico, mostrar 'X' (presencial)
        schedule.push('X');
      } else {
        // Si no hay turno, asumir día libre 'L'
        schedule.push('L');
      }
    }
    
    return schedule;
  };

  // Generate calendar header usando mes y año actuales
  const calendarHeader = [];
  for (let day = 1; day <= monthDays; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = daysOfWeek[date.getDay()];
    calendarHeader.push({ day, dayOfWeek });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cuadrante de Turnos</h2>
          <p className="text-muted-foreground">
            Colaboradores activos con turnos basados en fecha de inicio de contrato
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              
              const fetchColaboradores = async () => {
                const currentDate = new Date();
                const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
                const thirtyDaysFromNow = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000));
                const today = new Date().toISOString().split('T')[0];
                
                const { data, error } = await supabase
                  .from('colaborador_full')
                  .select('*')
                  .or(`status.eq.activo,and(status.eq.inactivo,fecha_fin_contrato.gte.${today})`)
                  .not('fecha_inicio_contrato', 'is', null)
                  .gte('fecha_inicio_contrato', thirtyDaysAgo.toISOString().split('T')[0])
                  .lte('fecha_inicio_contrato', thirtyDaysFromNow.toISOString().split('T')[0])
                  .order('fecha_inicio_contrato', { ascending: false });
                
                if (!error && data) {
                  
                  const hoy = new Date();
                  const fechaActual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                  
                  
                  const colaboradoresValidos = data.filter(colaborador => {
                    if (!colaborador.fecha_inicio_contrato) return false;
                    
                    const fechaInicio = new Date(colaborador.fecha_inicio_contrato);
                    const fechaInicioLimpia = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
                    
                    const yaComenzo = fechaInicioLimpia <= fechaActual;
                    
                    return yaComenzo;
                  });
                  
                  setColaboradores(colaboradoresValidos);
                }
              };
              
              fetchColaboradores();
            }}
            variant="secondary"
            size="sm"
          >
            🔄 Reload
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir colaboradores manualmente
          </Button>
          <RotaFilter 
            selectedRotaId={selectedRotaId}
            onRotaChange={setSelectedRotaId}
            currentUserRole={role}
          />
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leyenda de Códigos</CardTitle>
          <CardDescription>
            Códigos utilizados en el cuadrante mensual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {legend.map((item) => (
              <div key={item.code} className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${item.color}`}>
                  {item.code}
                </div>
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cuadrante Mensual</CardTitle>
          <CardDescription>
            Visualización completa de todos los empleados y sus turnos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 sticky left-0 bg-background border-r">
                    Empleado
                  </TableHead>
                  {calendarHeader.map(({ day, dayOfWeek }) => (
                    <TableHead key={day} className="text-center min-w-12 p-1">
                      <div className="text-xs font-semibold">{dayOfWeek}</div>
                      <div className="text-sm">{day}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Personal Propio Section */}
                <TableRow className="bg-blue-50">
                  <TableCell colSpan={32} className="font-bold text-blue-800 border-r">
                    PERSONAL PROPIO
                  </TableCell>
                </TableRow>
                
                {filteredColaboradores
                  .filter(col => col.tipo_contrato !== 'ETT' || !col.tipo_contrato)
                  .map((colaborador) => {
                    const schedule = generateRealSchedule(colaborador.id, colaborador);
                    const contractHours = colaborador.tiempo_trabajo_semanal ? 
                      Math.round(colaborador.tiempo_trabajo_semanal / 5) : 8;
                    const contractUnit = contractHours === 8 ? 1.0 : 
                      contractHours === 6 ? 0.75 : 
                      contractHours === 5 ? 0.625 : 0.5;
                    
                    return (
                      <TableRow key={colaborador.id} className="hover:bg-muted/50">
                        <TableCell className="sticky left-0 bg-background border-r">
                           <div>
                             <div className="font-medium text-sm">{colaborador.nombre} {colaborador.apellidos}</div>
                             <div className="text-xs text-muted-foreground">
                               {colaborador.tipo_contrato || 'PROPIO'}
                             </div>
                             <Badge variant="outline" className="text-xs mt-1">
                               {contractHours}h ({contractUnit}U)
                             </Badge>
                              <EmployeeCompensatoryBalance 
                                colaboradorId={colaborador.id}
                                className="mt-1"
                              />
                           </div>
                        </TableCell>
                        {schedule.map((status, dayIndex) => (
                          <TableCell key={dayIndex} className="text-center p-1">
                            <StatusCell status={status} />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}

                {/* ETT Section */}
                <TableRow className="bg-orange-50">
                  <TableCell colSpan={32} className="font-bold text-orange-800 border-r">
                    PERSONAL ETT
                  </TableCell>
                </TableRow>
                
                {filteredColaboradores
                  .filter(col => col.tipo_contrato === 'ETT')
                  .map((colaborador) => {
                    const schedule = generateRealSchedule(colaborador.id, colaborador);
                    const contractHours = colaborador.tiempo_trabajo_semanal ? 
                      Math.round(colaborador.tiempo_trabajo_semanal / 5) : 8;
                    const contractUnit = contractHours === 8 ? 1.0 : 
                      contractHours === 6 ? 0.75 : 
                      contractHours === 5 ? 0.625 : 0.5;
                    
                    return (
                      <TableRow key={colaborador.id} className="hover:bg-muted/50">
                        <TableCell className="sticky left-0 bg-background border-r">
                           <div>
                             <div className="font-medium text-sm">{colaborador.nombre} {colaborador.apellidos}</div>
                             <div className="text-xs text-muted-foreground">
                               {colaborador.tipo_contrato || 'ETT'}
                             </div>
                             <Badge variant="outline" className="text-xs mt-1">
                               {contractHours}h ({contractUnit}U)
                             </Badge>
                              <EmployeeCompensatoryBalance 
                                colaboradorId={colaborador.id}
                                className="mt-1"
                              />
                           </div>
                        </TableCell>
                        {schedule.map((status, dayIndex) => (
                          <TableCell key={dayIndex} className="text-center p-1">
                            <StatusCell status={status} />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para añadir colaboradores manualmente */}
      <AddEmployeesToCalendarDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onEmployeesAdded={() => {
          // Refrescar la lista después de añadir colaboradores manualmente
          window.location.reload();
        }}
      />
    </div>
  );
}