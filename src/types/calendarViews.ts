import { LucideIcon } from "lucide-react";

export type CalendarViewMode = "day" | "week" | "biweek" | "tags" | "month" | "attendance";

export interface CalendarView {
  id: CalendarViewMode;
  label: string;
  icon: LucideIcon;
  available: boolean;
  route: string;
}
