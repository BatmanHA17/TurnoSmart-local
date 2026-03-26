import { PlanningConfigurationRota } from "./PlanningConfigurationRota";

interface PlanningConfigurationProps {
  orgId?: string;
}

export function PlanningConfiguration({ orgId }: PlanningConfigurationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Configuración de Rotas</h2>
        <p className="text-muted-foreground">
          Gestiona las rotas de trabajo sincronizadas desde los departamentos
        </p>
      </div>
      
      <PlanningConfigurationRota orgId={orgId} />
    </div>
  );
}