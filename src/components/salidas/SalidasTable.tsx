import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { designTokens } from "@/design-tokens";
import { esStrings } from "@/i18n/es";

interface Empleado {
  id: string;
  fechaSalida: string;
  nombre: string;
  equipo: string;
  contrato: string;
  fechaNacimiento: string;
  ciudadNacimiento: string;
  numeroSeguridadSocial: string;
  direccion: string;
}

interface SalidasTableProps {
  empleados: Empleado[];
  onEmpleadoClick: (empleado: Empleado) => void;
  className?: string;
}

// Datos de ejemplo para empleados con fecha de salida
const empleadosEjemplo: Empleado[] = [
  {
    id: "1",
    fechaSalida: "30/09/2025",
    nombre: esStrings.empleados.bobbieStoneman,
    equipo: esStrings.equipos.rota,
    contrato: esStrings.contratoIndefinido,
    fechaNacimiento: "01/01/1978",
    ciudadNacimiento: esStrings.sinInformacion,
    numeroSeguridadSocial: "123456789D",
    direccion: "AAA",
  },
  {
    id: "2", 
    fechaSalida: "28/09/2025",
    nombre: esStrings.empleados.astonAmartin,
    equipo: esStrings.equipos.rota,
    contrato: esStrings.sinInformacion,
    fechaNacimiento: "01/01/1978",
    ciudadNacimiento: esStrings.sinInformacion,
    numeroSeguridadSocial: esStrings.sinInformacion,
    direccion: esStrings.sinInformacion,
  },
  {
    id: "3",
    fechaSalida: "25/09/2025", 
    nombre: esStrings.empleados.leoMessi,
    equipo: esStrings.equipos.rota,
    contrato: esStrings.sinInformacion,
    fechaNacimiento: "02/01/1980",
    ciudadNacimiento: esStrings.sinInformacion,
    numeroSeguridadSocial: esStrings.sinInformacion,
    direccion: esStrings.sinInformacion,
  },
  {
    id: "4",
    fechaSalida: "20/09/2025",
    nombre: esStrings.empleados.soldierSpiderman,
    equipo: esStrings.equipos.rota,
    contrato: esStrings.contratoIndefinido,
    fechaNacimiento: "01/01/1978",
    ciudadNacimiento: esStrings.sinInformacion,
    numeroSeguridadSocial: "987654321B",
    direccion: "BBB",
  },
];

export function SalidasTable({ empleados = empleadosEjemplo, onEmpleadoClick, className }: SalidasTableProps) {
  const [sortField, setSortField] = React.useState<keyof Empleado | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof Empleado) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedEmpleados = React.useMemo(() => {
    if (!sortField) return empleados;

    return [...empleados].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [empleados, sortField, sortDirection]);

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
                onClick={() => handleSort("fechaSalida")}
              >
                {esStrings.fechaDeSalida}
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </Button>
            </TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.empleado}</TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.equipo}</TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.contrato}</TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.fechaDeNacimiento}</TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.ciudadDeNacimiento}</TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.numeroSeguridadSocial}</TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.direccion}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEmpleados.map((empleado) => (
            <TableRow 
              key={empleado.id}
              className="hover:bg-gray-50/50 transition-colors duration-150 border-b border-gray-100"
            >
              <TableCell>
                {renderCellContent(empleado.fechaSalida)}
              </TableCell>
              <TableCell>
                <Button
                  variant="link" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => onEmpleadoClick(empleado)}
                >
                  {empleado.nombre}
                </Button>
              </TableCell>
              <TableCell>
                {renderCellContent(empleado.equipo)}
              </TableCell>
              <TableCell>
                {renderCellContent(empleado.contrato, empleado.contrato === esStrings.sinInformacion)}
              </TableCell>
              <TableCell>
                {renderCellContent(empleado.fechaNacimiento)}
              </TableCell>
              <TableCell>
                {renderCellContent(empleado.ciudadNacimiento, empleado.ciudadNacimiento === esStrings.sinInformacion)}
              </TableCell>
              <TableCell>
                {renderCellContent(empleado.numeroSeguridadSocial, empleado.numeroSeguridadSocial === esStrings.sinInformacion)}
              </TableCell>
              <TableCell>
                {renderCellContent(empleado.direccion, empleado.direccion === esStrings.sinInformacion)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export type { Empleado };