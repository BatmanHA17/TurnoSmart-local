import { useMemo } from "react";

interface DayShiftBlockProps {
  shift: any;
  pxPerSlot: number;
  onClick: () => void;
}

export function DayShiftBlock({ shift, pxPerSlot, onClick }: DayShiftBlockProps) {
  const { left, width } = useMemo(() => {
    return {
      left: shift.slotStart * pxPerSlot,
      width: (shift.slotEnd - shift.slotStart) * pxPerSlot
    };
  }, [shift, pxPerSlot]);

  return (
    <div
      className="absolute top-1 bottom-1 rounded px-2 py-1 cursor-pointer hover:shadow-lg transition-all border-l-2"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: shift.color || '#86efac',
        borderLeftColor: shift.color || '#86efac',
        opacity: 0.9
      }}
      onClick={onClick}
      title={`${shift.shift_name}\n${shift.start_time} - ${shift.end_time}`}
    >
      <div className="text-xs font-medium truncate text-foreground/90">
        {shift.shift_name}
      </div>
      <div className="text-[10px] truncate text-foreground/70">
        {shift.start_time} - {shift.end_time}
        {shift.break_duration && ` (${shift.break_duration})`}
      </div>
      
      {shift.isOvernight && (
        <div className="absolute top-1 right-1">
          <span className="text-[8px] bg-background/80 px-1 rounded">→</span>
        </div>
      )}
    </div>
  );
}
