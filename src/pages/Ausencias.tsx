import { MainLayout } from "@/components/MainLayout";
import { AbsenceManagementConfig } from "@/components/AbsenceManagementConfig";
import { useEffect } from "react";

export default function Ausencias() {
  useEffect(() => {
    document.title = "Gestión de Ausencias – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <AbsenceManagementConfig />
      </div>
    </MainLayout>
  );
}
