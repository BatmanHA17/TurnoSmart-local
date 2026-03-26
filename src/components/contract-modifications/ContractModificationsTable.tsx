import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { designTokens } from "@/design-tokens";
import { esStrings } from "@/i18n/es";

interface ModificacionContrato {
  id: string;
  fecha: string;
  perfilModificado: string;
  impacto: string;
  modificacionEfectuada: string;
  modificadoPor: string;
}

interface ContractModificationsTableProps {
  modificaciones: ModificacionContrato[];
  onEmpleadoClick: (modificacion: ModificacionContrato) => void;
  className?: string;
}

// Datos de ejemplo para modificaciones de contratos
const modificacionesEjemplo: ModificacionContrato[] = [
  {
    id: "1",
    fecha: "15/09/2025",
    perfilModificado: esStrings.empleados.bobbieStoneman,
    impacto: "Cambio de horario",
    modificacionEfectuada: "Horario de 8h a 6h",
    modificadoPor: "Manager Recursos Humanos",
  },
  {
    id: "2", 
    fecha: "14/09/2025",
    perfilModificado: esStrings.empleados.astonAmartin,
    impacto: "Cambio de departamento",
    modificacionEfectuada: "De Rota a Producción",
    modificadoPor: "Director General",
  },
  {
    id: "3",
    fecha: "13/09/2025", 
    perfilModificado: esStrings.empleados.leoMessi,
    impacto: "Aumento salarial",
    modificacionEfectuada: "Incremento del 15%",
    modificadoPor: "Manager Recursos Humanos",
  },
  {
    id: "4",
    fecha: "12/09/2025",
    perfilModificado: esStrings.empleados.soldierSpiderman,
    impacto: "Cambio de contrato",
    modificacionEfectuada: "De temporal a indefinido",
    modificadoPor: "Director General",
  },
];

export function ContractModificationsTable({ modificaciones = modificacionesEjemplo, onEmpleadoClick, className }: ContractModificationsTableProps) {
  const [sortField, setSortField] = React.useState<keyof ModificacionContrato | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof ModificacionContrato) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedModificaciones = React.useMemo(() => {
    if (!sortField) return modificaciones;

    return [...modificaciones].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [modificaciones, sortField, sortDirection]);

  const getImpactoVariant = (impacto: string) => {
    switch (impacto.toLowerCase()) {
      case "cambio de horario":
        return "secondary";
      case "cambio de departamento":
        return "outline";
      case "aumento salarial":
        return "default";
      case "cambio de contrato":
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
                {esStrings.contractModificationsTable.fecha}
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </Button>
            </TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.contractModificationsTable.perfilModificado}</TableHead>
            <TableHead className="font-medium text-gray-700">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-0 font-medium text-gray-700 hover:text-gray-900"
                onClick={() => handleSort("impacto")}
              >
                {esStrings.contractModificationsTable.impacto}
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </Button>
            </TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.contractModificationsTable.modificacionEfectuada}</TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.contractModificationsTable.modificadoPor}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedModificaciones.map((modificacion) => (
            <TableRow 
              key={modificacion.id}
              className="hover:bg-gray-50/50 transition-colors duration-150 border-b border-gray-100"
            >
              <TableCell>
                {renderCellContent(modificacion.fecha)}
              </TableCell>
              <TableCell>
                <Button
                  variant="link" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => onEmpleadoClick(modificacion)}
                >
                  {modificacion.perfilModificado}
                </Button>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={getImpactoVariant(modificacion.impacto)}
                  className="text-xs"
                >
                  {modificacion.impacto}
                </Badge>
              </TableCell>
              <TableCell>
                {renderCellContent(modificacion.modificacionEfectuada)}
              </TableCell>
              <TableCell>
                {renderCellContent(modificacion.modificadoPor)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export type { ModificacionContrato };