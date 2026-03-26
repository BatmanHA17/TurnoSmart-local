import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Users } from "lucide-react";

interface ShiftBlock {
  employeeId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  name: string;
  color: string;
}

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
  [key: string]: any;
}

interface CalendarMiniPreviewProps {
  shiftBlocks: ShiftBlock[];
  employees: Employee[];
  weekRange: { start: Date; end: Date };
}

export function CalendarMiniPreview({
  shiftBlocks,
  employees,
  weekRange,
}: CalendarMiniPreviewProps) {
  // Generar días de la semana
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekRange.start);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Agrupar turnos por empleado y fecha
  const getShiftsForEmployeeAndDate = (employeeId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return shiftBlocks.filter(
      (shift) =>
        shift.employeeId === employeeId &&
        shift.date === dateStr
    );
  };

  // Limitar a los primeros 8 empleados para la vista previa
  const previewEmployees = employees.slice(0, 8);

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Header con información */}
      <div className="bg-muted p-3 border-b">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">
              {format(weekRange.start, "d MMM", { locale: es })} -{" "}
              {format(weekRange.end, "d MMM yyyy", { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{employees.length} empleados</span>
          </div>
        </div>
      </div>

      {/* Mini calendario */}
      <div className="p-2">
        <div className="grid grid-cols-8 gap-1 text-xs">
          {/* Header con días */}
          <div className="text-center font-medium text-muted-foreground py-1"></div>
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className="text-center font-medium text-muted-foreground py-1"
            >
              {format(day, "EEE", { locale: es }).charAt(0)}
            </div>
          ))}

          {/* Filas de empleados */}
          {previewEmployees.map((employee) => (
            <>
              <div
                key={employee.id}
                className="text-[10px] truncate py-1 text-muted-foreground"
                title={`${employee.nombre} ${employee.apellidos}`}
              >
                {employee.nombre?.split(" ")[0]}
              </div>
              {weekDays.map((day, dayIdx) => {
                const shifts = getShiftsForEmployeeAndDate(employee.id, day);
                const hasShift = shifts.length > 0;
                const mainShift = shifts[0];

                return (
                  <div
                    key={`${employee.id}-${dayIdx}`}
                    className="aspect-square rounded flex items-center justify-center"
                    style={{
                      backgroundColor: hasShift
                        ? mainShift.color + "40"
                        : "transparent",
                      border: hasShift ? `1px solid ${mainShift.color}80` : "1px solid hsl(var(--border))",
                    }}
                    title={
                      hasShift
                        ? `${mainShift.name} ${mainShift.startTime || ""}-${mainShift.endTime || ""}`
                        : ""
                    }
                  >
                    {shifts.length > 1 && (
                      <span className="text-[8px] font-bold">
                        {shifts.length}
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          ))}

          {/* Indicador de más empleados */}
          {employees.length > 8 && (
            <div className="col-span-8 text-center text-[10px] text-muted-foreground pt-1">
              +{employees.length - 8} empleados más
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-3 pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{shiftBlocks.length} turnos</span>
          <span>
            {shiftBlocks.filter((s) => s.startTime && s.endTime).length}{" "}
            presenciales
          </span>
        </div>
      </div>
    </div>
  );
}
