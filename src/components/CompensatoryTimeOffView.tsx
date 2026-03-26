import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";
import { NotionCard } from "@/components/ui/notion-components";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCompensatoryTimeOff } from "@/hooks/useCompensatoryTimeOff";
import { CompensatoryTimeOffBalancePopover } from "./CompensatoryTimeOffBalancePopover";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CompensatoryTimeOffViewProps {
  onBack: () => void;
  colaboradorName: string;
  colaboradorId: string;
}

export function CompensatoryTimeOffView({ onBack, colaboradorName, colaboradorId }: CompensatoryTimeOffViewProps) {
  const { balance, history, loading, updateBalance } = useCompensatoryTimeOff(colaboradorId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compensación H. Extras</h1>
          <p className="text-muted-foreground">Gestión de horas extras para {colaboradorName}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Current Balance */}
        <NotionCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Balance Actual</h3>
              <p className="text-3xl font-bold text-foreground">
                {loading ? "..." : `${balance}h`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {balance === 0 ? "No hay horas acumuladas" : 
                 balance > 0 ? "Horas a favor del colaborador" : "Horas en deuda"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CompensatoryTimeOffBalancePopover onUpdate={updateBalance}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  Modificar manualmente
                </Button>
              </CompensatoryTimeOffBalancePopover>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Info
              </Button>
            </div>
          </div>
        </NotionCard>

        {/* Action History */}
        <NotionCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Historial de acciones</h3>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-5 bg-muted/30 p-3 rounded-lg mb-4">
            <span className="text-sm font-medium text-foreground">Fecha</span>
            <span className="text-sm font-medium text-foreground">Acción realizada</span>
            <span className="text-sm font-medium text-foreground">Realizado por</span>
            <span className="text-sm font-medium text-foreground">Valor</span>
            <span className="text-sm font-medium text-foreground">Saldo</span>
          </div>

          {/* History entries or empty state */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-center text-muted-foreground text-sm">
                Cargando historial...
              </p>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-2">
              {(() => {
                // Ordenar historial cronológicamente (más antiguo primero) para calcular saldos correctos
                const chronologicalHistory = [...history].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                
                // Calcular saldos acumulativos
                const balances: { [key: string]: number } = {};
                let runningBalance = 0;
                
                chronologicalHistory.forEach((entry) => {
                  runningBalance += Number(entry.hours_change);
                  balances[entry.id] = runningBalance;
                });
                
                // Mostrar en orden original (más reciente primero) pero con saldos correctos
                return history.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-5 p-3 rounded-lg border border-muted/30">
                    <span className="text-sm text-foreground">
                      {format(new Date(entry.created_at), "dd/MM/yyyy", { locale: es })}
                    </span>
                    <span className="text-sm text-foreground">
                      {entry.action_description}
                    </span>
                    <span className="text-sm text-foreground">
                      {entry.performed_by}
                    </span>
                    <span className={`text-sm font-medium ${
                      entry.hours_change > 0 ? 'text-green-600' : 
                      entry.hours_change < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {entry.hours_change > 0 ? '+' : ''}{entry.hours_change}h
                    </span>
                    <span className={`text-sm font-medium ${
                      balances[entry.id] > 0 ? 'text-green-600' : 
                      balances[entry.id] < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {balances[entry.id]}h
                    </span>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-center text-muted-foreground text-sm">
                No hay acciones registradas en el historial
              </p>
            </div>
          )}
        </NotionCard>
      </div>
    </div>
  );
}