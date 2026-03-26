import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function ClockinClockoutSettings() {
  const [clockinEnabled, setClockinEnabled] = useState(true);
  const [method, setMethod] = useState("mobile");
  const [tolerance, setTolerance] = useState("15");
  const [autoBreaks, setAutoBreaks] = useState(false);
  const [timezone, setTimezone] = useState("atlantic");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [reminders, setReminders] = useState(false);
  const [geolocation, setGeolocation] = useState(false);

  useEffect(() => {
    document.title = "Control Horario | TurnoSmart";
  }, []);

  const handleSave = () => {
    toast.success("Configuración de control horario guardada correctamente");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Control Horario</h1>
          <p className="text-gray-600">
            Configura las opciones de control horario y fichaje del personal
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zona horaria
                </label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar zona horaria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atlantic">Atlántico/Canarias</SelectItem>
                    <SelectItem value="madrid">Europa/Madrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato de hora
                </label>
                <Select value={timeFormat} onValueChange={setTimeFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 horas</SelectItem>
                    <SelectItem value="12h">12 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Configuraciones adicionales */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Recordatorios automáticos</h3>
                  <p className="text-sm text-gray-500">Enviar recordatorios de fichaje a los empleados</p>
                </div>
                <Switch checked={reminders} onCheckedChange={setReminders} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Geolocalización requerida</h3>
                  <p className="text-sm text-gray-500">Los empleados deben estar en el establecimiento para fichar</p>
                </div>
                <Switch checked={geolocation} onCheckedChange={setGeolocation} />
              </div>
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} className="px-6">
                Guardar configuración
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}