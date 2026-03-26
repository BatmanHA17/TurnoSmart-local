import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Users } from "lucide-react";

interface CuadranteHeaderProps {
  onBack?: () => void;
  readOnly?: boolean;
}

export function CuadranteHeader({ onBack, readOnly }: CuadranteHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="pb-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Editor de Cuadrante</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Editor completo para gestionar cuadrantes mensuales con funcionalidades avanzadas
            </p>
          </div>
          {onBack && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Volver a Cuadrantes
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Volver a la lista de cuadrantes</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Modo solo lectura */}
      {readOnly && (
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
              <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Modo Solo Lectura</h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Este cuadrante está en modo visualización. No puedes realizar cambios.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
