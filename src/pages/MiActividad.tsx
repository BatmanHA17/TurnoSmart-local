import { MainLayout } from "@/components/MainLayout";
import { MiActividadDashboard } from "@/components/MiActividadDashboard";
import { useEffect } from "react";

export default function MiActividad() {
  useEffect(() => {
    document.title = "Mi Actividad – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <MiActividadDashboard />
    </MainLayout>
  );
}