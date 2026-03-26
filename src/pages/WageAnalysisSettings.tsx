import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function WageAnalysisSettings() {
  const [socialSecurityRate, setSocialSecurityRate] = useState("30");
  const [vacationBonus, setVacationBonus] = useState(false);
  const [allowManagerAccess, setAllowManagerAccess] = useState(false);

  useEffect(() => {
    document.title = "Análisis del planning | TurnoSmart";
  }, []);

  const handleSave = () => {
    toast.success("Configuración guardada correctamente");
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Análisis del planning</h1>
        <p className="text-sm text-gray-600">
          El objetivo de costo de los turnos / ventas se establece por establecimiento.<br />
          Indique aquí sus preferencias y se aplicarán a todos sus establecimientos.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Costo de los turnos</h3>
        
        <div className="space-y-6">
          {/* Cotización a la Seguridad Social */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-1">Cotización a la Seguridad Social</div>
              <p className="text-sm text-gray-600">
                Tasa media de contribuciones del empresario que se utilizará para la estimación de los costes
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Input
                type="number"
                value={socialSecurityRate}
                onChange={(e) => setSocialSecurityRate(e.target.value)}
                className="w-16 h-8 text-center text-sm"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>

          {/* Añadir un 10% por pago de vacaciones */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Añadir un 10% por pago de vacaciones a la tarifa horaria
              </div>
              <p className="text-sm text-gray-600">
                El coste horario estimado de los empleados se incrementará en un 10% en la tabla de análisis
              </p>
            </div>
            <Switch
              checked={vacationBonus}
              onCheckedChange={setVacationBonus}
              className="ml-4"
            />
          </div>

          {/* Permitir acceso a managers/directores */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Permitir a los managers/directores acceder a los costos reales de los turnos en el análisis
              </div>
            </div>
            <Switch
              checked={allowManagerAccess}
              onCheckedChange={setAllowManagerAccess}
              className="ml-4"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <Button 
            onClick={handleSave}
            className="bg-gray-500 hover:bg-gray-600 text-white rounded-full px-6 py-2 text-sm font-medium"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}