export interface CalendarEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  workingHours: string;
  startDate?: string;
  /** SMART engine role — determines rotation behavior */
  engine_role?: string;
}

export interface GoogleCalendarStyleProps {
  approvedRequests?: import("../TeamCalendar").ApprovedRequest[];
}
