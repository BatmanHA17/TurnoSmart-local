import { useLocation, useNavigate } from "react-router-dom";
import { CalendarViewMode, CalendarView } from "@/types/calendarViews";
import { Calendar, CalendarDays, CalendarRange, Tag, ClipboardCheck } from "lucide-react";

export const CALENDAR_VIEWS: CalendarView[] = [
  {
    id: "day",
    label: "Vista día",
    icon: Calendar,
    available: true,
    route: "/turnosmart/day"
  },
  {
    id: "week",
    label: "Vista semanal",
    icon: Calendar,
    available: true,
    route: "/turnosmart/week"
  },
  {
    id: "biweek",
    label: "Vista 2 semanas",
    icon: CalendarRange,
    available: true,
    route: "/turnosmart/biweek"
  },
  {
    id: "month",
    label: "Vista mes",
    icon: CalendarDays,
    available: true,
    route: "/turnosmart/month"
  },
  {
    id: "tags",
    label: "Vista etiquetas",
    icon: Tag,
    available: true,
    route: "/turnosmart/tags"
  },
  {
    id: "attendance",
    label: "Vista asistencia",
    icon: ClipboardCheck,
    available: true,
    route: "/turnosmart/attendance"
  }
];

export function useCalendarViewMode() {
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentView = (): CalendarViewMode => {
    const path = location.pathname;

    if (path.includes("/turnosmart/day")) return "day";
    if (path.includes("/turnosmart/tags")) return "tags";
    if (path.includes("/turnosmart/attendance")) return "attendance";
    if (path.includes("/turnosmart/biweek")) return "biweek";
    if (path.includes("/turnosmart/month")) return "month";
    if (path.includes("/turnosmart/week") || path === "/turnosmart") return "week";

    return "week";
  };

  const currentView = getCurrentView();

  const changeView = (view: CalendarView) => {
    if (!view.available) return;

    const searchParams = new URLSearchParams(location.search);
    navigate(`${view.route}?${searchParams.toString()}`);
  };

  return {
    currentView,
    views: CALENDAR_VIEWS,
    changeView
  };
}
