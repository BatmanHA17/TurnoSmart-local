import { useEffect } from "react";
import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";

export default function HRWorkPermits() {
  useEffect(() => {
    document.title = "HR Permisos de Trabajo – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">Permisos de trabajo</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gestión de permisos de trabajo
              </p>
            </div>
            
            <div className="text-muted-foreground">
              Gestión de permisos de trabajo pendiente de implementación
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}