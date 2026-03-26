import { useEffect, useState } from "react";
import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";
import { PerfilesIncompletosTable } from "@/components/perfiles-incompletos/PerfilesIncompletosTable";
import { PerfilesIncompletosFilters } from "@/components/perfiles-incompletos/PerfilesIncompletosFilters";
import { esStrings } from "@/i18n/es";

export default function HRIncompleteProfiles() {
  const [selectedEstablishment, setSelectedEstablishment] = useState("all");
  const [selectedMissingInfo, setSelectedMissingInfo] = useState("all");

  useEffect(() => {
    document.title = "Perfiles incompletos – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">{esStrings.perfilesIncompletos}</h1>
            </div>
            
            <PerfilesIncompletosFilters
              onEstablishmentChange={setSelectedEstablishment}
              onMissingInfoChange={setSelectedMissingInfo}
              selectedEstablishment={selectedEstablishment}
              selectedMissingInfo={selectedMissingInfo}
            />
            
            <PerfilesIncompletosTable />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}