import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EnhancedDateRangePicker } from "@/components/ui/enhanced-date-range-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ArrowLeft, Info, AlertTriangle, Clock, Building2, Users, X, Edit, Trash2, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface GestionJornadaStep1Props {
  onClose: () => void;
  editMode?: boolean;
  existingPeriod?: any;
}

export const GestionJornadaStep1 = ({ onClose, editMode = false, existingPeriod }: GestionJornadaStep1Props) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<"workday_management" | "hours_bank" | null>(
    existingPeriod ? existingPeriod.type : null
  );
  const [step, setStep] = useState<"select_type" | "configure">(
    editMode && existingPeriod ? "configure" : "select_type"
  );
  
  // Effect to update state when existingPeriod loads
  useEffect(() => {
    if (editMode && existingPeriod) {
      setSelectedType(existingPeriod.type);
      setStep("configure");
    }
  }, [editMode, existingPeriod]);
  
  // Campos del período de referencia - cargar datos existentes si está en modo edición
  const [startDate, setStartDate] = useState<Date | undefined>(
    existingPeriod?.settings?.startDate ? new Date(existingPeriod.settings.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    existingPeriod?.settings?.endDate ? new Date(existingPeriod.settings.endDate) : new Date()
  );
  
  // Configuración según contrato de trabajo - cargar datos existentes
  const [annualHours, setAnnualHours] = useState(existingPeriod?.settings?.annualHours || 1607);
  const [fullTimeEnabled, setFullTimeEnabled] = useState(existingPeriod?.settings?.fullTimeEnabled ?? true);
  const [partTimeEnabled, setPartTimeEnabled] = useState(existingPeriod?.settings?.partTimeEnabled ?? false);
  
  // Campos tiempo completo - cargar datos existentes
  const [fullTimeWeeklyLimit, setFullTimeWeeklyLimit] = useState(existingPeriod?.settings?.fullTimeWeeklyLimit || 42);
  const [fullTimeWeeklyLimitUnit, setFullTimeWeeklyLimitUnit] = useState(existingPeriod?.settings?.fullTimeWeeklyLimitUnit || "Horas");
  const [fullTimeWeeklyMinimum, setFullTimeWeeklyMinimum] = useState(existingPeriod?.settings?.fullTimeWeeklyMinimum || 40);
  const [fullTimeWeeklyMinimumUnit, setFullTimeWeeklyMinimumUnit] = useState(existingPeriod?.settings?.fullTimeWeeklyMinimumUnit || "Horas");
  
  // Campos tiempo parcial - cargar datos existentes
  const [partTimeWeeklyLimit, setPartTimeWeeklyLimit] = useState(existingPeriod?.settings?.partTimeWeeklyLimit || 30);
  const [partTimeWeeklyLimitUnit, setPartTimeWeeklyLimitUnit] = useState(existingPeriod?.settings?.partTimeWeeklyLimitUnit || "Horas");
  const [partTimeWeeklyMinimum, setPartTimeWeeklyMinimum] = useState(existingPeriod?.settings?.partTimeWeeklyMinimum || 20);
  const [partTimeWeeklyMinimumUnit, setPartTimeWeeklyMinimumUnit] = useState(existingPeriod?.settings?.partTimeWeeklyMinimumUnit || "Horas");

  // Estados para Equipo y empleados - cargar datos existentes
  const [selectedRotas, setSelectedRotas] = useState<string[]>(existingPeriod?.settings?.selectedRotas || []);
  const [employeeSettings, setEmployeeSettings] = useState<{[key: string]: { enabled: boolean, initialBalance: number, hoursToPerform: number, performanceDate: Date | undefined }}>(
    existingPeriod?.settings?.employeeSettings || {
      "CR7": { enabled: true, initialBalance: 0, hoursToPerform: 1607, performanceDate: new Date() },
      "Lionel Messi": { enabled: true, initialBalance: 0, hoursToPerform: 1607, performanceDate: new Date() },
      "Neymar Jr": { enabled: true, initialBalance: 0, hoursToPerform: 1607, performanceDate: new Date() }
    }
  );

  // Lista simulada de Rotas disponibles (definir primero)
  const availableRotas = [
    { id: "rota_cocina", name: "Rota Cocina" },
    { id: "rota_bares", name: "Rota Bares" },
    { id: "rota_general", name: "Rota General" }
  ];

  // Lista simulada de empleados con su Rota
  const allEmployees = [
    { id: "CR7", name: "CR7", planning: "rota_bares" },
    { id: "Lionel Messi", name: "Lionel Messi", planning: "rota_cocina" },
    { id: "Neymar Jr", name: "Neymar Jr", planning: "rota_general" },
    { id: "Sergio Ramos", name: "Sergio Ramos", planning: "rota_bares" },
    { id: "Luka Modric", name: "Luka Modric", planning: "rota_cocina" }
  ];

  // Pasos 52-54: Filtrar empleados según Rotas seleccionadas
  const getFilteredEmployees = () => {
    if (selectedRotas.length === 0) {
      return allEmployees;
    }
    
    // Si "Seleccionar todo" está seleccionado o todas las Rotas están seleccionadas
    if (selectedRotas.length === availableRotas.length) {
      return allEmployees;
    }
    
    // Filtrar por Rotas específicas seleccionadas
    return allEmployees.filter(emp => selectedRotas.includes(emp.planning));
  };

  const filteredEmployees = getFilteredEmployees();

  const handleRotaSelect = (rotaId: string) => {
    if (rotaId === "all") {
      if (selectedRotas.length === availableRotas.length) {
        setSelectedRotas([]);
      } else {
        setSelectedRotas(availableRotas.map(p => p.id));
      }
    } else {
      setSelectedRotas(prev => {
        if (prev.includes(rotaId)) {
          return prev.filter(id => id !== rotaId);
        } else {
          return [...prev, rotaId];
        }
      });
    }
  };

  // Paso 50: Función para remover Rota (paso clave para el flujo 50-54)
  const removeRota = (rotaId: string) => {
    setSelectedRotas(prev => prev.filter(id => id !== rotaId));
  };

  const updateEmployeeSetting = (employeeId: string, field: string, value: any) => {
    setEmployeeSettings(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  const handleCreatePeriod = () => {
    if (editMode && existingPeriod) {
      // Actualizar período existente
      const existingPeriods = JSON.parse(localStorage.getItem('gestion-jornada-periods') || '[]');
      const updatedPeriods = existingPeriods.map(p => 
        p.id === existingPeriod.id 
          ? {
              ...p,
              startDate: startDate ? format(startDate, "yyyy-MM-dd") : p.startDate,
              endDate: endDate ? format(endDate, "yyyy-MM-dd") : p.endDate,
              settings: {
                selectedRotas,
                employeeSettings,
                fullTimeEnabled,
                partTimeEnabled,
                annualHours,
                fullTimeWeeklyLimit,
                fullTimeWeeklyLimitUnit,
                fullTimeWeeklyMinimum,
                fullTimeWeeklyMinimumUnit,
                partTimeWeeklyLimit,
                partTimeWeeklyLimitUnit,
                partTimeWeeklyMinimum,
                partTimeWeeklyMinimumUnit,
                startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
                endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined
              }
            }
          : p
      );
      localStorage.setItem('gestion-jornada-periods', JSON.stringify(updatedPeriods));
      
      toast({
        title: "Período actualizado exitosamente",
        description: `Se ha actualizado el período de ${selectedType === 'workday_management' ? 'Gestión de Jornada Laboral' : 'Bolsa de Horas'}`,
      });
    } else {
      // Crear nuevo período
      const newPeriod = {
        id: Date.now().toString(),
        type: selectedType,
        name: selectedType === 'workday_management' ? 'Gestión de Jornada Laboral' : 'Bolsa de Horas',
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : "2025-01-01",
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : "2025-12-31",
        icon: selectedType === 'workday_management' ? 'Clock' : 'Building2',
        settings: {
          selectedRotas,
          employeeSettings,
          fullTimeEnabled,
          partTimeEnabled,
          annualHours,
          fullTimeWeeklyLimit,
          fullTimeWeeklyLimitUnit,
          fullTimeWeeklyMinimum,
          fullTimeWeeklyMinimumUnit,
          partTimeWeeklyLimit,
          partTimeWeeklyLimitUnit,
          partTimeWeeklyMinimum,
          partTimeWeeklyMinimumUnit,
          startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined
        }
      };

      const existingPeriods = JSON.parse(localStorage.getItem('gestion-jornada-periods') || '[]');
      const updatedPeriods = [...existingPeriods, newPeriod];
      localStorage.setItem('gestion-jornada-periods', JSON.stringify(updatedPeriods));

      toast({
        title: "Período creado exitosamente",
        description: `Se ha creado el período de ${selectedType === 'workday_management' ? 'Gestión de Jornada Laboral' : 'Bolsa de Horas'}`,
      });
    }
    
    // Navegar de vuelta
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleTypeSelect = (type: "workday_management" | "hours_bank") => {
    setSelectedType(type);
    setStep("configure");
  };

  const handleBack = () => {
    if (step === "configure") {
      setStep("select_type");
      setSelectedType(null);
    }
  };

  // Paso 4-5: Vista inicial con selección de tipo (no mostrar en modo edición)
  if (step === "select_type" && !editMode) {
    return (
      <div className="space-y-6 p-6">
        {/* Paso 4: Sección "¿Cómo se cuentan las horas?" */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-center">¿Cómo se cuentan las horas?</h3>
          
          {/* Paso 5: Las dos Cards son seleccionables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gestión de la Jornada Laboral */}
            <Card 
              className={`cursor-pointer border-2 transition-all duration-200 ${
                selectedType === 'workday_management' 
                  ? 'border-blue-500 bg-blue-50/80 shadow-md ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
              onClick={() => handleTypeSelect("workday_management")}
            >
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Clock className="h-12 w-12 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold mb-2 text-blue-700">
                  Gestión de la Jornada Laboral
                </h4>
                <p className="text-sm text-muted-foreground">
                  Control tradicional de horarios con límites semanales y períodos de referencia
                </p>
              </CardContent>
            </Card>

            {/* Bolsa de Horas */}
            <Card 
              className={`cursor-pointer border-2 transition-all duration-200 ${
                selectedType === 'hours_bank' 
                  ? 'border-orange-500 bg-orange-50/80 shadow-md ring-2 ring-orange-200' 
                  : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
              }`}
              onClick={() => handleTypeSelect("hours_bank")}
            >
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <Building2 className="h-12 w-12 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold mb-2 text-orange-700">
                  Bolsa de Horas
                </h4>
                <p className="text-sm text-muted-foreground">
                  Sistema flexible de acumulación y compensación de horas trabajadas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Pasos 6-20: Configuración de Gestión de Jornada Laboral
  if (step === "configure" && selectedType === "workday_management") {
    const hasValidationError = !fullTimeEnabled && !partTimeEnabled;

    return (
      <div className="space-y-6 p-6">
        {/* Paso 57: En modo edición, mostrar que la sección está deshabilitada */}
        {editMode && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              En modo edición, la sección "¿Cómo se cuentan las horas?" está deshabilitada. Solo puedes modificar otros parámetros.
            </AlertDescription>
          </Alert>
        )}

        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={editMode ? onClose : handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-xl font-semibold">
              {editMode ? 'Editar' : 'Crear'} Gestión de la Jornada Laboral
            </h3>
            <p className="text-muted-foreground">
              {editMode ? 'Modifica los parámetros' : 'Configure los parámetros'} para la gestión de horarios de trabajo
            </p>
          </div>
        </div>

        {/* Paso 12: Mensaje de error de validación */}
        {hasValidationError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              Debe activar al menos un tipo de contrato de trabajo
            </AlertDescription>
          </Alert>
        )}

        {/* Paso 6-8: Período de referencia con calendarios especiales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              Período de referencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Paso 7-8: Calendario doble especial con navegación de año/mes */}
            <EnhancedDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </CardContent>
        </Card>

        {/* Paso 9-20: Configuración según el contrato de trabajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Configuración según el contrato de trabajo
              {/* Paso 9: Tooltip exacto */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure las horas de trabajo según el tipo de contrato laboral</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Paso 10: Campo horas anuales (1607 por defecto) */}
            <div className="space-y-2">
              <Label htmlFor="annual-hours" className="flex items-center gap-2">
                Horas a trabajar a lo largo del año
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total de horas que debe trabajar el empleado durante el año laboral según su contrato</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="annual-hours"
                type="number"
                value={annualHours}
                onChange={(e) => setAnnualHours(Number(e.target.value))}
                className="max-w-xs"
                placeholder="1607"
              />
            </div>

            {/* Paso 11-20: Sección A tiempo completo */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium">A tiempo completo</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Activar configuración para empleados con contrato de tiempo completo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {/* Paso 11: Toggle para A tiempo completo */}
                <Switch
                  checked={fullTimeEnabled}
                  onCheckedChange={setFullTimeEnabled}
                />
              </div>

              {/* Paso 14-20: Campos cuando está activado A tiempo completo */}
              {fullTimeEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Paso 15-17: Límite semanal editable con dropdown */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Límite semanal
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Máximo de horas semanales para contratos a tiempo completo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={fullTimeWeeklyLimit}
                          onChange={(e) => setFullTimeWeeklyLimit(Number(e.target.value))}
                          className="flex-1"
                          placeholder="42"
                        />
                        {/* Paso 16-17: Dropdown con Horas y Porcentaje */}
                        <Select value={fullTimeWeeklyLimitUnit} onValueChange={setFullTimeWeeklyLimitUnit}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Horas">H</SelectItem>
                            <SelectItem value="Porcentaje">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Paso 18-20: Mínimo semanal editable con dropdown */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Mínimo semanal
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mínimo de horas semanales para contratos a tiempo completo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={fullTimeWeeklyMinimum}
                          onChange={(e) => setFullTimeWeeklyMinimum(Number(e.target.value))}
                          className="flex-1"
                          placeholder="40"
                        />
                        {/* Paso 19-20: Dropdown con Horas y Porcentaje */}
                        <Select value={fullTimeWeeklyMinimumUnit} onValueChange={setFullTimeWeeklyMinimumUnit}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Horas">H</SelectItem>
                            <SelectItem value="Porcentaje">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Paso 21 en adelante: Sección A tiempo parcial (será implementada en siguiente iteración) */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">A tiempo parcial</Label>
                <Switch
                  checked={partTimeEnabled}
                  onCheckedChange={setPartTimeEnabled}
                />
              </div>

              {partTimeEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-orange-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Límite semanal</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={partTimeWeeklyLimit}
                          onChange={(e) => setPartTimeWeeklyLimit(Number(e.target.value))}
                          className="flex-1"
                          placeholder="30"
                        />
                        <Select value={partTimeWeeklyLimitUnit} onValueChange={setPartTimeWeeklyLimitUnit}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Horas">H</SelectItem>
                            <SelectItem value="Porcentaje">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mínimo semanal</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={partTimeWeeklyMinimum}
                          onChange={(e) => setPartTimeWeeklyMinimum(Number(e.target.value))}
                          className="flex-1"
                          placeholder="20"
                        />
                        <Select value={partTimeWeeklyMinimumUnit} onValueChange={setPartTimeWeeklyMinimumUnit}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Horas">H</SelectItem>
                            <SelectItem value="Porcentaje">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pasos 31-40: Sección Equipo y empleados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Equipo y empleados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Paso 32-33: Selector de Rotas */}
            <div className="space-y-3">
              <Label>Seleccionar Rotas</Label>
              <Select
                onValueChange={handleRotaSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar Rotas..." />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="all">
                    Seleccionar todo
                  </SelectItem>
                  {availableRotas.map((rota) => (
                    <SelectItem key={rota.id} value={rota.id}>
                      {rota.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Paso 34: Etiquetas de Rotas seleccionadas */}
              {selectedRotas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedRotas.map((rotaId) => {
                    const rota = availableRotas.find(p => p.id === rotaId);
                    return (
                      <Badge key={rotaId} variant="secondary" className="flex items-center gap-1">
                        {rota?.name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-500" 
                          onClick={() => removeRota(rotaId)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paso 34-40: Lista de empleados cuando hay Rotas seleccionadas */}
            {selectedRotas.length > 0 && (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  {/* Header de la tabla con tooltips */}
                  <div className="bg-gray-50 border-b px-4 py-3">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Empleado
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Haga clic en el nombre para ver el perfil del empleado</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-1">
                        Personalización
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Habilitar personalización de gestión de jornada laboral</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-1">
                        Saldo inicial
                        <HelpTooltip content="Saldo de horas inicial para el período de gestión" />
                      </div>
                      <div className="flex items-center gap-1">
                        Horas por realizar
                        <HelpTooltip content="Número de horas que debe completar el empleado en el período" />
                      </div>
                      <div className="flex items-center gap-1">
                        Fecha de rendimiento
                        <HelpTooltip content="Fecha límite para completar las horas establecidas" />
                      </div>
                    </div>
                  </div>

                   {/* Pasos 52-54: Filas de empleados filtrados */}
                   <div className="divide-y">
                     {filteredEmployees.map((employee) => {
                       const settings = employeeSettings[employee.id] || { enabled: true, initialBalance: 0, hoursToPerform: 1607, performanceDate: new Date() };
                       return (
                       <div key={employee.id} className="px-4 py-3">
                         <div className="grid grid-cols-6 gap-4 items-center">
                            {/* Paso 35: Nombre del empleado clickeable con hover card */}
                            <div>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <span 
                                    className="font-medium text-primary hover:underline cursor-pointer text-sm"
                                    onClick={() => window.open('/colaboradores', '_blank')}
                                  >
                                    {employee.name}
                                  </span>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <div className="flex justify-between space-x-4">
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-semibold">{employee.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Haz clic para ver el perfil completo del empleado
                                      </p>
                                    </div>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </div>

                           {/* Paso 36-37: Toggle de personalización */}
                           <div>
                             <Switch
                               checked={settings.enabled}
                               onCheckedChange={(checked) => updateEmployeeSetting(employee.id, 'enabled', checked)}
                             />
                           </div>

                           {/* Paso 38: Saldo inicial editable */}
                           <div>
                             <Input
                               type="number"
                               value={settings.initialBalance}
                               onChange={(e) => updateEmployeeSetting(employee.id, 'initialBalance', Number(e.target.value))}
                               className="text-sm"
                               disabled={!settings.enabled}
                             />
                           </div>

                           {/* Paso 39: Horas por realizar editable */}
                           <div>
                             <Input
                               type="number"
                               value={settings.hoursToPerform}
                               onChange={(e) => updateEmployeeSetting(employee.id, 'hoursToPerform', Number(e.target.value))}
                               className="text-sm"
                               disabled={!settings.enabled}
                             />
                           </div>

                           {/* Paso 40-44: Fecha de rendimiento con calendario especial */}
                           <div>
                             <Popover>
                               <PopoverTrigger asChild>
                                 <Button
                                   variant="outline"
                                   className={cn(
                                     "text-sm h-9 justify-start text-left font-normal",
                                     !settings.performanceDate && "text-muted-foreground",
                                     !settings.enabled && "opacity-50 cursor-not-allowed"
                                   )}
                                   disabled={!settings.enabled}
                                 >
                                   <CalendarIcon className="mr-2 h-3 w-3" />
                                   {settings.performanceDate ? format(settings.performanceDate, "PPP", { locale: es }) : "Seleccionar"}
                                 </Button>
                               </PopoverTrigger>
                               <PopoverContent className="w-auto p-0" align="start">
                                 <Calendar
                                   mode="single"
                                   selected={settings.performanceDate}
                                   onSelect={(date) => updateEmployeeSetting(employee.id, 'performanceDate', date)}
                                   initialFocus
                                   captionLayout="dropdown-buttons"
                                   fromYear={2020}
                                   toYear={2030}
                                   className="pointer-events-auto"
                                 />
                               </PopoverContent>
                             </Popover>
                           </div>
                         </div>
                       </div>
                     )})}
                   </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            disabled={hasValidationError}
            onClick={handleCreatePeriod}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {editMode ? 'Guardar cambios' : 'Crear período'}
          </Button>
        </div>
      </div>
    );
  }

  // Pasos 64-75: Configuración de Bolsa de Horas
  if (step === "configure" && selectedType === "hours_bank") {
    const hasValidationError = !fullTimeEnabled && !partTimeEnabled;

    return (
      <div className="space-y-6 p-6">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-xl font-semibold">Bolsa de Horas</h3>
            <p className="text-muted-foreground">
              Configure el sistema de acumulación y compensación de horas
            </p>
          </div>
        </div>

        {/* Mensaje de error de validación */}
        {hasValidationError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              Debe activar al menos un tipo de contrato de trabajo
            </AlertDescription>
          </Alert>
        )}

        {/* Período de referencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-orange-600" />
              Período de referencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Calendario doble especial con navegación de año/mes para Bolsa de Horas */}
            <EnhancedDateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </CardContent>
        </Card>

        {/* Configuración según el contrato de trabajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Configuración según el contrato de trabajo
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure las horas de trabajo según el tipo de contrato laboral</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campo horas anuales */}
            <div className="space-y-2">
              <Label htmlFor="annual-hours" className="flex items-center gap-2">
                Horas a trabajar a lo largo del año
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total de horas que debe trabajar el empleado durante el año laboral según su contrato</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="annual-hours"
                type="number"
                value={annualHours}
                onChange={(e) => setAnnualHours(Number(e.target.value))}
                className="max-w-xs"
                placeholder="1607"
              />
            </div>

            {/* Sección A tiempo completo */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium">A tiempo completo</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Activar configuración para empleados con contrato de tiempo completo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  checked={fullTimeEnabled}
                  onCheckedChange={setFullTimeEnabled}
                />
              </div>

              {fullTimeEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-orange-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Límite semanal
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Máximo de horas semanales para contratos a tiempo completo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={fullTimeWeeklyLimit}
                          onChange={(e) => setFullTimeWeeklyLimit(Number(e.target.value))}
                          className="flex-1"
                          placeholder="42"
                        />
                        <Select value={fullTimeWeeklyLimitUnit} onValueChange={setFullTimeWeeklyLimitUnit}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="Horas">H</SelectItem>
                            <SelectItem value="Porcentaje">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Mínimo semanal
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mínimo de horas semanales para contratos a tiempo completo</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={fullTimeWeeklyMinimum}
                          onChange={(e) => setFullTimeWeeklyMinimum(Number(e.target.value))}
                          className="flex-1"
                          placeholder="40"
                        />
                        <Select value={fullTimeWeeklyMinimumUnit} onValueChange={setFullTimeWeeklyMinimumUnit}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="Horas">H</SelectItem>
                            <SelectItem value="Porcentaje">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sección A tiempo parcial */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">A tiempo parcial</Label>
                <Switch
                  checked={partTimeEnabled}
                  onCheckedChange={setPartTimeEnabled}
                />
              </div>

              {partTimeEnabled && (
                <div className="space-y-4 pl-4 border-l-2 border-orange-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Límite semanal</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={partTimeWeeklyLimit}
                          onChange={(e) => setPartTimeWeeklyLimit(Number(e.target.value))}
                          className="flex-1"
                          placeholder="30"
                        />
                        <Select value={partTimeWeeklyLimitUnit} onValueChange={setPartTimeWeeklyLimitUnit}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="Horas">H</SelectItem>
                            <SelectItem value="Porcentaje">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mínimo semanal</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={partTimeWeeklyMinimum}
                          onChange={(e) => setPartTimeWeeklyMinimum(Number(e.target.value))}
                          className="flex-1"
                          placeholder="20"
                        />
                        <Select value={partTimeWeeklyMinimumUnit} onValueChange={setPartTimeWeeklyMinimumUnit}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            <SelectItem value="Horas">H</SelectItem>
                            <SelectItem value="Porcentaje">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección Equipo y empleados para Bolsa de Horas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Equipo y empleados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Seleccionar Rotas</Label>
              <Select onValueChange={handleRotaSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar Rotas..." />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="all">Seleccionar todo</SelectItem>
                  {availableRotas.map((rota) => (
                    <SelectItem key={rota.id} value={rota.id}>
                      {rota.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedRotas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedRotas.map((rotaId) => {
                    const rota = availableRotas.find(p => p.id === rotaId);
                    return (
                      <Badge key={rotaId} variant="secondary" className="flex items-center gap-1">
                        {rota?.name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-500" 
                          onClick={() => removeRota(rotaId)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedRotas.length > 0 && (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b px-4 py-3">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-1">
                        Empleado
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Haga clic en el nombre para ver el perfil del empleado</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-1">
                        Personalización
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Habilitar personalización de gestión de jornada laboral</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-1">
                        Saldo inicial
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Saldo inicial de horas para el período</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-1">
                        Horas por realizar
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Total de horas a trabajar en el período</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center gap-1">
                        Fecha de rendimiento
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Fecha límite para completar las horas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y">
                    {Object.entries(employeeSettings).map(([employeeId, settings]) => (
                      <div key={employeeId} className="px-4 py-3">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          <div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => navigate(`/equipo/${employeeId}`)}
                                    className="text-orange-600 hover:text-orange-800 hover:underline text-sm font-medium"
                                  >
                                    {employeeId}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ir al perfil de {employeeId}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div>
                            <Switch
                              checked={settings.enabled}
                              onCheckedChange={(checked) => updateEmployeeSetting(employeeId, 'enabled', checked)}
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={settings.initialBalance}
                              onChange={(e) => updateEmployeeSetting(employeeId, 'initialBalance', Number(e.target.value))}
                              className="text-sm"
                              disabled={!settings.enabled}
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={settings.hoursToPerform}
                              onChange={(e) => updateEmployeeSetting(employeeId, 'hoursToPerform', Number(e.target.value))}
                              className="text-sm"
                              disabled={!settings.enabled}
                            />
                          </div>
                          <div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "text-sm h-9 justify-start text-left font-normal",
                                    !settings.performanceDate && "text-muted-foreground",
                                    !settings.enabled && "opacity-50 cursor-not-allowed"
                                  )}
                                  disabled={!settings.enabled}
                                >
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {settings.performanceDate ? format(settings.performanceDate, "PPP", { locale: es }) : "Seleccionar"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={settings.performanceDate}
                                  onSelect={(date) => updateEmployeeSetting(employeeId, 'performanceDate', date)}
                                  initialFocus
                                  captionLayout="dropdown-buttons"
                                  fromYear={2020}
                                  toYear={2030}
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            disabled={hasValidationError}
            onClick={handleCreatePeriod}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Crear período
          </Button>
        </div>
      </div>
    );
  }

  return null;
};