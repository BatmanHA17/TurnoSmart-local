import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown } from "lucide-react";

export default function TimeoffRulesSettings() {
  const [selectedFilter, setSelectedFilter] = useState("activas");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    document.title = "Vacaciones | TurnoSmart";
  }, []);

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Vacaciones</h1>
        <Button className="bg-teal-700 hover:bg-teal-800 text-white rounded-full px-4 py-2 text-sm font-medium">
          + Añadir política RTT
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-48 bg-background border border-border rounded-md">
            <SelectValue placeholder="Políticas activas" />
            <ChevronDown className="h-4 w-4 ml-2" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border rounded-md shadow-lg">
            <SelectItem value="activas" className="px-3 py-2 hover:bg-muted cursor-pointer">
              Políticas activas
            </SelectItem>
            <SelectItem value="archivadas" className="px-3 py-2 hover:bg-muted cursor-pointer">
              Políticas archivadas
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border border-border rounded-md"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-border bg-muted/30">
          <div className="grid grid-cols-4 gap-4 p-4 text-sm font-medium text-muted-foreground">
            <div>Política de vacaciones</div>
            <div>Devengo</div>
            <div>Período de adquisición</div>
            <div>Asignado</div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-muted/20 rounded-lg flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-2 border-muted-foreground/30 rounded"></div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No hay política de RTT</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Añada una política de RTT para desbloquear el saldo de sus empleados.
          </p>
        </div>
      </div>
    </div>
  );
}