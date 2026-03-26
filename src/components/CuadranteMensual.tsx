import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { 
  Calendar, 
  Users, 
  Download, 
  Upload, 
  Settings,
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import { 
  CuadranteMensual as CuadranteMensualType, 
  CuadranteEmployee, 
  DayOccupancy,
  CONTRACT_TYPES,
  STATUS_CODES,
  WEEKDAYS,
  MAX_EMPLOYEES_PER_CONTRACT 
} from "@/types/cuadrante";
import { StatusCell } from "@/components/ui/status-cell";
import { CuadranteStats } from "@/components/CuadranteStats";
import { cn } from "@/lib/utils";

interface CuadranteMensualProps {
  cuadrante?: CuadranteMensualType;
  onSave?: (cuadrante: CuadranteMensualType) => void;
  onCancel?: () => void;
}

export function CuadranteMensual({ cuadrante, onSave, onCancel }: CuadranteMensualProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week1' | 'week2' | 'week3' | 'week4'>('month');
  const [showOccupancy, setShowOccupancy] = useState(true);
  const [selectedContractFilter, setSelectedContractFilter] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ employeeId: string; day: number } | null>(null);
  
  // Configuración obligatoria del cuadrante
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return cuadrante?.month || new Date().getMonth() + 1;
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return cuadrante?.year || new Date().getFullYear();
  });
  
  // Estado inicial del cuadrante
  const [currentCuadrante, setCurrentCuadrante] = useState<CuadranteMensualType>(() => {
    if (cuadrante) return cuadrante;
    
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    return {
      id: `cuadrante-${Date.now()}`,
      name: `Cuadrante ${selectedMonth}/${selectedYear}`,
      month: selectedMonth,
      year: selectedYear,
      daysInMonth,
      employees: [],
      occupancy: Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        occupancyPercentage: 0,
        isManual: false
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'DRAFT'
    };
  });

  const getDayOfWeek = (day: number) => {
    const date = new Date(currentCuadrante.year, currentCuadrante.month - 1, day);
    return WEEKDAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  };

  const getVisibleDays = useCallback(() => {
    const { daysInMonth } = currentCuadrante;
    
    switch (viewMode) {
      case 'week1': return Array.from({ length: 7 }, (_, i) => i + 1).filter(d => d <= daysInMonth);
      case 'week2': return Array.from({ length: 7 }, (_, i) => i + 8).filter(d => d <= daysInMonth);
      case 'week3': return Array.from({ length: 7 }, (_, i) => i + 15).filter(d => d <= daysInMonth);
      case 'week4': return Array.from({ length: Math.max(7, daysInMonth - 21) }, (_, i) => i + 22).filter(d => d <= daysInMonth);
      default: return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }
  }, [viewMode, currentCuadrante.daysInMonth]);

  const handleEmployeeScheduleChange = (employeeId: string, day: number, code: string) => {
    setCurrentCuadrante(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.id === employeeId 
          ? { ...emp, schedule: { ...emp.schedule, [day]: code } }
          : emp
      ),
      updatedAt: new Date()
    }));
    setEditingCell(null);
  };

  const handleOccupancyChange = (day: number, percentage: number) => {
    setCurrentCuadrante(prev => ({
      ...prev,
      occupancy: prev.occupancy.map(occ => 
        occ.day === day 
          ? { ...occ, occupancyPercentage: percentage, isManual: true }
          : occ
      ),
      updatedAt: new Date()
    }));
  };

  const addEmployeeSection = (contractHours: number) => {
    const contractType = CONTRACT_TYPES.find(ct => ct.hours === contractHours);
    if (!contractType) return;

    const newEmployees: CuadranteEmployee[] = Array.from({ length: MAX_EMPLOYEES_PER_CONTRACT }, (_, i) => ({
      id: `emp-${contractHours}h-${i}-${Date.now()}`,
      name: '',
      surname: '',
      category: '',
      contractHours,
      contractType: 'INDEFINIDO',
      contractUnits: contractType.units,
      department: 'PROPIO',
      position: i,
      schedule: {}
    }));

    setCurrentCuadrante(prev => ({
      ...prev,
      employees: [...prev.employees, ...newEmployees],
      updatedAt: new Date()
    }));
  };

  const getEmployeesByContract = (contractHours: number) => {
    return currentCuadrante.employees.filter(emp => emp.contractHours === contractHours);
  };

  // Función para importar datos del Turno Público
  const handleImportFromTurnoPublico = () => {
    // Datos completos del Turno Público basados en las imágenes proporcionadas
    const turnoPublicoData = [
      // EMPLEADOS DE 8 HORAS
      { name: 'ANTONIO', surname: 'RAHIM', category: 'JEFE BARES', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'JOSE', surname: 'GARCIA', category: '2º JEFE BARES', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'MARCOS', surname: 'TOLEDO', category: 'JEFE DE SECTOR', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'ANDRES', surname: 'PEREZ', category: 'JEFE DE SECTOR', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'CARMEN', surname: 'MARTINEZ', category: 'CAMARERO/A', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'MIGUEL', surname: 'LOPEZ', category: 'CAMARERO/A', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'ANA', surname: 'RODRIGUEZ', category: 'CAMARERO/A', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'LUIS', surname: 'MARTIN', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'MARIA', surname: 'GONZALEZ', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'PEDRO', surname: 'FERNANDEZ', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'LAURA', surname: 'SANCHEZ', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'DAVID', surname: 'RUIZ', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'SARA', surname: 'MORENO', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'CARLOS', surname: 'JIMENEZ', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'ELENA', surname: 'ALVAREZ', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'JAVIER', surname: 'TORRES', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'CRISTINA', surname: 'VARGAS', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'FRANCISCO', surname: 'HERRERA', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'PATRICIA', surname: 'MOLINA', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'ANTONIO', surname: 'CASTRO', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'MINERVA', surname: 'ARIAS', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'ROGELIO', surname: 'PEREZ', category: 'AYUDANTE', contractHours: 8, department: 'PROPIO', contractType: 'INDEFINIDO' },

      // EMPLEADOS DE 6 HORAS
      { name: 'GEILER', surname: 'CRUZ', category: 'CAMARERO/A', contractHours: 6, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'MARIA', surname: 'LOPEZ', category: 'CAMARERO/A', contractHours: 6, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'JUAN', surname: 'GARCIA', category: 'AYUDANTE', contractHours: 6, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'ROSA', surname: 'MARTIN', category: 'AYUDANTE', contractHours: 6, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'PABLO', surname: 'RODRIGUEZ', category: 'AYUDANTE', contractHours: 6, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'CARMEN', surname: 'FERNANDEZ', category: 'AYUDANTE', contractHours: 6, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'DIEGO', surname: 'MORALES', category: 'AYUDANTE', contractHours: 6, department: 'PROPIO', contractType: 'INDEFINIDO' },
      { name: 'LUCIA', surname: 'SANTOS', category: 'AYUDANTE', contractHours: 6, department: 'PROPIO', contractType: 'INDEFINIDO' },

      // EMPLEADOS DE 5 HORAS
      { name: 'ROSAURA', surname: 'BORDON', category: 'AYUDANTE', contractHours: 5, department: 'PROPIO', contractType: 'TEMPORAL' },
      { name: 'MANUEL', surname: 'VEGA', category: 'AYUDANTE', contractHours: 5, department: 'PROPIO', contractType: 'TEMPORAL' },
      { name: 'SOFIA', surname: 'RAMOS', category: 'AYUDANTE', contractHours: 5, department: 'PROPIO', contractType: 'TEMPORAL' },
      { name: 'ALBERTO', surname: 'IGLESIAS', category: 'AYUDANTE', contractHours: 5, department: 'PROPIO', contractType: 'TEMPORAL' },
      { name: 'PATRICIA', surname: 'DIAZ', category: 'AYUDANTE', contractHours: 5, department: 'PROPIO', contractType: 'TEMPORAL' },
      { name: 'RAUL', surname: 'GUTIERREZ', category: 'AYUDANTE', contractHours: 5, department: 'PROPIO', contractType: 'TEMPORAL' },

      // EMPLEADOS DE 4 HORAS
      { name: 'CAROLINE', surname: 'GIL', category: 'AYUDANTE', contractHours: 4, department: 'PROPIO', contractType: 'TEMPORAL' },
      { name: 'RICARDO', surname: 'NAVARRO', category: 'AYUDANTE', contractHours: 4, department: 'PROPIO', contractType: 'TEMPORAL' },
      { name: 'BEATRIZ', surname: 'ORTEGA', category: 'AYUDANTE', contractHours: 4, department: 'PROPIO', contractType: 'TEMPORAL' },
      { name: 'FERNANDO', surname: 'PEÑA', category: 'AYUDANTE', contractHours: 4, department: 'PROPIO', contractType: 'TEMPORAL' },
      { name: 'MONICA', surname: 'SILVA', category: 'AYUDANTE', contractHours: 4, department: 'PROPIO', contractType: 'TEMPORAL' },

      // EMPLEADOS ETT DE 8 HORAS
      { name: 'CARLOS', surname: 'MENDEZ', category: 'AYUDANTE', contractHours: 8, department: 'ETT', contractType: 'TEMPORAL' },
      { name: 'SILVIA', surname: 'CAMPOS', category: 'AYUDANTE', contractHours: 8, department: 'ETT', contractType: 'TEMPORAL' },
      { name: 'JORGE', surname: 'CRESPO', category: 'AYUDANTE', contractHours: 8, department: 'ETT', contractType: 'TEMPORAL' },
      { name: 'NATALIA', surname: 'PRIETO', category: 'AYUDANTE', contractHours: 8, department: 'ETT', contractType: 'TEMPORAL' },

      // EMPLEADOS ETT DE 6 HORAS
      { name: 'PABLO', surname: 'SOTO', category: 'AYUDANTE', contractHours: 6, department: 'ETT', contractType: 'TEMPORAL' },
      { name: 'VIRGINIA', surname: 'DELGADO', category: 'AYUDANTE', contractHours: 6, department: 'ETT', contractType: 'TEMPORAL' },

      // EMPLEADOS ETT DE 4 HORAS
      { name: 'RAQUEL', surname: 'AGUILAR', category: 'AYUDANTE', contractHours: 4, department: 'ETT', contractType: 'TEMPORAL' },
      { name: 'VICTOR', surname: 'BLANCO', category: 'AYUDANTE', contractHours: 4, department: 'ETT', contractType: 'TEMPORAL' }
    ];

    // Organizar empleados por contrato y posición
    const organizedEmployees: CuadranteEmployee[] = [];
    
    // Agrupar por horas de contrato y departamento
    const groupedByContract = turnoPublicoData.reduce((acc, employee) => {
      const key = `${employee.contractHours}-${employee.department}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(employee);
      return acc;
    }, {} as Record<string, typeof turnoPublicoData>);

    // Crear empleados organizados
    Object.entries(groupedByContract).forEach(([key, employees]) => {
      employees.forEach((employee, index) => {
        const contractTypeObj = CONTRACT_TYPES.find(ct => ct.hours === employee.contractHours);
        if (contractTypeObj) {
          organizedEmployees.push({
            id: `imported-${employee.contractHours}h-${employee.department}-${index}-${Date.now()}`,
            name: employee.name,
            surname: employee.surname,
            category: employee.category,
            contractHours: employee.contractHours,
            contractType: employee.contractType as 'INDEFINIDO' | 'TEMPORAL' | 'FORMACION_ALTERNANCIA' | 'PRACTICAS',
            contractUnits: contractTypeObj.units,
            department: employee.department as 'PROPIO' | 'ETT',
            position: index,
            schedule: {}
          });
        }
      });
    });

    setCurrentCuadrante(prev => ({
      ...prev,
      employees: organizedEmployees,
      updatedAt: new Date()
    }));

    toast({
      title: "Datos importados correctamente",
      description: `Se han importado ${organizedEmployees.length} empleados del Turno Público organizados por secciones`,
    });
  };

  // Función para actualizar configuración del cuadrante
  const handleUpdateCuadranteConfig = () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Error",
        description: "Mes y año son obligatorios",
        variant: "destructive"
      });
      return;
    }

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    setCurrentCuadrante(prev => ({
      ...prev,
      name: `Cuadrante ${selectedMonth}/${selectedYear}`,
      month: selectedMonth,
      year: selectedYear,
      daysInMonth,
      occupancy: Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        occupancyPercentage: prev.occupancy[i]?.occupancyPercentage || 0,
        isManual: prev.occupancy[i]?.isManual || false
      })),
      updatedAt: new Date()
    }));
  };

  // Función para guardar el cuadrante
  const handleSaveCuadrante = () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Error",
        description: "Mes y año son obligatorios para generar el cuadrante",
        variant: "destructive"
      });
      return;
    }

    // Si no se ha seleccionado una semana específica, generar el mes completo
    const finalViewMode = viewMode === 'month' ? 'month' : viewMode;
    
    const finalCuadrante = {
      ...currentCuadrante,
      month: selectedMonth,
      year: selectedYear,
      name: `Cuadrante ${selectedMonth}/${selectedYear}${finalViewMode !== 'month' ? ` - ${finalViewMode}` : ''}`,
      status: 'PUBLISHED' as const,
      updatedAt: new Date()
    };

    onSave?.(finalCuadrante);
    
    toast({
      title: "Horario guardado",
      description: `Horario ${selectedMonth}/${selectedYear} generado correctamente`,
    });
  };

  const visibleDays = getVisibleDays();

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Configuración del Cuadrante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="month">Mes *</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Año *</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleUpdateCuadranteConfig} variant="outline">
              Actualizar Configuración
            </Button>
            
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">* Campos obligatorios</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {currentCuadrante.name}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{currentCuadrante.month}/{currentCuadrante.year}</span>
                <Badge variant="outline">{currentCuadrante.status}</Badge>
                <span>{currentCuadrante.employees.filter(e => e.name).length} empleados</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOccupancy(!showOccupancy)}
              >
                {showOccupancy ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Ocupación
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleImportFromTurnoPublico}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar Turno Público
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* View Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Mes Completo
              </Button>
              <Button
                variant={viewMode === 'week1' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week1')}
              >
                Semana 1
              </Button>
              <Button
                variant={viewMode === 'week2' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week2')}
              >
                Semana 2
              </Button>
              <Button
                variant={viewMode === 'week3' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week3')}
              >
                Semana 3
              </Button>
              <Button
                variant={viewMode === 'week4' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week4')}
              >
                Semana 4+
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtrar por contrato:</span>
              <select
                value={selectedContractFilter || ''}
                onChange={(e) => setSelectedContractFilter(e.target.value ? Number(e.target.value) : null)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="">Todos</option>
                {CONTRACT_TYPES.map(ct => (
                  <option key={ct.hours} value={ct.hours}>{ct.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="space-y-8">
        {CONTRACT_TYPES
          .filter(ct => !selectedContractFilter || ct.hours === selectedContractFilter)
          .map(contractType => {
            const employees = getEmployeesByContract(contractType.hours);
            const hasEmployees = employees.some(emp => emp.name.trim());
            
            return (
              <Card key={contractType.hours} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{contractType.label}</CardTitle>
                      <Badge variant="secondary">{contractType.units} Unidades</Badge>
                      <Badge variant="outline">
                        {employees.filter(e => e.name.trim()).length}/{MAX_EMPLOYEES_PER_CONTRACT}
                      </Badge>
                    </div>
                    {!hasEmployees && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addEmployeeSection(contractType.hours)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir Sección
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                {hasEmployees && (
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <div className="min-w-max">
                        {/* Calendar Header */}
                        <div className="bg-muted/30 border-b">
                          <div className="flex">
                            <div className="w-48 p-3 border-r font-medium">Empleado</div>
                            {visibleDays.map(day => (
                              <div key={day} className="w-12 border-r">
                                <div className="text-center p-1">
                                  <div className="text-xs font-medium">{getDayOfWeek(day)}</div>
                                  <div className="text-sm font-bold">{day}</div>
                                  {showOccupancy && (
                                    <Input
                                      type="number"
                                      min="0"
                                      max="200"
                                      value={currentCuadrante.occupancy[day - 1]?.occupancyPercentage || 0}
                                      onChange={(e) => handleOccupancyChange(day, Number(e.target.value))}
                                      className="h-6 text-xs text-center mt-1 p-0 border-0 bg-transparent"
                                      placeholder="0%"
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Employee Rows */}
                        <div className="divide-y">
                          {employees.map(employee => (
                            <div key={employee.id} className="flex hover:bg-muted/20">
                              <div className="w-48 p-2 border-r flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {employee.name || 'Empleado sin asignar'}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {employee.category}
                                  </div>
                                </div>
                              </div>
                              {visibleDays.map(day => (
                                <div key={day} className="w-12 border-r p-1 flex items-center justify-center">
                                  {editingCell?.employeeId === employee.id && editingCell?.day === day ? (
                                    <Input
                                      value={employee.schedule[day] || ''}
                                      onChange={(e) => handleEmployeeScheduleChange(employee.id, day, e.target.value.toUpperCase())}
                                      onBlur={() => setEditingCell(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') setEditingCell(null);
                                      }}
                                      className="w-8 h-8 text-xs text-center p-0"
                                      maxLength={2}
                                      autoFocus
                                    />
                                   ) : (
                                     <div 
                                       className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-muted/50 rounded border-2 border-dashed border-transparent hover:border-primary/30 transition-all"
                                       onClick={() => setEditingCell({ employeeId: employee.id, day })}
                                       title="Haz clic para editar"
                                     >
                                       <StatusCell
                                         status={employee.schedule[day] || ''}
                                         className="pointer-events-none"
                                       />
                                     </div>
                                   )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
      </div>

      {/* Estadísticas del Cuadrante */}
      <CuadranteStats cuadrante={currentCuadrante} />

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leyenda de Códigos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {STATUS_CODES.map(status => (
              <div key={status.code} className="flex items-center gap-2">
                <StatusCell status={status.code} className="w-6 h-6 text-xs" />
                <span className="text-sm">{status.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSaveCuadrante}>
          Guardar Cuadrante
        </Button>
      </div>
    </div>
  );
}