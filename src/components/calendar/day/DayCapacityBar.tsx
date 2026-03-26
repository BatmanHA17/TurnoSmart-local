import { useMemo } from "react";
import { ShiftBlockDay } from "@/hooks/useDayCalendarData";
import { Users } from "lucide-react";

interface DayCapacityBarProps {
  shifts: ShiftBlockDay[];
  totalEmployees: number;
  selectedDate: Date;
}

export function DayCapacityBar({ shifts, totalEmployees, selectedDate }: DayCapacityBarProps) {
  const stats = useMemo(() => {
    const workingCount = new Set(shifts.map(s => s.employee_id)).size;
    const offCount = totalEmployees - workingCount;
    const percentage = totalEmployees > 0 ? Math.round((workingCount / totalEmployees) * 100) : 0;
    
    return { workingCount, offCount, percentage };
  }, [shifts, totalEmployees]);

  return (
    <div className="border-b bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Trabajando:</span>
              <span className="text-muted-foreground">{stats.workingCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Librando:</span>
              <span className="text-muted-foreground">{stats.offCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Total:</span>
              <span className="text-muted-foreground">{totalEmployees}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Capacidad:</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium">{stats.percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
