import { Outlet, useLocation, NavLink, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import {
  Briefcase,
  FileText,
  Building2,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNavigation = [
  {
    title: "Configuración",
    items: [
      {
        id: "jobs",
        label: "Puestos de trabajo",
        icon: Briefcase,
        path: "/config/jobs"
      },
      {
        id: "convenio",
        label: "Convenio colectivo",
        icon: FileText,
        path: "/config/convenio"
      },
      {
        id: "criterios",
        label: "Criterios SMART",
        icon: Brain,
        path: "/config/criterios"
      }
    ]
  }
];

export function SettingsLayout() {
  const location = useLocation();

  // Redirect root /config or legacy /settings to /config/jobs
  const isRoot = location.pathname === "/config" || location.pathname === "/settings";

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-56 bg-white shadow-sm min-h-screen">
            <div className="p-6">
              <h1 className="text-lg font-semibold text-gray-900 mb-6">Configuración</h1>

              <nav className="space-y-6">
                {settingsNavigation.map((section) => (
                  <div key={section.title}>
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
            {isRoot ? (
              <Navigate to="/config/jobs" replace />
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
