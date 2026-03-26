import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { esStrings } from "@/i18n/es";

interface MissingInfo {
  id: string;
  label: string;
}

interface ColaboradorIncompleto {
  id: string;
  nombre: string;
  apellidos: string;
  fechaInicioContrato: string | null;
  faltaInformacion: MissingInfo[];
}

interface PerfilesIncompletosTableProps {
  className?: string;
}

// Función para detectar campos faltantes en un colaborador
const detectMissingFields = (colaborador: any): MissingInfo[] => {
  const missing: MissingInfo[] = [];
  
  const fieldsToCheck = [
    { field: 'fecha_nacimiento', label: 'fecha de nacimiento' },
    { field: 'genero', label: 'Género' },
    { field: 'nacionalidad', label: 'Nacionalidad' },
    { field: 'ciudad_nacimiento', label: 'Lugar de nacimiento' },
    { field: 'numero_seguridad_social', label: 'número de la seguridad social' },
    { field: 'direccion', label: 'Dirección' },
    { field: 'ciudad', label: 'Ciudad' },
    { field: 'codigo_postal', label: 'Código postal' },
    { field: 'telefono_movil', label: 'Teléfono móvil' },
    { field: 'email', label: 'Email' },
    { field: 'tipo_contrato', label: 'Tipo de contrato' },
    { field: 'tiempo_trabajo_semanal', label: 'Tiempo trabajo semanal' },
    { field: 'org_id', label: 'Organización' }, // Reemplazado establecimiento_por_defecto
    { field: 'responsable_directo', label: 'Responsable directo' },
    { field: 'estado_civil', label: 'Estado civil' },
    { field: 'contacto_emergencia_nombre', label: 'Contacto emergencia' },
    { field: 'contacto_emergencia_telefono', label: 'Teléfono emergencia' },
    { field: 'pais_nacimiento', label: 'País de nacimiento' },
    { field: 'provincia', label: 'Provincia' },
    { field: 'pais_residencia', label: 'País residencia' }
  ];

  fieldsToCheck.forEach(({ field, label }) => {
    const value = colaborador[field];
    if (!value || value === '' || value === null || value === undefined) {
      missing.push({ id: field, label });
    }
  });

  return missing;
};

export function PerfilesIncompletosTable({ className }: PerfilesIncompletosTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = React.useState<keyof ColaboradorIncompleto | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  const { data: colaboradores, isLoading, error } = useQuery({
    queryKey: ['colaboradores-perfiles-incompletos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colaborador_full')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching colaboradores:', error);
        throw error;
      }

      // Procesar datos y detectar campos faltantes
      const colaboradoresIncompletos: ColaboradorIncompleto[] = data.map(colaborador => {
        const missingFields = detectMissingFields(colaborador);
        
        return {
          id: colaborador.id,
          nombre: `${colaborador.nombre} ${colaborador.apellidos}`.trim(),
          apellidos: colaborador.apellidos || '',
          fechaInicioContrato: colaborador.fecha_inicio_contrato || null,
          faltaInformacion: missingFields
        };
      });

      // Solo mostrar colaboradores que tienen información faltante
      return colaboradoresIncompletos.filter(c => c.faltaInformacion.length > 0);
    }
  });

  const handleSort = (field: keyof ColaboradorIncompleto) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedColaboradores = React.useMemo(() => {
    if (!colaboradores || !sortField) return colaboradores || [];

    return [...colaboradores].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
      return 0;
    });
  }, [colaboradores, sortField, sortDirection]);

  const handleColaboradorClick = (colaboradorId: string) => {
    navigate(`/colaboradores/${colaboradorId}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin información';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("bg-white rounded-lg border border-gray-200 p-8", className)}>
        <div className="text-center text-gray-500">Cargando colaboradores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-white rounded-lg border border-gray-200 p-8", className)}>
        <div className="text-center text-red-500">Error al cargar los datos</div>
      </div>
    );
  }

  if (!sortedColaboradores || sortedColaboradores.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg border border-gray-200 p-8", className)}>
        <div className="text-center text-gray-500">
          ¡Excelente! Todos los colaboradores tienen sus perfiles completos.
        </div>
      </div>
    );
  }

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
                onClick={() => handleSort("nombre")}
              >
                {esStrings.empleado}
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </Button>
            </TableHead>
            <TableHead className="font-medium text-gray-700">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-0 font-medium text-gray-700 hover:text-gray-900"
                onClick={() => handleSort("fechaInicioContrato")}
              >
                {esStrings.inicioDelContrato}
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </Button>
            </TableHead>
            <TableHead className="font-medium text-gray-700">{esStrings.faltaInformacion}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedColaboradores.map((colaborador) => (
            <TableRow 
              key={colaborador.id}
              className="hover:bg-gray-50/50 transition-colors duration-150 border-b border-gray-100"
            >
              <TableCell>
                <Button
                  variant="link" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => handleColaboradorClick(colaborador.id)}
                >
                  {colaborador.nombre}
                </Button>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {formatDate(colaborador.fechaInicioContrato)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {colaborador.faltaInformacion.map((info, index) => (
                    <Badge 
                      key={`${colaborador.id}-${info.id}-${index}`}
                      variant="secondary" 
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 font-normal"
                      style={{ fontSize: '8px', padding: '2px 4px', lineHeight: '10px' }}
                    >
                      {info.label}
                    </Badge>
                  ))}
                  {colaborador.faltaInformacion.length > 8 && (
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 font-normal"
                      style={{ fontSize: '8px', padding: '2px 4px', lineHeight: '10px' }}
                    >
                      ...{colaborador.faltaInformacion.length - 8} más
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export type { ColaboradorIncompleto, MissingInfo };