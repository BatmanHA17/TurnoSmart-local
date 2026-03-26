import { Outlet, useLocation, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { SchedulesNav } from "@/components/SchedulesNav";

export function SettingsSchedulesLayout() {
  const location = useLocation();
  const isRootSchedules = location.pathname === "/settings/schedules";

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white shadow-sm min-h-screen">
            <div className="p-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-6">Configuración de Horarios</h1>
              <SchedulesNav />
            </div>
          </div>

          <div className="flex-1">
            {isRootSchedules ? (
              <Navigate to="/settings/schedules/shifts" replace />
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
