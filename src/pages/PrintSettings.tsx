import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PrintSettings() {
  const [orientation, setOrientation] = useState("landscape");
  const [visualizationMode, setVisualizationMode] = useState("Normal");
  const [showContractualHours, setShowContractualHours] = useState(false);
  const [showOtherTeamShifts, setShowOtherTeamShifts] = useState(false);
  const [printSunday, setPrintSunday] = useState(true);
  const [printTimesheetColumn, setPrintTimesheetColumn] = useState(true);

  useEffect(() => {
    document.title = "Impresión | TurnoSmart";
  }, []);

  const handleSave = () => {
    toast.success("Configuración de impresión guardada correctamente");
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Impresión</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Impresión PDF</h2>
        
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-700 mb-3">Imprimir las Rotas en formato PDF con una orientación:</p>
            <RadioGroup value={orientation} onValueChange={setOrientation} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="landscape" id="landscape" />
                <Label htmlFor="landscape" className="text-sm text-gray-700">Paisaje</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="portrait" id="portrait" />
                <Label htmlFor="portrait" className="text-sm text-gray-700">Formato vertical</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Modo de visualización</label>
              <Select value={visualizationMode} onValueChange={setVisualizationMode}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal (10px)</SelectItem>
                  <SelectItem value="Pequeño">Pequeño (8px)</SelectItem>
                  <SelectItem value="Muy pequeño">Muy pequeño (6px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Mostrar el total de las horas contractuales y planificadas</label>
              <Switch 
                checked={showContractualHours} 
                onCheckedChange={setShowContractualHours}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Mostrar los turnos planificados en los otros equipos</label>
              <Switch 
                checked={showOtherTeamShifts} 
                onCheckedChange={setShowOtherTeamShifts}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Imprimir el domingo</label>
              <Switch 
                checked={printSunday} 
                onCheckedChange={setPrintSunday}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Imprimir la columna "fichajes"</label>
              <Switch 
                checked={printTimesheetColumn} 
                onCheckedChange={setPrintTimesheetColumn}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button 
              onClick={handleSave}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md px-4 py-2 text-sm font-medium"
              variant="secondary"
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}