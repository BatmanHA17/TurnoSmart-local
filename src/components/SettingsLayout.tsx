import { Outlet, useLocation, NavLink, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { 
  Building2, 
  FileText, 
  BarChart3, 
  FileStack, 
  Settings as SettingsIcon, 
  Bell, 
  Gift, 
  Plane, 
  UserCheck, 
  Clock, 
  Zap, 
  Shield 
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNavigation = [
  {
    title: "Información del establecimiento",
    items: [
      {
        id: "contact",
        label: "Información de la cuenta",
        icon: Building2,
        path: "/settings/contact"
      },
      {
        id: "collective-agreement",
        label: "Convenio colectivo",
        icon: FileText,
        path: "/settings/collective-agreement"
      },
      {
        id: "productivity",
        label: "Productividad",
        icon: BarChart3,
        path: "/settings/productivity"
      }
    ]
  },
  {
    title: "Planificación",
    items: [
      {
        id: "locations",
        label: "Establecimientos y Rotas",
        icon: Building2,
        path: "/settings/locations"
      },
      {
        id: "print",
        label: "Impresión",
        icon: FileStack,
        path: "/settings/print"
      },
      {
        id: "preferences",
        label: "Preferencias",
        icon: SettingsIcon,
        path: "/settings/preferences"
      },
      {
        id: "notifications",
        label: "Notificaciones SMS",
        icon: Bell,
        path: "/settings/notifications"
      }
    ]
  },
  {
    title: "Gestión",
    items: [
      {
        id: "wage-analysis",
        label: "Análisis de la Rota",
        icon: BarChart3,
        path: "/settings/wage-analysis"
      },
      {
        id: "payment-preferences",
        label: "Prenómina",
        icon: Gift,
        path: "/settings/payment-preferences"
      },
      {
        id: "timeoff-rules",
        label: "Vacaciones",
        icon: Plane,
        path: "/settings/timeoff-rules"
      },
      {
        id: "templates-docus",
        label: "Plantillas de documentos",
        icon: FileStack,
        path: "/settings/templates-docus"
      },
      {
        id: "jobs",
        label: "Gestión de los empleos",
        icon: UserCheck,
        path: "/settings/jobs"
      }
    ]
  },
  {
    title: "Integraciones",
    items: [
      {
        id: "clockin-clockout",
        label: "Control Horario",
        icon: Clock,
        path: "/settings/clockin-clockout"
      },
      {
        id: "marketplace",
        label: "Integración",
        icon: Zap,
        path: "/settings/marketplace"
      }
    ]
  },
  {
    title: "Legal",
    items: [
      {
        id: "RGPD",
        label: "RGPD",
        icon: Shield,
        path: "/settings/RGPD"
      }
    ]
  }
];

export function SettingsLayout() {
  const location = useLocation();

  const isRootSettings = location.pathname === "/settings";

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-sm min-h-screen">
            <div className="p-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-6">Configuración</h1>
              
              <nav className="space-y-6">
                {settingsNavigation.map((section) => (
                  <div key={section.title}>
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {section.title}
                    </h2>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
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
                  </div>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex-1">
            {isRootSettings ? (
              <Navigate to="/settings/locations" replace />
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}