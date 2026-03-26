import { MainLayout } from "@/components/MainLayout";
import { PlanningConfiguration } from "@/components/PlanningConfiguration";
import { useEffect } from "react";

export default function PlanificacionAutomatica() {
  useEffect(() => {
    document.title = "Rotas – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Rotas</h1>
            <p className="text-muted-foreground">
              Configure los ajustes de rotas y horarios de trabajo
            </p>
          </div>
          <PlanningConfiguration />
        </div>
      </div>
    </MainLayout>
  );
}
