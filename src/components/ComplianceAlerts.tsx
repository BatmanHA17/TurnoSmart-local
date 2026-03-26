import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { employees } from "@/data/employees";
import { checkComplianceViolations } from "@/utils/calculations";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

export function ComplianceAlerts() {
  const violations = checkComplianceViolations(employees);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Alertas de Cumplimiento</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Monitorización del cumplimiento de la normativa laboral española
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Empleados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-600">
              {employees.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Empleados monitorizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Detectadas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-red-600">
              {violations.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Posibles incumplimientos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Cumplimiento
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-yellow-600">
              {(((employees.length * 5 - violations.length) / (employees.length * 5)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Semanas sin infracciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Legal Framework Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Marco Normativo Aplicable
          </CardTitle>
          <CardDescription className="text-sm">
            Bases legales para la detección de incumplimientos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Ley Laboral Española:</h4>
              <ul className="text-sm space-y-1">
                <li>• 40 horas semanales máximo (8h diarias)</li>
                <li>• 2 días de descanso semanal obligatorios</li>
                <li>• Días libres preferentemente consecutivos</li>
                <li>• Descanso mínimo de 12h entre jornadas</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Convenio Hostelería Las Palmas:</h4>
              <ul className="text-sm space-y-1">
                <li>• 48 días de vacaciones anuales</li>
                <li>• 30 días naturales + 18 días festivos</li>
                <li>• Turnos rotativos según necesidades</li>
                <li>• Compensación por festivos trabajados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            {violations.length > 0 ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            Detalle de Incumplimientos
          </CardTitle>
          <CardDescription className="text-sm">
            {violations.length > 0 
              ? "Se han detectado las siguientes irregularidades que requieren atención"
              : "No se han detectado irregularidades en la planificación actual"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {violations.length > 0 ? (
            <>
              {/* Mobile Cards View */}
              <div className="block md:hidden space-y-3">
                {violations.map((violation, index) => (
                  <Card key={index} className="p-4 bg-red-50 border-red-200">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{violation.employeeName}</h4>
                          <Badge variant="outline" className="mt-1">
                            Semana {violation.week}
                          </Badge>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {violation.violation === 'NON_CONSECUTIVE_DAYS' 
                            ? 'Días no consecutivos' 
                            : 'Días libres insuficientes'
                          }
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>Descripción:</strong> {violation.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Acción sugerida:</strong> {violation.suggestion}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Revisar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Semana</TableHead>
                      <TableHead>Tipo de Violación</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Acción Sugerida</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violations.map((violation, index) => (
                      <TableRow key={index} className="bg-red-50">
                        <TableCell className="font-medium">
                          {violation.employeeName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Semana {violation.week}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {violation.violation === 'NON_CONSECUTIVE_DAYS' 
                              ? 'Días no consecutivos' 
                              : 'Días libres insuficientes'
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {violation.description}
                        </TableCell>
                        <TableCell className="text-sm">
                          {violation.suggestion}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Revisar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-800">
                ¡Cumplimiento Perfecto!
              </h3>
              <p className="text-sm text-green-600 mt-2">
                La planificación actual cumple con todos los requisitos de la normativa laboral.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Nota Legal Importante:</strong> Esta herramienta detecta posibles irregularidades 
          basándose en la normativa laboral española vigente. En casos excepcionales y debidamente 
          justificados, ciertos incumplimientos pueden ser temporalmente aceptables. Se recomienda 
          documentar todas las excepciones para mantener un registro histórico y legal.
        </AlertDescription>
      </Alert>
    </div>
  );
}