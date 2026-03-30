import { useCallback } from "react";
import { format } from "date-fns";
import { generateICalContent, downloadICalFile, ICalShift } from "@/utils/icalExport";

// Minimal types that match BiWeeklyCalendarView's local interfaces.
// We redeclare them here so the hook can be used independently.
interface ShiftBlock {
  id: string;
  employeeId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: string;
  name?: string;
  // Other ShiftBlock fields are irrelevant for iCal export
  [key: string]: unknown;
}

interface Employee {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface UseICalExportParams {
  shiftBlocks: ShiftBlock[];
  employees: Employee[];
  biWeekDays: Date[];
  /** Name shown in the calendar client (e.g. app or org name) */
  calendarName?: string;
}

/**
 * Converts ShiftBlock[] + Employee[] into a downloadable iCal file.
 *
 * @param employeeId — when provided, only that employee's shifts are exported.
 *                     When omitted (undefined), ALL shifts in the date range are exported.
 */
export function useICalExport({
  shiftBlocks,
  employees,
  biWeekDays,
  calendarName = "TurnoSmart",
}: UseICalExportParams) {
  const exportICal = useCallback(
    (employeeId?: string) => {
      // Build a lookup map for employee names
      const nameMap: Record<string, string> = {};
      for (const emp of employees) {
        nameMap[emp.id] = emp.name;
      }

      // Filter by employee if requested
      const filtered = employeeId
        ? shiftBlocks.filter((s) => s.employeeId === employeeId)
        : shiftBlocks;

      // Convert to ICalShift[]
      const icalShifts: ICalShift[] = filtered.map((s) => ({
        id: s.id,
        employeeName: nameMap[s.employeeId] ?? s.employeeId,
        date: s.date instanceof Date ? s.date : new Date(s.date as string),
        startTime: s.startTime,
        endTime: s.endTime,
        shiftName: s.name,
        type: s.type,
      }));

      if (icalShifts.length === 0) {
        return;
      }

      // Build a human-readable filename using the date range
      const rangeStart =
        biWeekDays.length > 0
          ? format(biWeekDays[0], "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd");
      const rangeEnd =
        biWeekDays.length > 0
          ? format(biWeekDays[biWeekDays.length - 1], "yyyy-MM-dd")
          : rangeStart;

      const suffix = employeeId
        ? (nameMap[employeeId] ?? employeeId).replace(/\s+/g, "-").toLowerCase()
        : "equipo";

      const filename = `turnosmart-${suffix}-${rangeStart}_${rangeEnd}.ics`;

      const content = generateICalContent(icalShifts, calendarName);
      downloadICalFile(content, filename);
    },
    [shiftBlocks, employees, biWeekDays, calendarName]
  );

  return { exportICal };
}
