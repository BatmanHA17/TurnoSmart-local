export interface CalendarEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  workingHours: string;
  startDate?: string;
  /** SMART engine role — determines rotation behavior */
  engine_role?: string;
  /** Seniority date from DB — used for night coverage rotation order */
  fecha_antiguedad?: string | null;
  /** Whether this employee can cover night shifts */
  can_cover_nights?: boolean;
}

export interface GoogleCalendarStyleProps {
  approvedRequests?: import("../TeamCalendar").ApprovedRequest[];
}
