import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Coffee, Moon, Sun, Sunset } from "lucide-react";

interface ShiftCardCompactProps {
  shift: {
    id: string;
    name?: string;
    startTime?: string;
    endTime?: string;
    type: "morning" | "afternoon" | "night" | "absence";
    color: string;
    absenceCode?: string;
    hasBreak?: boolean;
  };
  onClick?: () => void;
  readOnly?: boolean;
}

// Códigos de turno compactos
const getShiftCode = (shift: ShiftCardCompactProps['shift']): string => {
  // Para ausencias, usar el código de ausencia o la primera letra del nombre
  if (shift.type === 'absence') {
    if (shift.absenceCode) return shift.absenceCode.slice(0, 2).toUpperCase();
    if (shift.name) {
      const name = shift.name.toLowerCase();
      if (name.includes('libre') || name.includes('descanso')) return 'L';
      if (name.includes('vacacion')) return 'V';
      if (name.includes('baja') || name.includes('enferm')) return 'E';
      if (name.includes('permiso')) return 'P';
      if (name.includes('curso') || name.includes('formacion')) return 'C';
      if (name.includes('falta')) return 'F';
      if (name.includes('sindical')) return 'H';
      if (name.includes('sancion')) return 'S';
      return shift.name.charAt(0).toUpperCase();
    }
    return 'A';
  }
  
  // Para turnos con horario, mostrar la hora de inicio
  if (shift.startTime) {
    const hour = parseInt(shift.startTime.split(':')[0]);
    if (hour >= 6 && hour < 14) return shift.startTime.slice(0, 2);
    if (hour >= 14 && hour < 22) return shift.startTime.slice(0, 2);
    return shift.startTime.slice(0, 2);
  }
  
  // Por tipo de turno
  switch (shift.type) {
    case 'morning': return 'M';
    case 'afternoon': return 'T';
    case 'night': return 'N';
    default: return 'X';
  }
};

// Icono según tipo de turno
const getShiftIcon = (shift: ShiftCardCompactProps['shift']) => {
  if (shift.type === 'absence') return null;
  
  if (shift.startTime) {
    const hour = parseInt(shift.startTime.split(':')[0]);
    if (hour >= 6 && hour < 14) return <Sun className="h-2 w-2" />;
    if (hour >= 14 && hour < 22) return <Sunset className="h-2 w-2" />;
    return <Moon className="h-2 w-2" />;
  }
  
  switch (shift.type) {
    case 'morning': return <Sun className="h-2 w-2" />;
    case 'afternoon': return <Sunset className="h-2 w-2" />;
    case 'night': return <Moon className="h-2 w-2" />;
    default: return null;
  }
};

export function ShiftCardCompact({ shift, onClick, readOnly = false }: ShiftCardCompactProps) {
  const code = getShiftCode(shift);
  const icon = getShiftIcon(shift);
  const isAbsence = shift.type === 'absence';
  
  // Contenido del tooltip
  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">{shift.name || 'Turno'}</div>
      {shift.startTime && shift.endTime && (
        <div className="text-xs text-muted-foreground">
          {shift.startTime.slice(0, 5)} - {shift.endTime.slice(0, 5)}
        </div>
      )}
      {shift.hasBreak && (
        <div className="flex items-center gap-1 text-xs text-amber-600">
          <Coffee className="h-3 w-3" />
          <span>Con descanso</span>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div
          className={`
            w-full h-full min-h-[24px] rounded-sm flex items-center justify-center
            text-[9px] font-medium leading-none
            transition-all cursor-pointer
            ${readOnly ? 'cursor-default' : 'hover:ring-1 hover:ring-primary/50 hover:shadow-sm'}
          `}
          style={{
            backgroundColor: isAbsence 
              ? (shift.color || '#94a3b8') 
              : `${shift.color}60`,
            color: isAbsence ? 'white' : 'rgb(17, 24, 39)',
          }}
          onClick={readOnly ? undefined : onClick}
        >
          <div className="flex flex-col items-center gap-0.5">
            {icon && <span className="opacity-70">{icon}</span>}
            <span className={isAbsence ? 'drop-shadow-sm' : ''}>{code}</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
