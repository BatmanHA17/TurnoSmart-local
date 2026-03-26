import { useMemo } from "react";
import { DayShiftBlock } from "./DayShiftBlock";

interface DayGridProps {
  employees: any[];
  shifts: any[];
  pxPerSlot: number;
  rowHeight: number;
  onShiftClick: (shift: any) => void;
}

export function DayGrid({ employees, shifts, pxPerSlot, rowHeight, onShiftClick }: DayGridProps) {
  const gridWidth = pxPerSlot * 96; // 96 slots de 15 min

  // Agrupar shifts por empleado
  const shiftsByEmployee = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    shifts.forEach(shift => {
      if (!grouped[shift.employee_id]) {
        grouped[shift.employee_id] = [];
      }
      grouped[shift.employee_id].push(shift);
    });
    return grouped;
  }, [shifts]);

  return (
    <div className="relative" style={{ width: gridWidth, minWidth: gridWidth, minHeight: employees.length * rowHeight }}>
      {/* Grid lines (hora + 15 min) */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 96 }).map((_, slotIndex) => {
          const isHourMark = slotIndex % 4 === 0;
          return (
            <div
              key={slotIndex}
              className={`absolute top-0 bottom-0 ${isHourMark ? 'border-r border-border' : 'border-r border-border/20'}`}
              style={{ left: slotIndex * pxPerSlot }}
            />
          );
        })}
      </div>

      {/* Filas de empleados con turnos */}
      {employees.map((emp, idx) => (
        <div
          key={emp.id}
          className="absolute left-0 right-0 border-b border-border/30"
          style={{
            top: idx * rowHeight,
            height: rowHeight
          }}
        >
          {/* Render shifts de este empleado */}
          {(shiftsByEmployee[emp.id] || []).map(shift => (
            <DayShiftBlock
              key={shift.id}
              shift={shift}
              pxPerSlot={pxPerSlot}
              onClick={() => onShiftClick(shift)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
