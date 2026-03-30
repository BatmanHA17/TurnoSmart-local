import { format } from "date-fns";
import { X } from "lucide-react";
import type { UnassignedShiftInfo } from "@/hooks/useUnassignedShifts";

interface UnassignedShiftsRowProps {
  days: Date[];
  shifts: Record<string, UnassignedShiftInfo[]>;
  onAddShift?: (date: string) => void;
  onRemoveShift?: (shiftId: string, date: string) => void;
  canEdit: boolean;
  columnWidth?: string;
}

export const UnassignedShiftsRow = ({
  days,
  shifts,
  onAddShift,
  onRemoveShift,
  canEdit,
  columnWidth = "90px",
}: UnassignedShiftsRowProps) => {
  return (
    <tr className="bg-orange-50/30 dark:bg-orange-950/10 border-b">
      {/* Sticky label cell */}
      <td
        className="sticky left-0 bg-orange-50/30 dark:bg-orange-950/10 z-10 py-1 px-1 border-r w-[90px] min-w-[90px] max-w-[90px]"
        style={{ width: "90px", minWidth: "90px", maxWidth: "90px" }}
      >
        <span className="text-[9px] text-muted-foreground leading-none">
          Sin asignar
        </span>
      </td>

      {/* One cell per day */}
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayShifts = shifts[dateKey] ?? [];
        const hasShifts = dayShifts.length > 0;

        return (
          <td
            key={dateKey}
            style={{ width: columnWidth, minWidth: columnWidth, maxWidth: columnWidth }}
            className="py-0.5 px-0.5 border-r align-top"
            onClick={() => {
              if (canEdit && !hasShifts && onAddShift) {
                onAddShift(dateKey);
              }
            }}
          >
            {hasShifts ? (
              <div className="flex flex-col gap-0.5">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="relative flex items-center group rounded px-1 py-0.5 text-[8px] leading-tight text-white truncate"
                    style={{ backgroundColor: shift.color ?? "#fb923c" }}
                    title={
                      shift.name
                        ? shift.startTime && shift.endTime
                          ? `${shift.name} · ${shift.startTime}–${shift.endTime}`
                          : shift.name
                        : dateKey
                    }
                  >
                    <span className="truncate flex-1">
                      {shift.name ?? "—"}
                      {shift.startTime && shift.endTime
                        ? ` ${shift.startTime}–${shift.endTime}`
                        : ""}
                    </span>
                    {canEdit && onRemoveShift && (
                      <button
                        className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveShift(shift.id, dateKey);
                        }}
                        aria-label="Eliminar turno sin asignar"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && onAddShift && (
                  <button
                    className="text-[8px] text-orange-400 hover:text-orange-600 leading-none text-left px-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddShift(dateKey);
                    }}
                    aria-label="Añadir turno sin asignar"
                  >
                    +
                  </button>
                )}
              </div>
            ) : canEdit ? (
              <span className="block text-[9px] text-muted-foreground/40 cursor-pointer select-none">
                +
              </span>
            ) : null}
          </td>
        );
      })}
    </tr>
  );
};
