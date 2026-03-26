import { NavLink } from "react-router-dom";
import { 
  Calendar, 
  Star, 
  Moon, 
  RotateCw, 
  FileText, 
  Clock 
} from "lucide-react";
import { cn } from "@/lib/utils";

const schedulesNavigation = [
  {
    id: "shifts",
    label: "Crear/Editar Turnos",
    icon: Calendar,
    path: "/settings/schedules/shifts"
  },
  {
    id: "saved",
    label: "Turnos Guardados",
    icon: Star,
    path: "/settings/schedules/saved"
  },
  {
    id: "night",
    label: "Turnos Nocturnos",
    icon: Moon,
    path: "/settings/schedules/night"
  },
  {
    id: "rotating",
    label: "Turnos Rotativos",
    icon: RotateCw,
    path: "/settings/schedules/rotating"
  },
  {
    id: "policies",
    label: "Políticas Laborales",
    icon: FileText,
    path: "/settings/schedules/policies"
  },
  {
    id: "workday",
    label: "Gestión de Jornada",
    icon: Clock,
    path: "/settings/schedules/workday"
  }
];

export function SchedulesNav() {
  return (
    <nav>
      <ul className="space-y-1">
        {schedulesNavigation.map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
