import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";

export default function MarketplaceSettings() {
  const [integrations] = useState([
    { id: 1, name: "Google Calendar", description: "Sincronización de turnos", enabled: true, category: "Calendario" },
    { id: 2, name: "Slack", description: "Notificaciones de equipo", enabled: false, category: "Comunicación" },
    { id: 3, name: "WhatsApp Business", description: "Mensajes automáticos", enabled: false, category: "Comunicación" },
    { id: 4, name: "PayPal", description: "Gestión de pagos", enabled: false, category: "Pagos" },
    { id: 5, name: "Stripe", description: "Procesamiento de pagos", enabled: true, category: "Pagos" }
  ]);

  useEffect(() => {
    document.title = "Integración | TurnoSmart";
  }, []);

  const handleToggleIntegration = (integrationName: string, enabled: boolean) => {
    const action = enabled ? "activado" : "desactivado";
    toast.success(`${integrationName} ${action} correctamente`);
  };

  const handleConfigure = (integrationName: string) => {
    toast.success(`Configurando ${integrationName}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Integración</h1>
          <p className="text-gray-600">
            Conecta tu cuenta con servicios externos para mejorar tu flujo de trabajo
          </p>
        </div>

        <div className="space-y-8">
          {["Calendario", "Comunicación", "Pagos"].map((category) => (
            <div key={category} className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">{category}</h2>
                <div className="space-y-4">
                  {integrations
                    .filter((integration) => integration.category === category)
                    .map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">{integration.name}</h3>
                            <p className="text-sm text-gray-500">{integration.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={integration.enabled}
                            onCheckedChange={(checked) => handleToggleIntegration(integration.name, checked)}
                          />
                          {integration.enabled && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfigure(integration.name)}
                              className="flex items-center gap-2"
                            >
                              Configurar
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}