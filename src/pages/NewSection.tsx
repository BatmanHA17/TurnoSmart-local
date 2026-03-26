import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NewSectionSidebar } from "@/components/NewSectionSidebar";
import { ConfigurationHub } from "@/components/ConfigurationHub";

const NewSection = () => {
  const [activeTab, setActiveTab] = useState("inicio");

  const renderContent = () => {
    switch (activeTab) {
      case "inicio":
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Gestión de Turnos</h1>
            <p className="text-muted-foreground mb-6">
              Esta es la nueva sección donde configuraremos las reglas, políticas y directrices
              para la gestión automatizada de turnos hoteleros basada en el sistema Excel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                   onClick={() => setActiveTab("configuracion")}>
                <h3 className="font-semibold mb-2">Configuración de Políticas</h3>
                <p className="text-sm text-muted-foreground">
                  Configure días de descanso automáticos, restricciones laborales y normativas.
                </p>
              </div>
            </div>
          </div>
        );
      case "configuracion":
        return <ConfigurationHub />;
      default:
        return (
          <div className="p-8">
            <h2 className="text-xl font-semibold">Contenido en desarrollo</h2>
            <p className="text-muted-foreground mt-2">Esta sección estará disponible pronto.</p>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <NewSectionSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 bg-background">
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default NewSection;