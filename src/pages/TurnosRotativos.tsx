import { MainLayout } from "@/components/MainLayout";
import { RotatingShiftsConfig } from "@/components/RotatingShiftsConfig";
import { useEffect } from "react";

export default function TurnosRotativos() {
  useEffect(() => {
    document.title = "Turnos Rotativos – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <RotatingShiftsConfig />
      </div>
    </MainLayout>
  );
}
