import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users } from 'lucide-react';
import { useRota } from '@/hooks/useRota';

interface PlanningConfigurationRotaProps {
  onRotaSelect?: (rotaId: string) => void;
  orgId?: string;
}

export const PlanningConfigurationRota = ({ onRotaSelect, orgId }: PlanningConfigurationRotaProps) => {
  const { rotas, loading } = useRota(orgId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5" />
          Rotas del establecimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <div className="mb-2">
            🔗 <strong>Sincronización automática:</strong> Las rotas se crean automáticamente cuando creas departamentos en{' '}
            <a href="/settings/jobs" className="text-primary font-medium hover:underline">
              Configuración → Puestos de trabajo
            </a>.
          </div>
          Organiza a tus colaboradores en rotas de trabajo (cocina, sala, recepción, etc.). 
          Cada rota funciona de forma independiente y se publica por separado.
        </div>

        {/* Header con título y contador */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">
            Rotas sincronizadas ({rotas.length})
          </div>
        </div>

        {/* Lista de rotas en formato horizontal */}
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando rotas...</div>
        ) : rotas.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {rotas.map((rota) => (
              <div 
                key={rota.id}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-accent/50 transition-colors cursor-pointer min-w-fit"
                onClick={() => onRotaSelect?.(rota.id)}
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{rota.name}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                  <Users className="h-3 w-3" />
                  <span>{rota.member_count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">
            No hay rotas disponibles. Las rotas se crean automáticamente desde los 
            <span className="font-medium"> departamentos</span> configurados en job_departments.
          </div>
        )}
      </CardContent>
    </Card>
  );
};