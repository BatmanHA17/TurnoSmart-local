import { MainLayout } from "@/components/MainLayout";
import { ShiftSwapRequestConfig } from "@/components/ShiftSwapRequestConfig";
import { useEffect } from "react";

export default function SolicitudesCambio() {
  useEffect(() => {
    document.title = "Solicitudes de Cambio – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <ShiftSwapRequestConfig />
      </div>
    </MainLayout>
  );
}
