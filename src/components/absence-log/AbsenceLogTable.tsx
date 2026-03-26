import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { designTokens } from "@/design-tokens";
import { esStrings } from "@/i18n/es";
import { useAbsenceRequests, type AbsenceRequest } from "@/hooks/useAbsenceRequests";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface Ausencia {
  id: string;
  fecha: string;
  estatus: string;
  nombre: string;
  equipo: string;
  tipoAusencia: string;
  periodoAusencia: string;
  duracion: string;
}

interface AbsenceLogTableProps {
  onEmpleadoClick: (ausencia: Ausencia) => void;
  className?: string;
}

// Helper function to convert AbsenceRequest to Ausencia format
const convertToAusencia = (request: AbsenceRequest): Ausencia => {
  // Parse dates more safely
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    
    // Handle different date formats
    if (dateStr.includes('/')) {
      // Format: "16 de septiembre de 2025" or "16/09/2025"
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    
    // Try parsing as ISO date or other formats
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const startDate = parseDate(request.start_date);
  const endDate = parseDate(request.end_date);
  const duration = Math.max(1, differenceInDays(endDate, startDate) + 1);
  
  return {
    id: request.id,
    fecha: format(parseDate(request.submitted_date), "dd/MM/yyyy", { locale: es }),
    estatus: request.status === 'pending' ? 'Pendiente' : 
             request.status === 'approved' ? 'Aprobado' : 'Rechazado',
    nombre: request.employee_name,
    equipo: 'Rota', // Usamos valor fijo en lugar de campo eliminado
    tipoAusencia: request.leave_type,
    periodoAusencia: duration === 1 
      ? format(startDate, "dd/MM/yyyy", { locale: es })
      : `${format(startDate, "dd/MM/yyyy", { locale: es })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}`,
    duracion: duration === 1 ? "1 día" : `${duration} días`,
  };
};

export function AbsenceLogTable({ onEmpleadoClick, className }: AbsenceLogTableProps) {
  const { absenceRequests, loading, error } = useAbsenceRequests();
  const [sortField, setSortField] = React.useState<keyof Ausencia | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  // Convert database requests to display format
  const ausencias = React.useMemo(() => {
    return absenceRequests.map(convertToAusencia);
  }, [absenceRequests]);

  const handleSort = (field: keyof Ausencia) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAusencias = React.useMemo(() => {
    if (!sortField) return ausencias;

    return [...ausencias].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [ausencias, sortField, sortDirection]);

  // Loading state
  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("bg-white rounded-lg border border-red-200 overflow-hidden", className)}>
        <div className="p-6 text-center text-red-600">
          <p>Error al cargar las solicitudes de ausencia</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (ausencias.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
        <div className="p-6 text-center text-muted-foreground">
          <p>No hay solicitudes de ausencia registradas</p>
        </div>
      </div>
    );
  }

  const getEstatusVariant = (estatus: string) => {
    switch (estatus.toLowerCase()) {
      case "aprobado":
        return "default";
      case "pendiente":
        return "secondary";
      case "rechazado":
        return "destructive";
      default:
        return "outline";
    }
  };

  const renderCellContent = (content: string, isWarning: boolean = false) => {
    if (isWarning || content === esStrings.sinInformacion) {
      return (
        <span className="text-orange-600 text-sm">
          {content}
        </span>
      );
    }
    return <span className="text-sm">{content}</span>;
  };

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/80">
            <TableHead className="font-medium text-gray-700">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-0 font-medium text-gray-700 hover:text-gray-900"
                onClick={() => handleSort("fecha")}
              >
                {esStrings.absenceLogTable.fecha}
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </Button>
            </TableHead>
            <TableHead className="font-medium text-gray-700">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-0 font-medium text-gray-700 hover:text-gray-900"
                onClick={() => handleSort("estatus")}
              >
                {esStrings.absenceLogTable.estatus}
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </Button>
            </TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.absenceLogTable.empleado}</TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.absenceLogTable.equipo}</TableHead>
            <TableHead className="font-medium text-gray-700">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-0 font-medium text-gray-700 hover:text-gray-900"
                onClick={() => handleSort("tipoAusencia")}
              >
                {esStrings.absenceLogTable.tipoAusencia}
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </Button>
            </TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.absenceLogTable.periodoAusencia}</TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.absenceLogTable.duracion}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAusencias.map((ausencia) => (
            <TableRow 
              key={ausencia.id}
              className="hover:bg-gray-50/50 transition-colors duration-150 border-b border-gray-100"
            >
              <TableCell>
                {renderCellContent(ausencia.fecha)}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={getEstatusVariant(ausencia.estatus)}
                  className="text-xs"
                >
                  {ausencia.estatus}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="link" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => onEmpleadoClick(ausencia)}
                >
                  {ausencia.nombre}
                </Button>
              </TableCell>
              <TableCell>
                {renderCellContent(ausencia.equipo)}
              </TableCell>
              <TableCell>
                {renderCellContent(ausencia.tipoAusencia)}
              </TableCell>
              <TableCell>
                {renderCellContent(ausencia.periodoAusencia)}
              </TableCell>
              <TableCell>
                {renderCellContent(ausencia.duracion)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export type { Ausencia };