import { useEffect } from "react";
import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";

export default function HRAbsences() {
  useEffect(() => {
    document.title = "HR Absences – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">Absences</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Detailed absence analysis
              </p>
            </div>
            
            <div className="text-muted-foreground">
              Absence analysis pending implementation
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}