import { format } from "date-fns";

export interface ICalShift {
  id: string;
  employeeName: string;
  date: Date;
  startTime?: string; // "08:00"
  endTime?: string;   // "16:00"
  shiftName?: string; // "Mañana"
  type: string;
}

/**
 * Generates a valid RFC 5545 iCalendar string from an array of shifts.
 */
export function generateICalContent(
  shifts: ICalShift[],
  calendarName = "TurnoSmart"
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TurnoSmart//TurnoSmart//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName}`,
    "X-WR-TIMEZONE:Europe/Madrid",
  ];

  for (const shift of shifts) {
    const dateStr = format(shift.date, "yyyyMMdd");

    // Parse start/end times — default to 08:00-16:00 if absent
    const startHHMM = (shift.startTime ?? "08:00").replace(":", "");
    const endHHMM = (shift.endTime ?? "16:00").replace(":", "");

    const dtStart = `${dateStr}T${startHHMM}00`;
    const dtEnd = `${dateStr}T${endHHMM}00`;

    const summary = shift.shiftName ?? shift.type ?? "Turno";
    const description = `Turno TurnoSmart — ${shift.employeeName}`;

    // UID must be globally unique; use id + date for safety
    const uid = `${shift.id}-${dateStr}@turnosmart.app`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART;TZID=Europe/Madrid:${dtStart}`);
    lines.push(`DTEND;TZID=Europe/Madrid:${dtEnd}`);
    lines.push(`SUMMARY:${escapeICalText(summary)}`);
    lines.push(`DESCRIPTION:${escapeICalText(description)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 requires CRLF line endings
  return lines.join("\r\n");
}

/**
 * Triggers a browser download of the given iCal content as a .ics file.
 */
export function downloadICalFile(
  content: string,
  filename = "turnosmart-turnos.ics"
): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Escape special characters in iCal text values (RFC 5545 §3.3.11). */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
