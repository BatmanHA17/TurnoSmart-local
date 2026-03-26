import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ColaboradorFiltersProps {
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
}

export const ColaboradorFilters = ({ 
  selectedDepartment, 
  onDepartmentChange 
}: ColaboradorFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      <div className="flex items-center gap-3">
        <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
          <SelectTrigger className="h-9 w-auto min-w-[180px] bg-background/60 border-border/30 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
            <SelectValue placeholder="Todos los departamentos" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-sm border-border/30 shadow-lg rounded-xl">
            <SelectItem value="todos" className="rounded-lg">Todos los departamentos</SelectItem>
            <SelectItem value="PROPIO" className="rounded-lg">Personal Propio</SelectItem>
            <SelectItem value="ETT" className="rounded-lg">Personal ETT</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="todos">
          <SelectTrigger className="h-9 w-auto min-w-[160px] bg-background/60 border-border/30 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
            <SelectValue placeholder="Tipo de contrato" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-sm border-border/30 shadow-lg rounded-xl">
            <SelectItem value="todos" className="rounded-lg">Todos los contratos</SelectItem>
            <SelectItem value="8-horas" className="rounded-lg">8 horas</SelectItem>
            <SelectItem value="6-horas" className="rounded-lg">6 horas</SelectItem>
            <SelectItem value="5-horas" className="rounded-lg">5 horas</SelectItem>
            <SelectItem value="4-horas" className="rounded-lg">4 horas</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="todos">
          <SelectTrigger className="h-9 w-auto min-w-[140px] bg-background/60 border-border/30 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-sm border-border/30 shadow-lg rounded-xl">
            <SelectItem value="todos" className="rounded-lg">Todos los estados</SelectItem>
            <SelectItem value="activo" className="rounded-lg">Activo</SelectItem>
            <SelectItem value="inactivo" className="rounded-lg">Inactivo</SelectItem>
            <SelectItem value="vacaciones" className="rounded-lg">En vacaciones</SelectItem>
            <SelectItem value="baja" className="rounded-lg">Baja temporal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};