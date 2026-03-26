import { useMemo } from "react";
import { VariableSizeList as List } from "react-window";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
  avatar_url?: string;
  job_id?: string;
  tiempo_trabajo_semanal?: number;
}

interface DayLeftPaneProps {
  employees: Employee[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  rowHeight: number;
  containerHeight: number;
}

export function DayLeftPane({ 
  employees, 
  searchTerm, 
  onSearchChange, 
  rowHeight,
  containerHeight 
}: DayLeftPaneProps) {
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter(emp =>
      `${emp.nombre} ${emp.apellidos}`.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  const getInitials = (emp: Employee) => {
    return `${emp.nombre[0] || ''}${emp.apellidos[0] || ''}`.toUpperCase();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b bg-background shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar empleado..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Lista virtualizada de empleados */}
      <div className="flex-1">
        <List
          height={containerHeight - 60}
          itemCount={filteredEmployees.length}
          itemSize={() => rowHeight}
          width="100%"
          overscanCount={5}
        >
          {({ index, style }) => {
            const emp = filteredEmployees[index];
            return (
              <div
                style={style}
                className="flex items-center gap-2 px-3 border-b border-border/30 hover:bg-muted/30"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={emp.avatar_url} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(emp)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {emp.nombre} {emp.apellidos}
                  </p>
                </div>

                {emp.tiempo_trabajo_semanal && (
                  <Badge variant="secondary" className="text-[9px] px-1">
                    {emp.tiempo_trabajo_semanal}h
                  </Badge>
                )}
              </div>
            );
          }}
        </List>
      </div>
    </div>
  );
}
