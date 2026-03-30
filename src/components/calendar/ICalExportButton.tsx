import { Calendar, Download, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useICalExport } from "@/hooks/useICalExport";
import { toast } from "@/hooks/use-toast";

// Minimal interface redeclarations so this component does not need to import
// from BiWeeklyCalendarView (avoids circular deps).
interface ShiftBlock {
  id: string;
  employeeId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: string;
  name?: string;
  [key: string]: unknown;
}

interface Employee {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ICalExportButtonProps {
  shiftBlocks: ShiftBlock[];
  employees: Employee[];
  biWeekDays: Date[];
  /** True for admins / managers who can export the whole team */
  canExportAll: boolean;
  /** The employee whose shifts will be exported when choosing "my schedule" */
  currentEmployeeId?: string;
  calendarName?: string;
}

export function ICalExportButton({
  shiftBlocks,
  employees,
  biWeekDays,
  canExportAll,
  currentEmployeeId,
  calendarName = "TurnoSmart",
}: ICalExportButtonProps) {
  const { exportICal } = useICalExport({
    shiftBlocks,
    employees,
    biWeekDays,
    calendarName,
  });

  const handleExportMine = () => {
    if (!currentEmployeeId) {
      toast({
        title: "Sin empleado seleccionado",
        description: "No se pudo identificar tu perfil de empleado.",
        variant: "destructive",
      });
      return;
    }
    exportICal(currentEmployeeId);
    toast({
      title: "Exportando tu horario",
      description: "El archivo .ics se descargará en breve.",
    });
  };

  const handleExportAll = () => {
    exportICal(undefined);
    toast({
      title: "Exportando horario del equipo",
      description: "El archivo .ics con todos los turnos se descargará en breve.",
    });
  };

  const handleCopySubscriptionLink = () => {
    toast({
      title: "Próximamente",
      description: "La suscripción iCal estará disponible en una próxima versión.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">iCal</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-popover border border-border shadow-lg">
        {currentEmployeeId && (
          <DropdownMenuItem onClick={handleExportMine} className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Exportar mi horario
          </DropdownMenuItem>
        )}
        {canExportAll && (
          <DropdownMenuItem onClick={handleExportAll} className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Exportar todo el equipo
          </DropdownMenuItem>
        )}
        {(currentEmployeeId || canExportAll) && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onClick={handleCopySubscriptionLink}
          className="gap-2 text-muted-foreground"
        >
          <Link className="h-3.5 w-3.5" />
          Copiar enlace de suscripción
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
