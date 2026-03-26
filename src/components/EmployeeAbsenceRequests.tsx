import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AbsenceDetailsModal } from "@/components/AbsenceDetailsModal";
import { EmployeeAbsenceDetailModal } from "@/components/EmployeeAbsenceDetailModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AbsenceRequest {
  id: string;
  startDate: string;
  endDate: string;
  startPeriod?: string;
  endPeriod?: string;
  days: number;
  type: string;
  status: "pending" | "approved" | "rejected" | "eliminated";
  submittedDate: string;
  reason?: string;
}

interface EmployeeAbsenceRequestsProps {
  colaboradorName: string;
  colaboradorId: string;
}

export const EmployeeAbsenceRequests = ({ colaboradorName, colaboradorId }: EmployeeAbsenceRequestsProps) => {
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmployeeDetailModal, setShowEmployeeDetailModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener las solicitudes del localStorage específicas del colaborador
    const getStoredRequests = () => {
      try {
        // Leer tanto de la nueva estructura como de la antigua
        const newRequests = JSON.parse(localStorage.getItem('absenceRequests') || '[]');
        const oldRequests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
        
        console.log('EmployeeAbsenceRequests - colaboradorName received:', colaboradorName);
        console.log('EmployeeAbsenceRequests - all new requests:', newRequests);
        console.log('EmployeeAbsenceRequests - all old requests:', oldRequests);
        
        // Combinar ambas fuentes y eliminar duplicados por ID
        const allRequests = [...newRequests, ...oldRequests];
        const uniqueRequests = allRequests.filter((request, index, arr) =>
          arr.findIndex(r => r.id === request.id) === index
        );
        
        // Filtrar solicitudes por colaborador (excluyendo las eliminadas)
        // Hacer la comparación más flexible para manejar diferentes formatos de nombres
        const employeeRequests = uniqueRequests.filter((request: any) => {
          const requestEmployee = (request.empleado || request.employee)?.toLowerCase().trim();
          const colaboradorLower = colaboradorName?.toLowerCase().trim();
          
          console.log(`Comparing: "${requestEmployee}" vs "${colaboradorLower}"`);
          
          const isNotEliminated = request.estado !== 'eliminated' && request.status !== 'eliminated';
          const nameMatch = requestEmployee === colaboradorLower ||
            requestEmployee?.includes(colaboradorLower?.split(' ')[0]) ||
            colaboradorLower?.includes(requestEmployee?.split(' ')[0]) ||
            // También verificar con "SPIDERMAN" vs "Spider Man"
            requestEmployee?.replace(/\s+/g, '').includes(colaboradorLower?.replace(/\s+/g, '')) ||
            colaboradorLower?.replace(/\s+/g, '').includes(requestEmployee?.replace(/\s+/g, ''));
          
          return isNotEliminated && nameMatch;
        });

        console.log('EmployeeAbsenceRequests - filtered employee requests:', employeeRequests);

        // Convertir a formato necesario
        const formattedRequests: AbsenceRequest[] = employeeRequests.map((request: any) => {
          // Manejar tanto el formato nuevo como el antiguo
          if (request.fechaInicio) {
            // Formato nuevo
            return {
              id: request.id,
              startDate: request.fechaInicio,
              endDate: request.fechaFin,
              startPeriod: request.periodoInicio,
              endPeriod: request.periodoFin,
              days: request.dias,
              type: request.tipo,
              status: request.estado,
              submittedDate: request.fechaSolicitud,
              reason: request.comentario
            };
          } else {
            // Formato antiguo - extraer períodos del dateRange
            const parseOldFormat = (dateRange: string) => {
              // Ejemplo: "Del 16 septiembre 2025 Mañana al 30 septiembre 2025 Tarde"
              const parts = dateRange.split(' al ');
              const startPart = parts[0]?.replace('Del ', '') || '';
              const endPart = parts[1] || '';
              
              const extractDateAndPeriod = (part: string) => {
                const words = part.trim().split(' ');
                const period = words[words.length - 1]?.toLowerCase();
                const date = words.slice(0, -1).join(' ');
                return { date, period };
              };
              
              const start = extractDateAndPeriod(startPart);
              const end = extractDateAndPeriod(endPart);
              
              return { start, end };
            };
            
            const parsed = parseOldFormat(request.dateRange || '');
            
            return {
              id: request.id,
              startDate: parsed.start.date || request.requestDetails?.startDate || '',
              endDate: parsed.end.date || request.requestDetails?.endDate || '',
              startPeriod: parsed.start.period,
              endPeriod: parsed.end.period,
              days: parseInt(request.days?.replace(' días', '') || '0'),
              type: request.leaveType,
              status: request.status === 'approved' ? 'aprobada' : request.status === 'pending' ? 'pendiente' : request.status,
              submittedDate: request.submittedDate || request.presentedDate,
              reason: request.requestDetails?.reason
            };
          }
        });

        setRequests(formattedRequests);
      } catch (error) {
        console.error('Error loading employee absence requests:', error);
        setRequests([]);
      }
    };

    getStoredRequests();

    // Escuchar cambios en las solicitudes de ausencia
    const handleStorageChange = () => {
      getStoredRequests();
    };

    // Escuchar eventos personalizados de actualización para ambas fuentes
    const handleForceUpdate = () => {
      getStoredRequests();
    };

    window.addEventListener('absenceRequestsUpdated', handleStorageChange);
    window.addEventListener('leaveRequestsUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('forceEmployeeAbsenceUpdate', handleForceUpdate);

    return () => {
      window.removeEventListener('absenceRequestsUpdated', handleStorageChange);
      window.removeEventListener('leaveRequestsUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('forceEmployeeAbsenceUpdate', handleForceUpdate);
    };
  }, [colaboradorName]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Pendiente</Badge>;
      case 'aprobada':
        return <Badge className="text-green-700 bg-green-100">Aprobada</Badge>;
      case 'rechazada':
        return <Badge variant="destructive">Rechazada</Badge>;
      case 'eliminada':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Eliminada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const formatDateRange = (startDate: string, endDate: string, startPeriod: string = "", endPeriod: string = "") => {
    if (!startDate) return 'Fecha no disponible';
    
    try {
      // Parse dates and format them according to the reference image: "Desde el 17 sep. 2025 (Mañana) Hasta el 24 sep. 2025 (tarde)"
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const formatSingleDate = (date: Date, period: string) => {
        const formatted = format(date, "d MMM yyyy", { locale: es });
        const periodText = period ? ` (${period.charAt(0).toUpperCase() + period.slice(1)})` : '';
        return `${formatted}${periodText}`;
      };
      
      if (startDate === endDate || !endDate) {
        return `El ${formatSingleDate(start, startPeriod)}`;
      }
      
      return `Desde el ${formatSingleDate(start, startPeriod)}\nHasta el ${formatSingleDate(end, endPeriod)}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha no disponible';
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <p className="text-center text-muted-foreground text-sm">
          No hay solicitudes de ausencia para mostrar...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div 
          key={request.id}
          className="grid grid-cols-4 items-center p-4 border border-border/20 rounded-lg hover:bg-muted/10 transition-colors cursor-pointer group"
          onClick={() => {
            navigate(`/ausencias/${request.id}`);
          }}
        >
          {/* Fecha(s) de Ausencia */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground whitespace-pre-line">
              {formatDateRange(request.startDate, request.endDate, request.startPeriod, request.endPeriod)}
            </p>
          </div>

          {/* Número de Días */}
          <div>
            <p className="text-sm text-foreground">
              {request.days} día{request.days !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Tipo */}
          <div>
            <p className="text-sm text-foreground">{request.type}</p>
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between">
            {getStatusBadge(request.status)}
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      ))}
      
      {/* Employee Detail Modal - Read-only view for employees */}
      <EmployeeAbsenceDetailModal 
        open={showEmployeeDetailModal}
        onOpenChange={setShowEmployeeDetailModal}
        request={selectedRequest}
        empleadoNombre={colaboradorName}
      />
      
      {/* Details Modal */}
      <AbsenceDetailsModal 
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </div>
  );
};