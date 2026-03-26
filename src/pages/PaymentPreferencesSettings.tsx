import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export default function PaymentPreferencesSettings() {
  const [compensateDefectHours, setCompensateDefectHours] = useState(false);
  const [includeBreaksInNormalHours, setIncludeBreaksInNormalHours] = useState(true);
  const [autoGenerateEmployeeNumbers, setAutoGenerateEmployeeNumbers] = useState(false);
  const [allowDirectorsModifyPayroll, setAllowDirectorsModifyPayroll] = useState(true);
  const [allowManagersAccessPayroll, setAllowManagersAccessPayroll] = useState(true);
  const [showBonificationsOnEmployeePage, setShowBonificationsOnEmployeePage] = useState(true);

  useEffect(() => {
    console.log("🔥 PaymentPreferencesSettings - PRENÓMINA PAGE LOADED!");
    document.title = "Prenómina | TurnoSmart";
  }, []);

  return (
    <TooltipProvider>
      <div className="p-6 bg-white min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nómina</h1>
        </div>

        <div className="space-y-8">
          {/* Períodos de nómina */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Períodos de nómina</h3>
            
            <div className="space-y-6">
              {/* Compensar las horas por defecto */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Compensar las horas por defecto
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    La compensación permite calcular las horas extras por mes, en lugar de por semana.{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-800">Leer más</a>
                  </div>
                  <div className="text-sm text-red-600">
                    Cuidado: Activar esta opción puede implicar riesgos legales con el Código Laboral.
                  </div>
                </div>
                <Switch
                  checked={compensateDefectHours}
                  onCheckedChange={setCompensateDefectHours}
                  className="ml-4"
                />
              </div>

              {/* Incluir descansos y ausencias */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Incluir descansos y ausencias en las horas normales
                  </div>
                  <div className="text-sm text-gray-600">
                    Las horas normales son las horas trabajadas que exceden el tiempo contractual debido a ausencias. Estas horas se pagan a la tarifa normal.{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-800">Leer más</a>
                  </div>
                </div>
                <Switch
                  checked={includeBreaksInNormalHours}
                  onCheckedChange={setIncludeBreaksInNormalHours}
                  className="ml-4"
                />
              </div>
            </div>
          </div>

          {/* Números de identificación de empleados */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Números de identificación de empleados</h3>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Activar la generación automática de números de identificación
                </div>
                <div className="text-sm text-gray-600">
                  Generalmente, el número de identificación de un empleado corresponde a su ID en su herramienta o software de nómina.
                </div>
              </div>
              <Switch
                checked={autoGenerateEmployeeNumbers}
                onCheckedChange={setAutoGenerateEmployeeNumbers}
                className="ml-4"
              />
            </div>
          </div>

          {/* Roles y permisos */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Roles y permisos</h3>
            
            <div className="space-y-6">
              {/* Permitir a los directores */}
              <div className="flex items-start justify-between">
                <div className="flex-1 flex items-start gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Permitir a los directores crear, modificar o eliminar períodos de nómina
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Los directores pueden consultar los períodos de nómina y agregar o modificar las bonificaciones en el informe de nómina de sus establecimientos.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch
                  checked={allowDirectorsModifyPayroll}
                  onCheckedChange={setAllowDirectorsModifyPayroll}
                  className="ml-4"
                />
              </div>

              {/* Permitir a los managers */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Permitir a los managers acceder a los períodos de nómina y añadir bonificaciones
                  </div>
                </div>
                <Switch
                  checked={allowManagersAccessPayroll}
                  onCheckedChange={setAllowManagersAccessPayroll}
                  className="ml-4"
                />
              </div>

              {/* Mostrar bonificaciones */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Mostrar bonificaciones en la página del empleado
                  </div>
                  <div className="text-sm text-gray-600">
                    Disponible solo para los roles de empleado, manager y director.
                  </div>
                </div>
                <Switch
                  checked={showBonificationsOnEmployeePage}
                  onCheckedChange={setShowBonificationsOnEmployeePage}
                  className="ml-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}