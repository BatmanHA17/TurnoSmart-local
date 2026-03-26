import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { EmployeeAbsenceDetailModal } from "@/components/EmployeeAbsenceDetailModal";

interface AbsenceRequest {
  id: string;
  startDate: string;
  endDate: string;
  startPeriod?: string;
  endPeriod?: string;
  days: number;
  type: string;
  status: "pending" | "approved" | "rejected" | "eliminated" | "pendiente" | "aprobada" | "rechazada";
  submittedDate: string;
  reason?: string;
  employee?: string;
}

/**
 * Wrapper para usar EmployeeAbsenceDetailModal como ruta persistente.
 * Permite deep-linking a /ausencias/:requestId manteniendo el mismo UI.
 */
export const AbsenceDetailRoute = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<AbsenceRequest | null>(null);
  const [empleadoNombre, setEmpleadoNombre] = useState<string>("");

  useEffect(() => {
    // Cargar solicitud desde localStorage
    const loadRequest = () => {
      try {
        const newRequests = JSON.parse(localStorage.getItem('absenceRequests') || '[]');
        const oldRequests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
        
        const allRequests = [...newRequests, ...oldRequests];
        const found = allRequests.find((req: any) => req.id === requestId);
        
        if (found) {
          // Normalizar formato (manejar tanto nuevo como antiguo)
          const normalized: AbsenceRequest = {
            id: found.id,
            startDate: found.fechaInicio || found.requestDetails?.startDate || '',
            endDate: found.fechaFin || found.requestDetails?.endDate || '',
            startPeriod: found.periodoInicio,
            endPeriod: found.periodoFin,
            days: found.dias || parseInt(found.days?.replace(' días', '') || '0'),
            type: found.tipo || found.leaveType,
            status: found.estado || found.status,
            submittedDate: found.fechaSolicitud || found.submittedDate,
            reason: found.comentario || found.requestDetails?.reason,
            employee: found.empleado || found.employee
          };
          
          setRequest(normalized);
          setEmpleadoNombre(found.empleado || found.employee || 'Desconocido');
        } else {
          // Si no se encuentra, volver atrás
          navigate(-1);
        }
      } catch (error) {
        console.error('Error loading absence request:', error);
        navigate(-1);
      }
    };

    loadRequest();
  }, [requestId, navigate]);

  const handleClose = () => {
    navigate(-1);
  };

  if (!request) {
    return null; // O mostrar loading spinner
  }

  return (
    <EmployeeAbsenceDetailModal 
      open={true}
      onOpenChange={handleClose}
      request={request}
      empleadoNombre={empleadoNombre}
      isEmployeeView={true}
    />
  );
};
