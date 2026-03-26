import { MainLayout } from "@/components/MainLayout";
import { LeaveRequestWorkflow } from "@/components/LeaveRequestWorkflow";
import { useEffect } from "react";

export default function SolicitudesAusencia() {
  useEffect(() => {
    document.title = "Solicitudes de Ausencia – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <LeaveRequestWorkflow />
      </div>
    </MainLayout>
  );
}