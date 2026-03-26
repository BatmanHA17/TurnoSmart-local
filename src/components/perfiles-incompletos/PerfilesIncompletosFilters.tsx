import { OrganizationFilter } from "@/components/filters/OrganizationFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { esStrings } from "@/i18n/es";

interface PerfilesIncompletosFiltersProps {
  onEstablishmentChange: (value: string) => void;
  onMissingInfoChange: (value: string) => void;
  selectedEstablishment: string;
  selectedMissingInfo: string;
}

export function PerfilesIncompletosFilters({
  onEstablishmentChange,
  onMissingInfoChange,
  selectedEstablishment,
  selectedMissingInfo
}: PerfilesIncompletosFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative">
        <OrganizationFilter
          value={selectedEstablishment}
          onChange={onEstablishmentChange}
          variant="select"
          showSearch={true}
          placeholder={esStrings.todosLosEstablecimientos}
          className="w-[300px]"
        />
      </div>

      <div className="relative">
        <Select value={selectedMissingInfo} onValueChange={onMissingInfoChange}>
          <SelectTrigger className="w-[400px] bg-white border border-gray-300 rounded-md px-3 py-2 text-sm">
            <SelectValue placeholder={esStrings.informacionFaltante} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{esStrings.informacionFaltante}</SelectItem>
            <SelectItem value="empleo">Empleo</SelectItem>
            <SelectItem value="cualificacion">Cualificación</SelectItem>
            <SelectItem value="fechaNacimiento">fecha de nacimiento</SelectItem>
            <SelectItem value="genero">Género</SelectItem>
            <SelectItem value="nacionalidad">Nacionalidad</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}