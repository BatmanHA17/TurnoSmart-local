import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { calculateStaffing } from "@/utils/calculations";
import { occupancyBudgets } from "@/data/employees";

export function PlanningCalculator() {
  const [occupancy, setOccupancy] = useState(85);
  const [absenteeism, setAbsenteeism] = useState(10);

  const staffing = calculateStaffing(occupancy, absenteeism / 100);
  const budget = occupancyBudgets.find(b => occupancy >= b.occupancy) || occupancyBudgets[occupancyBudgets.length - 1];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Planificación y Presupuesto</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Calculadora de plantilla según ocupación hotelera y parámetros operacionales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Parámetros de Cálculo</CardTitle>
            <CardDescription className="text-sm">
              Ajusta los valores para calcular la plantilla necesaria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="occupancy" className="text-sm font-medium">
                Ocupación del Hotel: {occupancy}%
              </Label>
              <Slider
                id="occupancy"
                min={30}
                max={120}
                step={5}
                value={[occupancy]}
                onValueChange={([value]) => setOccupancy(value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30%</span>
                <span>120%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="absenteeism" className="text-sm font-medium">
                Tasa de Absentismo: {absenteeism}%
              </Label>
              <Slider
                id="absenteeism"
                min={2}
                max={15}
                step={1}
                value={[absenteeism]}
                onValueChange={([value]) => setAbsenteeism(value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2%</span>
                <span>15%</span>
              </div>
            </div>

            <div className="pt-4 space-y-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Clientes:</span>
                <Badge variant="secondary">{budget.clients}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ratio Clientes/Personal:</span>
                <Badge variant="outline">
                  {(budget.clients / budget.presentialTotal).toFixed(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Desglose por Categorías</CardTitle>
            <CardDescription className="text-sm">
              Distribución de personal según ocupación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between py-2 border-b text-sm">
                <span className="font-medium">Jefe de Bares:</span>
                <span className="font-bold text-blue-600">{budget.jefeBares}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b text-sm">
                <span className="font-medium">2º Jefe de Bares:</span>
                <span className="font-bold text-blue-600">{budget.segundoJefeBares}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b text-sm">
                <span className="font-medium">Jefe de Sector:</span>
                <span className="font-bold text-green-600">{budget.jefeSector}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b text-sm">
                <span className="font-medium">Camareros:</span>
                <span className="font-bold text-green-600">{budget.camareros}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b text-sm">
                <span className="font-medium">Ayudantes:</span>
                <span className="font-bold text-yellow-600">{budget.ayudantes}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b bg-blue-50 px-2 rounded text-sm">
                <span className="font-semibold text-blue-800">Total Presencial:</span>
                <span className="font-bold text-blue-800">{budget.presentialTotal}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">ETT Externo:</span>
                <span className="font-bold text-orange-600">{budget.ettExternal}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Calculation */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Plantilla Total Calculada</CardTitle>
            <CardDescription className="text-sm">
              Resultado final considerando todos los factores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between py-2 border-b text-sm">
                <span>Plantilla Presencial:</span>
                <span className="font-bold text-blue-600">
                  {staffing.presentialStaff.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b text-sm">
                <span>Plantilla Librando:</span>
                <span className="font-bold text-green-600">
                  {staffing.leaveStaff.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b bg-gray-50 px-2 rounded text-sm">
                <span className="font-semibold">Total Plantilla Activa:</span>
                <span className="font-bold">
                  {staffing.activeStaff.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b text-sm">
                <span>Para Vacaciones (48 días):</span>
                <span className="font-bold text-yellow-600">
                  {staffing.vacationStaff.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b text-sm">
                <span>Para Absentismo ({absenteeism}%):</span>
                <span className="font-bold text-orange-600">
                  {staffing.absenteeismStaff.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 mt-2 bg-primary/10 px-3 rounded-lg">
                <span className="font-bold text-primary text-sm">PLANTILLA TOTAL BRUTA:</span>
                <span className="font-bold text-lg md:text-2xl text-primary">
                  {staffing.grossStaff.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 text-sm">Fórmulas Aplicadas:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Plantilla Librando = Presencial × 1.4 - Presencial</li>
                <li>• Plantilla Activa = Presencial + Librando</li>
                <li>• Vacaciones = Activa × 48 ÷ (365 - 48)</li>
                <li>• Absentismo = Activa × % Absentismo</li>
                <li>• Total Bruto = Activa + Vacaciones + Absentismo</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}