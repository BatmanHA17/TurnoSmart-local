import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface EmployeeRow {
  id: string;
  name: string;
  scheduledHours: number;
  actualHours: number;
  shiftCount: number;
  absenceCount: number;
}

type SortField = "name" | "actualHours" | "shiftCount";
type SortDir = "asc" | "desc";

interface EmployeeHoursTableProps {
  employees: EmployeeRow[];
  onExportRow?: (employeeId: string) => void;
}

function hourStatusClass(actualHours: number, scheduledHours: number): string {
  if (scheduledHours === 0) return "";
  const ratio = actualHours / scheduledHours;
  if (ratio >= 1) return "text-emerald-600 font-semibold";
  if (ratio >= 0.85) return "text-amber-500 font-semibold";
  return "text-red-500 font-semibold";
}

export function EmployeeHoursTable({ employees, onExportRow }: EmployeeHoursTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("actualHours");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => e.name.toLowerCase().includes(q));
  }, [employees, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name, "es");
      else if (sortField === "actualHours") cmp = a.actualHours - b.actualHours;
      else if (sortField === "shiftCount") cmp = a.shiftCount - b.shiftCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  };

  if (employees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No hay datos de empleados para este período.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="pl-8 h-8 text-sm"
          placeholder="Buscar empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th
                className="px-3 py-2 text-left font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort("name")}
              >
                <span className="inline-flex items-center gap-1">
                  Empleado <SortIcon field="name" />
                </span>
              </th>
              <th
                className="px-3 py-2 text-right font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort("shiftCount")}
              >
                <span className="inline-flex items-center justify-end gap-1">
                  Turnos <SortIcon field="shiftCount" />
                </span>
              </th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
                Ausencias
              </th>
              <th
                className="px-3 py-2 text-right font-medium text-muted-foreground cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort("actualHours")}
              >
                <span className="inline-flex items-center justify-end gap-1">
                  Horas <SortIcon field="actualHours" />
                </span>
              </th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
                Contrato
              </th>
              {onExportRow && (
                <th className="px-3 py-2 text-center font-medium text-muted-foreground w-10">
                  <span className="sr-only">Exportar</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((emp) => (
              <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 font-medium truncate max-w-[180px]" title={emp.name}>
                  {emp.name}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{emp.shiftCount}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {emp.absenceCount}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${hourStatusClass(emp.actualHours, emp.scheduledHours)}`}>
                  {emp.actualHours.toFixed(1)}h
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {emp.scheduledHours > 0 ? `${emp.scheduledHours.toFixed(0)}h` : "—"}
                </td>
                {onExportRow && (
                  <td className="px-3 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onExportRow(emp.id)}
                      title={`Exportar ${emp.name}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {sorted.length} de {employees.length} empleados
        {search && ` • filtrado por "${search}"`}
      </p>
    </div>
  );
}
