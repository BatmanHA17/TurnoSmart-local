import { useMemo } from "react";

interface DayTimeAxisProps {
  pxPerHour: number;
  showNowLine?: boolean;
  currentTimePercent?: number;
}

export function DayTimeAxis({ pxPerHour, showNowLine, currentTimePercent }: DayTimeAxisProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const totalWidth = pxPerHour * 24;

  return (
    <div 
      className="relative bg-background border-b"
      style={{ width: totalWidth, minWidth: totalWidth }}
    >
      {/* Etiquetas de horas */}
      <div className="flex h-12 relative">
        {hours.map(hour => (
          <div
            key={hour}
            className="relative border-r border-border/50"
            style={{ width: pxPerHour, minWidth: pxPerHour }}
          >
            {/* Hora principal */}
            <div className="absolute top-1 left-1 text-xs font-medium text-muted-foreground">
              {hour.toString().padStart(2, '0')}:00
            </div>
            
            {/* Subticks de 15 minutos */}
            <div className="absolute top-8 left-0 right-0 flex">
              {[0, 1, 2, 3].map(quarter => (
                <div
                  key={quarter}
                  className="flex-1 border-r border-border/20"
                  style={{ width: pxPerHour / 4 }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Línea de "ahora" (roja) */}
        {showNowLine && currentTimePercent !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
            style={{ left: `${currentTimePercent}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-red-500" />
          </div>
        )}
      </div>
    </div>
  );
}
