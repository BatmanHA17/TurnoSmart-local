import { MainLayout } from "@/components/MainLayout";
import { NightShiftConfig } from "@/components/NightShiftConfig";
import { useEffect } from "react";

export default function TurnosNocturnos() {
  useEffect(() => {
    document.title = "Turnos Nocturnos – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <NightShiftConfig />
      </div>
    </MainLayout>
  );
}
