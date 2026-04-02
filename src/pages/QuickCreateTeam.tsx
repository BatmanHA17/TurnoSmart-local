import { MainLayout } from "@/components/MainLayout";
import { QuickCreateTeam } from "@/components/colaboradores/QuickCreateTeam";
import { useEffect } from "react";

export default function QuickCreateTeamPage() {
  useEffect(() => {
    document.title = "Creador Rápido – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <QuickCreateTeam />
    </MainLayout>
  );
}
