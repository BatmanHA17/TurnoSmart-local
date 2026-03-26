import { MainLayout } from "@/components/MainLayout";
import { ShiftManagementToolConfig } from "@/components/ShiftManagementToolConfig";
import { useEffect } from "react";

export default function PoliticasLaborales() {
  useEffect(() => {
    document.title = "Políticas Laborales – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <ShiftManagementToolConfig />
      </div>
    </MainLayout>
  );
}
