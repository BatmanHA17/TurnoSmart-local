import { MainLayout } from "@/components/MainLayout";
import { ScheduleTable } from "@/components/ScheduleTable";
import { ViewModeSelector } from "@/components/calendar/ViewModeSelector";
import { useEffect } from "react";

export default function Turnos() {
  useEffect(() => {
    document.title = "Cuadrante de personas – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Cuadrante de personas</h1>
              <p className="text-sm text-muted-foreground">Planifica y visualiza el cuadrante mensual.</p>
            </div>
            <ViewModeSelector />
          </div>
        </header>
        <ScheduleTable />
      </div>
    </MainLayout>
  );
}
