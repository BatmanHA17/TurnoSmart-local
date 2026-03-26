import { MainLayout } from "@/components/MainLayout";
import { ScheduleExportConfig } from "@/components/ScheduleExportConfig";
import { useEffect } from "react";

export default function Exportar() {
  useEffect(() => {
    document.title = "Exportar Horarios – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <ScheduleExportConfig />
      </div>
    </MainLayout>
  );
}
