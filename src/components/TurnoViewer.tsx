import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Download, History, Edit, Eye } from "lucide-react";
import { format } from "date-fns";

interface TurnoViewerProps {
  turno: any;
  onBack: () => void;
  onEdit?: () => void;
  onCreateRevision?: () => void;
  onSendEmail?: () => void;
  onDownload?: () => void;
}

export const TurnoViewer = ({ 
  turno, 
  onBack, 
  onEdit, 
  onCreateRevision, 
  onSendEmail, 
  onDownload 
}: TurnoViewerProps) => {
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{turno.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={turno.status === 'published' ? 'default' : 'secondary'}>
              {turno.status === 'published' ? 'Publicado' : turno.status === 'revision' ? 'En Revisión' : 'Draft'}
            </Badge>
            <span className="text-sm text-muted-foreground">v{turno.version}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {turno.status === 'published' && (
            <>
              <Button variant="outline" onClick={() => window.open(`/turno/${turno.id}`, '_blank')}>
                <Eye className="h-4 w-4 mr-2" />
                Ver público
              </Button>
              <Button variant="outline" onClick={onSendEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
              <Button variant="outline" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              <Button variant="outline" onClick={onCreateRevision}>
                <History className="h-4 w-4 mr-2" />
                Crear Revisión
              </Button>
            </>
          )}
          {(turno.status === 'draft' || turno.status === 'revision') && onEdit && (
            <>
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Turno Details */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Turno</CardTitle>
        <CardDescription>
          Detalles del horario público del {format(new Date(turno.date_range_start), "dd/MM/yyyy")} al {format(new Date(turno.date_range_end), "dd/MM/yyyy")}
        </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Empleados</label>
              <p className="text-lg font-semibold">{turno.employee_count}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Creado</label>
              <p className="text-sm">{format(new Date(turno.created_at), "dd/MM/yyyy HH:mm")}</p>
            </div>
            {turno.published_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Publicado</label>
                <p className="text-sm">{format(new Date(turno.published_at), "dd/MM/yyyy HH:mm")}</p>
              </div>
            )}
            {turno.sent_emails && turno.sent_emails.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Enviado a</label>
                <p className="text-sm">{turno.sent_emails.length} destinatarios</p>
              </div>
            )}
          </div>

          {/* Shift Schedule Display */}
          {turno.shift_data && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Horarios de Trabajo</h3>
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-8 gap-2 text-sm">
                  <div className="font-medium">Empleado</div>
                  {(() => {
                    // Generar los días y sus números correspondientes
                    const startDate = new Date(turno.date_range_start);
                    const endDate = new Date(turno.date_range_end);
                    const days = [];
                    
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                      days.push(new Date(d));
                    }
                    
                    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                    
                    return days.map((day, index) => (
                      <div key={index} className="font-medium text-center">
                        <div className="text-xs">{dayNames[day.getDay()]}</div>
                        <div className="text-xs text-muted-foreground">{day.getDate()}</div>
                      </div>
                    ));
                  })()}
                  
                  {turno.shift_data && turno.shift_data.employees ? (
                    // Handle the correct structure with employees array
                    turno.shift_data.employees.map((employee: any, index: number) => (
                      <div key={employee.id || index} className="contents">
                        <div className="py-2 font-medium">{employee.name || `Empleado ${index + 1}`}</div>
                        {(() => {
                          // Obtener los días del período
                          const startDate = new Date(turno.date_range_start);
                          const endDate = new Date(turno.date_range_end);
                          const days = [];
                          
                          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                            days.push(new Date(d));
                          }
                          
                          return days.map((day, dayIndex) => {
                            const dateString = day.toISOString().split('T')[0];
                            let displayText = "L"; // Default to libre
                            
                            // Buscar en schedule usando el índice del día
                            const daySchedule = employee.schedule && employee.schedule[dayIndex];
                            
                            if (daySchedule) {
                              if (daySchedule.statusCode === "L") {
                                displayText = "L";
                              } else if (daySchedule.statusCode === "X" && daySchedule.startTime) {
                                displayText = daySchedule.startTime;
                              } else if (daySchedule.statusCode === "XB" && daySchedule.startTime) {
                                displayText = `${daySchedule.startTime} (B)`;
                              } else if (daySchedule.statusCode) {
                                displayText = daySchedule.statusCode;
                              }
                            } else if (turno.shift_data.assignments) {
                              // Buscar en assignments usando la fecha exacta
                              const assignment = turno.shift_data.assignments.find((a: any) => 
                                a.employeeId === employee.id && a.date === dateString
                              );
                              
                              if (assignment) {
                                if (assignment.statusCode === "L") {
                                  displayText = "L";
                                } else if (assignment.statusCode === "X" && assignment.startTime) {
                                  displayText = assignment.startTime;
                                } else if (assignment.statusCode === "XB" && assignment.startTime) {
                                  displayText = `${assignment.startTime} (B)`;
                                } else if (assignment.statusCode) {
                                  displayText = assignment.statusCode;
                                }
                              }
                            }
                            
                            return (
                              <div key={dayIndex} className="py-2 text-center text-xs">
                                <div className="font-mono">{displayText}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ))
                  ) : turno.shift_data && turno.shift_data.assignments ? (
                    // Handle assignments format directly
                    (() => {
                      // Group assignments by employee
                      const employeeAssignments: Record<string, any[]> = {};
                      turno.shift_data.assignments.forEach((assignment: any) => {
                        if (!employeeAssignments[assignment.employeeId]) {
                          employeeAssignments[assignment.employeeId] = [];
                        }
                        employeeAssignments[assignment.employeeId].push(assignment);
                      });

                      return Object.entries(employeeAssignments).map(([employeeId, assignments]) => {
                        // Find employee info
                        const employee = turno.shift_data.employees?.find((emp: any) => emp.id === employeeId);
                        const employeeName = employee?.name || `Empleado ${employeeId.slice(-4)}`;

                        return (
                          <div key={employeeId} className="contents">
                            <div className="py-2 font-medium">{employeeName}</div>
                            {(() => {
                              // Obtener los días del período
                              const startDate = new Date(turno.date_range_start);
                              const endDate = new Date(turno.date_range_end);
                              const days = [];
                              
                              for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                                days.push(new Date(d));
                              }
                              
                              return days.map((day, dayIndex) => {
                                const dateString = day.toISOString().split('T')[0];
                                const assignment = assignments.find(a => a.date === dateString);
                                let displayText = "L"; // Default to libre
                                
                                if (assignment) {
                                  if (assignment.statusCode === "L") {
                                    displayText = "L";
                                  } else if (assignment.statusCode === "X" && assignment.startTime) {
                                    displayText = assignment.startTime;
                                  } else if (assignment.statusCode === "XB" && assignment.startTime) {
                                    displayText = `${assignment.startTime} (B)`;
                                  } else if (assignment.statusCode) {
                                    displayText = assignment.statusCode;
                                  }
                                }
                                
                                return (
                                  <div key={dayIndex} className="py-2 text-center text-xs">
                                    <div className="font-mono">{displayText}</div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className="col-span-8 text-center text-muted-foreground py-4">
                      No hay datos de horarios disponibles
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};