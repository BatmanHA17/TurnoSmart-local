import { MainLayout } from "@/components/MainLayout";
import { HoursBankConfig } from "@/components/HoursBankConfig";
import { useEffect } from "react";

export default function BancoHoras() {
  useEffect(() => {
    document.title = "Banco de Horas – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <HoursBankConfig />
      </div>
    </MainLayout>
  );
}
