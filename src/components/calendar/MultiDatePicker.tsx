import { isSameDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ShiftBlock } from "@/utils/calendarShiftUtils";

interface MultiDatePickerProps {
  initialDate: Date;
  biWeekDays: Date[];
  selectedDates: Date[];
  onSelectionChange: (dates: Date[]) => void;
  employeeShifts?: ShiftBlock[];
}

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export function MultiDatePicker({
  initialDate,
  biWeekDays,
  selectedDates,
  onSelectionChange,
  employeeShifts = [],
}: MultiDatePickerProps) {
  const today = new Date();

  // biWeekDays must be 14 days starting on Monday
  const week1 = biWeekDays.slice(0, 7);
  const week2 = biWeekDays.slice(7, 14);

  const hasShift = (day: Date) =>
    employeeShifts.some((s) => isSameDay(s.date, day));

  const isSelected = (day: Date) =>
    selectedDates.some((d) => isSameDay(d, day));

  const toggleDate = (day: Date) => {
    if (isSelected(day)) {
      onSelectionChange(selectedDates.filter((d) => !isSameDay(d, day)));
    } else {
      onSelectionChange([...selectedDates, day]);
    }
  };

  const selectWeek = (days: Date[]) => {
    const allSelected = days.every((d) => isSelected(d));
    if (allSelected) {
      // deselect entire week
      onSelectionChange(
        selectedDates.filter((sd) => !days.some((d) => isSameDay(d, sd)))
      );
    } else {
      // add missing days
      const toAdd = days.filter((d) => !isSelected(d));
      onSelectionChange([...selectedDates, ...toAdd]);
    }
  };

  const selectAll = () => onSelectionChange([...biWeekDays]);
  const clearAll = () => onSelectionChange([]);

  const renderDay = (day: Date) => {
    const selected = isSelected(day);
    const isToday = isSameDay(day, today);
    const isInitial = isSameDay(day, initialDate);
    const shifted = hasShift(day);

    return (
      <div key={day.toISOString()} className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={() => toggleDate(day)}
          title={format(day, "EEEE d MMMM", { locale: es })}
          className={[
            "w-7 h-7 rounded-full text-[10px] font-medium flex items-center justify-center transition-colors",
            selected
              ? "bg-primary text-primary-foreground"
              : isToday
              ? "border-2 border-primary text-primary hover:bg-primary/10"
              : isInitial
              ? "border border-dashed border-primary/60 text-primary hover:bg-primary/10"
              : "hover:bg-accent text-foreground",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {format(day, "d")}
        </button>
        {/* dot indicator if there's already a shift */}
        <span
          className={[
            "block w-1 h-1 rounded-full",
            shifted ? "bg-primary/60" : "bg-transparent",
          ].join(" ")}
        />
      </div>
    );
  };

  const week1AllSelected = week1.every((d) => isSelected(d));
  const week2AllSelected = week2.every((d) => isSelected(d));

  return (
    <div className="space-y-3 p-3 border-2 border-primary/20 rounded-lg bg-primary/5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground">
          Seleccionar fechas ({selectedDates.length} seleccionadas)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-[9px] text-primary hover:underline"
          >
            Seleccionar todo
          </button>
          <span className="text-[9px] text-muted-foreground">·</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-[9px] text-muted-foreground hover:underline"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Day of week labels */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[9px] font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Week 1 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">
            Semana {format(week1[0], "w", { locale: es })}
          </span>
          <button
            type="button"
            onClick={() => selectWeek(week1)}
            className="text-[9px] text-primary hover:underline"
          >
            {week1AllSelected ? "Deseleccionar" : "Esta semana"}
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {week1.map(renderDay)}
        </div>
      </div>

      {/* Week 2 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">
            Semana {format(week2[0], "w", { locale: es })}
          </span>
          <button
            type="button"
            onClick={() => selectWeek(week2)}
            className="text-[9px] text-primary hover:underline"
          >
            {week2AllSelected ? "Deseleccionar" : "Próxima semana"}
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {week2.map(renderDay)}
        </div>
      </div>
    </div>
  );
}
