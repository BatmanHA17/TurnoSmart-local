import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X, Trash2 } from "lucide-react";

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

interface EmployeeAbsenceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AbsenceRequest | null;
  empleadoNombre: string;
  isEmployeeView?: boolean; // Nueva prop para distinguir vista de empleado
}

export const EmployeeAbsenceDetailModal = ({ 
  open, 
  onOpenChange, 
  request,
  empleadoNombre,
  isEmployeeView = true // Por defecto es vista de empleado (sin botón suprimir)
}: EmployeeAbsenceDetailModalProps) => {
  if (!request) return null;

  // Determinar si debe mostrar el botón de suprimir
  const shouldShowDeleteButton = !isEmployeeView && 
    ['aceptada', 'aprobada', 'eliminada', 'accepted', 'approved', 'eliminated'].includes(request.status.toLowerCase());

  // Generar texto dinámico para el botón
  const getDeleteButtonText = () => {
    const type = request.type.toLowerCase();
    if (type === 'vacaciones') {
      return 'Suprimir las vacaciones';
    } else {
      return `Suprimir el ${request.type.toLowerCase()}`;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pendiente': { label: 'Pendiente', className: 'bg-orange-100 text-orange-800' },
      'pending': { label: 'Pendiente', className: 'bg-orange-100 text-orange-800' },
      'aprobada': { label: 'Aceptada', className: 'bg-green-100 text-green-800' },
      'approved': { label: 'Aceptada', className: 'bg-green-100 text-green-800' },
      'rechazada': { label: 'Rechazada', className: 'bg-red-100 text-red-800' },
      'rejected': { label: 'Rechazada', className: 'bg-red-100 text-red-800' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pendiente;
    return (
      <Badge className={`${statusInfo.className} font-medium px-3 py-1 rounded-full text-sm`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDateRange = () => {
    try {
      if (!request.startDate) return 'Fecha no disponible';
      
      let start = new Date(request.startDate);
      let end = new Date(request.endDate);
      
      // Validar que las fechas no estén invertidas
      if (start > end) {
        console.warn('Fechas invertidas detectadas, intercambiando fechas');
        [start, end] = [end, start]; // Intercambiar fechas
      }
      
      const formatSingleDate = (date: Date, period: string = "") => {
        const dayName = format(date, "EEEE", { locale: es });
        const dayNum = format(date, "dd", { locale: es });
        const monthName = format(date, "MMM", { locale: es });
        const year = format(date, "yyyy", { locale: es });
        
        const periodText = period ? ` (por la ${period})` : '';
        return `${dayName} ${dayNum} ${monthName}. ${year}${periodText}`;
      };
      
      // Si las fechas fueron intercambiadas, también intercambiamos los períodos
      let startPeriod = request.startPeriod;
      let endPeriod = request.endPeriod;
      
      if (new Date(request.startDate) > new Date(request.endDate)) {
        [startPeriod, endPeriod] = [endPeriod, startPeriod];
      }
      
      const startFormatted = formatSingleDate(start, startPeriod);
      const endFormatted = formatSingleDate(end, endPeriod);
      
      return `Del ${startFormatted}\nal ${endFormatted}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return 'Error en el formato de fecha';
    }
  };

  const formatSubmittedDate = () => {
    try {
      if (!request.submittedDate) return '';
      
      // Handle different date formats
      let date: Date;
      if (request.submittedDate.includes('/')) {
        // Format: DD/MM/YYYY
        const [day, month, year] = request.submittedDate.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (request.submittedDate.includes('-')) {
        // Format: YYYY-MM-DD
        date = new Date(request.submittedDate);
      } else {
        // Try to parse as is
        date = new Date(request.submittedDate);
      }
      
      const dayNum = format(date, "d", { locale: es });
      const monthName = format(date, "MMMM", { locale: es });
      const year = format(date, "yyyy", { locale: es });
      
      return `${dayNum}º ${monthName} ${year}`;
    } catch (error) {
      console.error('Error formatting submitted date:', error);
      return request.submittedDate;
    }
  };

  const getEmployeeInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getStatusMessage = () => {
    switch (request.status) {
      case 'pendiente':
      case 'pending':
        return 'A la espera de ser tratado';
      case 'aprobada':
      case 'approved':
        return 'Solicitud aprobada y procesada';
      case 'rechazada':
      case 'rejected':
        return 'Solicitud rechazada';
      default:
        return 'A la espera de ser tratado';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] p-0 bg-white overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-gray-900">Información sobre la ausencia</h2>
          </div>
          <div className="mt-3">
            {getStatusBadge(request.status)}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="mx-6 mb-6 bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-base font-medium text-gray-900 leading-relaxed mb-4 whitespace-pre-line">
            {formatDateRange()}
          </p>
          
          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-600 text-sm">{request.type.charAt(0).toUpperCase() + request.type.slice(1)}</span>
            <span className="text-2xl font-bold text-gray-900">{request.days} días</span>
          </div>
        </div>

        {/* Employee Info */}
        <div className="px-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {getEmployeeInitials(empleadoNombre)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{empleadoNombre}</p>
              <p className="text-gray-500 italic text-sm">
                Solicitud presentada el {formatSubmittedDate()}
              </p>
            </div>
          </div>

          {/* Manager Section */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              BB
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">BATMAN BATMAN</p>
              <p className="text-gray-500 italic text-sm">
                Solicitud aceptada el {formatSubmittedDate()}
              </p>
            </div>
          </div>
        </div>

        {/* Delete Button - Only show for approved/accepted/eliminated requests and not employee view */}
        {shouldShowDeleteButton && (
          <div className="px-6 pb-6">
            <Button 
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-4 rounded-xl"
              size="lg"
            >
              {getDeleteButtonText()}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};