import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Clock, Users } from 'lucide-react';
import { useRotasMultiOrg } from '@/hooks/useRotasMultiOrg';
import { useColaboradorFull } from '@/hooks/useColaboradorFull';

interface RotaAssignmentCardProps {
  colaboradorId: string;
  colaboradorName: string;
}

export const RotaAssignmentCard = ({ colaboradorId, colaboradorName }: RotaAssignmentCardProps) => {
  const { rotas, colaboradorRotas, loading, assignToRota, removeFromRota, refetch } = useRotasMultiOrg(colaboradorId);
  const [selectedRotaId, setSelectedRotaId] = useState<string>("");
  const { fetchColaboradores } = useColaboradorFull();

  const handleAssignToRota = async () => {
    if (!selectedRotaId) return;

    const success = await assignToRota(selectedRotaId);
    if (success) {
      setSelectedRotaId("");
      fetchColaboradores();
    }
  };

  const handleRemoveFromRota = async (rotaId: string) => {
    const success = await removeFromRota(rotaId);
    if (success) {
      fetchColaboradores();
    }
  };

  // Agrupar rotas por organización
  const rotasByOrg = rotas.reduce((acc, rota) => {
    if (!acc[rota.org_id]) {
      acc[rota.org_id] = {
        org_name: rota.org_name,
        rotas: [],
      };
    }
    acc[rota.org_id].rotas.push(rota);
    return acc;
  }, {} as Record<string, { org_name: string; rotas: typeof rotas }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Rotas Asignadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rotas actuales */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Rotas actuales</h4>
          {loading ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Cargando rotas...
            </div>
          ) : colaboradorRotas.length > 0 ? (
            <div className="space-y-2">
              {colaboradorRotas.map((rota) => (
                <div key={rota.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <Badge variant="secondary">{rota.name}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {rota.org_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {rota.member_count} colaboradores
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromRota(rota.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center">
              {colaboradorName} no está asignado a ninguna rota
            </div>
          )}
        </div>

        {/* Asignar nueva rota */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-sm">Asignar a nueva rota</h4>
          <div className="flex gap-2">
            <Select 
              value={selectedRotaId} 
              onValueChange={setSelectedRotaId}
              disabled={loading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue 
                  placeholder={loading ? "Cargando rotas..." : "Seleccionar rota"} 
                />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(rotasByOrg).map(([orgId, { org_name, rotas: orgRotas }]) => (
                  <React.Fragment key={orgId}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {org_name}
                    </div>
                    {orgRotas
                      .filter(rota => !colaboradorRotas.some(cr => cr.id === rota.id))
                      .map((rota) => (
                        <SelectItem key={rota.id} value={rota.id}>
                          {rota.name} ({rota.member_count} colaboradores)
                        </SelectItem>
                      ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAssignToRota}
              size="sm"
              disabled={!selectedRotaId || loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              Asignar
            </Button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Los colaboradores pueden estar asignados a múltiples rotas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};