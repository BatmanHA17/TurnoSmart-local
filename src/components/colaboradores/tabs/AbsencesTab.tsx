import { NotionCard } from "@/components/ui/notion-components";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useColaboradorById } from "@/hooks/useColaboradorFull";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { CompensatoryTimeOffView } from "@/components/CompensatoryTimeOffView";
import { EmployeeAbsenceRequests } from "@/components/EmployeeAbsenceRequests";
import { LeaveRequestFormContent } from "@/components/LeaveRequestFormContent";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCompensatoryTimeOff } from "@/hooks/useCompensatoryTimeOff";

export default function AbsencesTab() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colaborador } = useColaboradorById(id);
  const { role } = useUserRole();
  const { balance: compensatoryBalance, loading: compensatoryLoading } = useCompensatoryTimeOff(id || '');
  
  const [showCompensatoryTimeOff, setShowCompensatoryTimeOff] = useState(false);

  const isInactive = colaborador?.status === 'inactivo';

  return (
    <>
      <div className={`space-y-6 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Tarjetas superiores - deshabilitadas para Employee */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${role === 'user' ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Compensación de horas extras */}
          <NotionCard className="p-6 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setShowCompensatoryTimeOff(true)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Compensación de horas extras</p>
                <p className="text-2xl font-bold">
                  {compensatoryLoading ? "..." : `${compensatoryBalance}h`}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </NotionCard>

          {/* Recuperación de Días Festivos */}
          <NotionCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recuperación de Días Festivos</p>
                <p className="text-2xl font-bold">0h</p>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </NotionCard>
        </div>

        {/* Solicitudes de Ausencia */}
        <NotionCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 text-sm">☀️</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Solicitudes de Ausencia</h3>
            </div>
            <Button 
              variant="outline" 
              className="text-primary border-primary hover:bg-primary/10"
              onClick={() => {
                const colaboradorFullName = `${colaborador.nombre} ${colaborador.apellidos}`;
                navigate(`/ausencias/request/new?colaborador=${encodeURIComponent(colaboradorFullName)}`);
              }}
            >
              + Nueva Solicitud de Ausencia
            </Button>
          </div>

          {/* Tabla header */}
          <div className="grid grid-cols-4 bg-muted/30 p-3 rounded-lg mb-4">
            <span className="text-sm font-medium text-foreground">Fecha(s) de Ausencia</span>
            <span className="text-sm font-medium text-foreground">Número de Días</span>
            <span className="text-sm font-medium text-foreground">Tipo</span>
            <span className="text-sm font-medium text-foreground">Estado</span>
          </div>

          {/* Solicitudes del colaborador */}
          <EmployeeAbsenceRequests 
            colaboradorName={colaborador ? `${colaborador.nombre} ${colaborador.apellidos}` : ''}
            colaboradorId={colaborador?.id || ''}
          />
        </NotionCard>
      </div>

      {/* Dialogs */}
      {colaborador && (
        <>
          {showCompensatoryTimeOff && (
            <CompensatoryTimeOffView
              onBack={() => setShowCompensatoryTimeOff(false)}
              colaboradorId={colaborador.id}
              colaboradorName={`${colaborador.nombre} ${colaborador.apellidos}`}
            />
          )}
        </>
      )}
    </>
  );
}
