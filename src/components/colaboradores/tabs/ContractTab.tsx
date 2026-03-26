import { NotionCard } from "@/components/ui/notion-components";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useParams } from "react-router-dom";
import { useColaboradorById } from "@/hooks/useColaboradorFull";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useState } from "react";
import { ContractDetailsSheet } from "@/components/colaboradores/ContractDetailsSheet";
import { EditContractSheet } from "@/components/colaboradores/EditContractSheet";
import { TerminateContractDialog } from "@/components/colaboradores/TerminateContractDialog";

export default function ContractTab() {
  const { id } = useParams<{ id: string }>();
  const { colaborador } = useColaboradorById(id);
  const { assignments: teamAssignments } = useTeamAssignments(id || '');
  const { isAdmin } = useAdminPermissions();
  
  const [isContractDetailsOpen, setIsContractDetailsOpen] = useState(false);
  const [isEditContractOpen, setIsEditContractOpen] = useState(false);
  const [isTerminateContractOpen, setIsTerminateContractOpen] = useState(false);

  const isInactive = colaborador?.status === 'inactivo';

  return (
    <>
      <div className={`space-y-6 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="text-lg font-medium mb-6">Contratos</h3>
        
        {/* Verificar si tiene información de contrato */}
        {colaborador?.tipo_contrato ? (
          <>
            {/* Layout cuando SÍ tiene tipo de contrato */}
            <div className="space-y-6">
              <NotionCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <h4 className="text-base font-medium">Contrato actual</h4>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-600">
                          ⚙️ Acciones ▼
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-blue-600"
                          onClick={() => setIsContractDetailsOpen(true)}
                        >
                          👁️ Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-blue-600"
                          onClick={() => setIsEditContractOpen(true)}
                        >
                          ✏️ Declarar un cambio
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setIsTerminateContractOpen(true)}
                        >
                          🗑️ Terminar el contrato
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                    <span className="text-sm text-gray-900">
                      {colaborador.tipo_contrato || 'Sin especificar'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <Label className="text-sm font-medium text-gray-700">Inicio del contrato</Label>
                    <span className="text-sm text-gray-900">
                      {colaborador.fecha_inicio_contrato ? 
                        new Date(colaborador.fecha_inicio_contrato).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 
                        'No especificado'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <Label className="text-sm font-medium text-gray-700">Remuneración</Label>
                    <span className="text-sm text-gray-500">
                      No especificado
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <Label className="text-sm font-medium text-gray-700">Horas de trabajo semanales</Label>
                    <span className="text-sm text-gray-900">
                      {colaborador.tiempo_trabajo_semanal || 40} horas
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <Label className="text-sm font-medium text-gray-700">Número de días laborables por semana</Label>
                    <span className="text-sm text-gray-900">
                      {colaborador.tiempo_trabajo_semanal ? 
                        Math.ceil((colaborador.tiempo_trabajo_semanal / 8)) : 
                        5
                      } días
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <Label className="text-sm font-medium text-gray-700">Disponibilidad</Label>
                    <span className="text-sm text-gray-900">
                      {(() => {
                        if (!colaborador.disponibilidad_semanal) return "No especificado";
                        try {
                          const disponibilidad = typeof colaborador.disponibilidad_semanal === 'string' 
                            ? JSON.parse(colaborador.disponibilidad_semanal)
                            : colaborador.disponibilidad_semanal;
                          
                          if (!Array.isArray(disponibilidad) || disponibilidad.length === 0) {
                            return "No especificado";
                          }
                          
                          // Ordenar los días de lunes a domingo
                          const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                          const diasOrdenados = disponibilidad
                            .filter(dia => ordenDias.includes(dia))
                            .sort((a, b) => ordenDias.indexOf(a) - ordenDias.indexOf(b));
                          
                          return diasOrdenados.join(', ');
                        } catch {
                          return "No especificado";
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </NotionCard>

              {/* Información Laboral */}
              <NotionCard className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h4 className="text-base font-medium">Información Laboral</h4>
                </div>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <Label className="text-sm font-medium text-gray-700">Puesto de Trabajo</Label>
                     <span className="text-sm text-gray-900">
                       {colaborador?.jobs?.title || 'Sin puesto asignado'}
                     </span>
                   </div>
                   
                   <div className="flex justify-between items-center py-2 border-b border-gray-100">
                     <Label className="text-sm font-medium text-gray-700">Departamentos Asignados</Label>
                     <span className="text-sm text-gray-900">
                       {teamAssignments.length > 0 
                         ? teamAssignments.map(assignment => assignment.department_name).join(', ')
                         : colaborador?.jobs?.department || 'Sin especificar'
                       }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <Label className="text-sm font-medium text-gray-700">Responsable directo</Label>
                    <span className={`text-sm ${colaborador.responsable_directo ? 'text-gray-900' : 'text-red-600'}`}>
                      {colaborador.responsable_directo || '[responsable del employee]'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <Label className="text-sm font-medium text-gray-700">ID Empleado</Label>
                    <span className="text-sm text-gray-900">
                      {colaborador.empleado_id || 'Sin asignar'}
                    </span>
                  </div>
                </div>
              </NotionCard>

            </div>
          </>
        ) : (
          <>
            {/* Layout cuando NO tiene tipo de contrato */}
            <div className="space-y-6">
              {/* Notificación azul */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">ℹ</span>
                </div>
                <span className="text-blue-700 text-sm">
                  1 nuevos contratos están por venir.
                </span>
              </div>

              {/* Card de contrato actual */}
              <NotionCard className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <h4 className="text-base font-medium">Contrato actual</h4>
                </div>
                
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">No hay contrato en curso...</p>
                  <Button className="bg-black text-white hover:bg-gray-800 px-6">
                    Crear un contrato
                  </Button>
                </div>
              </NotionCard>
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      {colaborador && (
        <>
          <ContractDetailsSheet
            open={isContractDetailsOpen}
            onOpenChange={setIsContractDetailsOpen}
            colaborador={colaborador}
          />
          <EditContractSheet
            open={isEditContractOpen}
            onOpenChange={setIsEditContractOpen}
            colaborador={colaborador}
          />
          <TerminateContractDialog
            open={isTerminateContractOpen}
            onOpenChange={setIsTerminateContractOpen}
            colaborador={colaborador}
          />
        </>
      )}
    </>
  );
}
