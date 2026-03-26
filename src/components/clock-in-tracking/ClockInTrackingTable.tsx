import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { esStrings } from "@/i18n/es";
import { cn } from "@/lib/utils";

// Definir el tipo para un registro de fichaje
export interface SeguimientoFichaje {
  id: string;
  fecha: string;
  empleado: string;
  planificado: string;
  fichado: string;
  horasReales: string;
  diferenciaHorasRealesFichado: string;
  diferenciaHorasRealesPlanificado: string;
  validadoPor: string;
  comentario: string;
}

// Props del componente
interface ClockInTrackingTableProps {
  fichajes?: SeguimientoFichaje[];
  onEmpleadoClick?: (fichaje: SeguimientoFichaje) => void;
}

// Datos de ejemplo para demostración
const ejemploFichajes: SeguimientoFichaje[] = [];

type SortField = keyof SeguimientoFichaje;
type SortDirection = 'asc' | 'desc';

export function ClockInTrackingTable({ 
  fichajes = ejemploFichajes, 
  onEmpleadoClick 
}: ClockInTrackingTableProps) {
  const [sortField, setSortField] = React.useState<SortField>('fecha');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedFichajes = React.useMemo(() => {
    return [...fichajes].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [fichajes, sortField, sortDirection]);

  const getDiferenciaVariant = (diferencia: string): "default" | "secondary" | "destructive" | "outline" => {
    if (diferencia === "0m" || diferencia === "") return "secondary";
    if (diferencia.includes("+")) return "destructive";
    if (diferencia.includes("-")) return "outline";
    return "default";
  };

  const renderCellContent = (content: string, isWarning = false) => {
    if (!content || content.trim() === "") {
      return <span className="text-muted-foreground italic">—</span>;
    }
    
    return (
      <span className={cn(
        isWarning && "text-destructive font-medium"
      )}>
        {content}
      </span>
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-foreground hover:text-foreground hover:bg-transparent"
                onClick={() => handleSort('fecha')}
              >
                {esStrings.fecha}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-foreground hover:text-foreground hover:bg-transparent"
                onClick={() => handleSort('empleado')}
              >
                {esStrings.empleado}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4 border-r border-border">
              {esStrings.planificado}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4 border-r border-border">
              {esStrings.fichado}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4 border-r border-border">
              {esStrings.horasReales}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4 border-r border-border text-center">
              {esStrings.diferenciaHorasRealesFichado}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4 border-r border-border text-center">
              {esStrings.diferenciaHorasRealesPlanificado}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4 border-r border-border">
              {esStrings.validadoPor}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm py-3 px-4">
              {esStrings.comentario}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFichajes.map((fichaje, index) => (
            <TableRow 
              key={fichaje.id}
              className={cn(
                "hover:bg-muted/30 transition-colors",
                index % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}
            >
              <TableCell className="py-4 px-4 border-r border-border">
                <span className="text-sm font-medium text-foreground">
                  {fichaje.fecha}
                </span>
              </TableCell>
              <TableCell className="py-4 px-4 border-r border-border">
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                  onClick={() => onEmpleadoClick?.(fichaje)}
                >
                  {fichaje.empleado}
                </Button>
              </TableCell>
              <TableCell className="py-4 px-4 border-r border-border">
                <span className="text-sm text-foreground">
                  {renderCellContent(fichaje.planificado)}
                </span>
              </TableCell>
              <TableCell className="py-4 px-4 border-r border-border">
                <span className="text-sm text-foreground">
                  {renderCellContent(fichaje.fichado)}
                </span>
              </TableCell>
              <TableCell className="py-4 px-4 border-r border-border">
                <span className="text-sm font-medium text-foreground">
                  {renderCellContent(fichaje.horasReales)}
                </span>
              </TableCell>
              <TableCell className="py-4 px-4 border-r border-border text-center">
                <Badge 
                  variant={getDiferenciaVariant(fichaje.diferenciaHorasRealesFichado)}
                  className="text-xs font-medium"
                >
                  {fichaje.diferenciaHorasRealesFichado || "0m"}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-4 border-r border-border text-center">
                <Badge 
                  variant={getDiferenciaVariant(fichaje.diferenciaHorasRealesPlanificado)}
                  className="text-xs font-medium"
                >
                  {fichaje.diferenciaHorasRealesPlanificado || "0m"}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-4 border-r border-border">
                <span className="text-sm text-muted-foreground">
                  {renderCellContent(fichaje.validadoPor)}
                </span>
              </TableCell>
              <TableCell className="py-4 px-4">
                <span className="text-sm text-muted-foreground">
                  {renderCellContent(fichaje.comentario)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}