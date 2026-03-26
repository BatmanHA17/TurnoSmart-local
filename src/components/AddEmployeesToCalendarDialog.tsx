import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, ChevronDown, Search, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getEmployees } from "@/services/database";

interface Employee {
  id: string;
  name: string;
  category: string;
  contract_hours: number;
  contract_unit: number;
  department: string;
  employee_type: 'propio' | 'ett';
  employee_number: number | null;
  created_at: string;
  updated_at: string;
}

interface AddEmployeesToCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeesAdded: (employees: Employee[], effectiveDate?: Date, applyRestDays?: boolean) => void;
  existingEmployeeIds?: string[];
}

export function AddEmployeesToCalendarDialog({
  open,
  onOpenChange,
  onEmployeesAdded,
  existingEmployeeIds = []
}: AddEmployeesToCalendarDialogProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<Date>();
  const [applyRestDays, setApplyRestDays] = useState(false);
  const [restDaysPerWeek, setRestDaysPerWeek] = useState("2");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("current-employees");
  
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAllEmployees();
    }
  }, [open]);

  const loadAllEmployees = async () => {
    setLoading(true);
    try {
      const employees = await getEmployees();
      setAllEmployees(employees);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = allEmployees.filter(employee => {
    // Filter by search term
    if (searchTerm && !employee.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by selected filter type
    if (selectedFilter === "current-employees") {
      return !existingEmployeeIds.includes(employee.id);
    }
    
    return true;
  });

  const handleEmployeeToggle = (employee: Employee, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employee]);
    } else {
      setSelectedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
    }
  };

  const handleSelectAll = () => {
    setSelectedEmployees([...filteredEmployees]);
  };

  const handleDeselectAll = () => {
    setSelectedEmployees([]);
  };

  const handleAddEmployees = () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un empleado",
        variant: "destructive",
      });
      return;
    }

    // Llamar la función con información adicional sobre fechas de inicio
    onEmployeesAdded(selectedEmployees, effectiveDate, applyRestDays);
    
    // Reset form
    setSelectedEmployees([]);
    setEffectiveDate(undefined);
    setApplyRestDays(false);
    setRestDaysPerWeek("2");
    setSearchTerm("");
    onOpenChange(false);

    toast({
      title: "Empleados añadidos",
      description: `Se han añadido ${selectedEmployees.length} empleado(s) al calendario`,
    });
  };

  const getFilterLabel = () => {
    switch (selectedFilter) {
      case "current-employees":
        return "Empleados/as actuales";
      case "workplace":
        return "Gotham (lm)";
      case "team":
        return "Equipo Rte";
      default:
        return "Empleados";
    }
  };

  const isEmployeeSelected = (employee: Employee) => {
    return selectedEmployees.some(emp => emp.id === employee.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="space-y-4">
          {/* Title */}
          <h2 className="text-lg font-semibold">Añadir empleados</h2>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground">
            Selecciona a las personas a las que quieras asignar la aplicación de Gestión de Horarios.
          </p>

          {/* Main Dropdown */}
          <div className="space-y-3">
            <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-left font-normal"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span>Empleados...</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2 space-y-1">
                  {/* Categories */}
                  <div className="text-xs text-muted-foreground/60 px-2 py-1">Empleados</div>
                  <button
                    className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded-sm flex items-center justify-between"
                    onClick={() => {
                      setSelectedFilter("current-employees");
                      setDropdownOpen(false);
                    }}
                  >
                    <span className={selectedFilter === "current-employees" ? "font-semibold" : ""}>
                      Empleados/as actuales
                    </span>
                    {selectedFilter === "current-employees" && <Check className="h-4 w-4" />}
                  </button>
                  
                  <div className="text-xs text-muted-foreground/60 px-2 py-1 mt-2">Lugares de trabajo</div>
                  <button
                    className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded-sm flex items-center justify-between"
                    onClick={() => {
                      setSelectedFilter("workplace");
                      setDropdownOpen(false);
                    }}
                  >
                    <span className={selectedFilter === "workplace" ? "font-semibold" : ""}>
                      Gotham (lm)
                    </span>
                    {selectedFilter === "workplace" && <Check className="h-4 w-4" />}
                  </button>
                  
                  <div className="text-xs text-muted-foreground/60 px-2 py-1 mt-2">Equipo</div>
                  <button
                    className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded-sm flex items-center justify-between"
                    onClick={() => {
                      setSelectedFilter("team");
                      setDropdownOpen(false);
                    }}
                  >
                    <span className={selectedFilter === "team" ? "font-semibold" : ""}>
                      Equipo Rte
                    </span>
                    {selectedFilter === "team" && <Check className="h-4 w-4" />}
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Employee List */}
          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground">
                Cargando empleados...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground">
                No hay empleados disponibles
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs"
                    onClick={handleSelectAll}
                  >
                    Seleccionar todos
                  </Button>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs"
                    onClick={handleDeselectAll}
                  >
                    Deseleccionar todos
                  </Button>
                </div>
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`employee-${employee.id}`}
                      checked={isEmployeeSelected(employee)}
                      onCheckedChange={(checked) => handleEmployeeToggle(employee, checked as boolean)}
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`employee-${employee.id}`} className="text-sm font-medium cursor-pointer">
                          {employee.name}
                        </Label>
                        <div className="text-xs text-muted-foreground">
                          {employee.category} • {employee.contract_hours}h
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Effective Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fecha efectiva</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !effectiveDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveDate ? format(effectiveDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={effectiveDate}
                  onSelect={setEffectiveDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Apply Rest Days with Toggle */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Switch
                id="apply-rest-days"
                checked={applyRestDays}
                onCheckedChange={setApplyRestDays}
              />
              <Label htmlFor="apply-rest-days" className="text-sm">
                Aplicar días de descanso (Opcional)
              </Label>
            </div>

            {/* Rest Days Dropdown - Only shown when toggle is on */}
            {applyRestDays && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Número de días de descanso por semana</Label>
                <Select value={restDaysPerWeek} onValueChange={setRestDaysPerWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 día</SelectItem>
                    <SelectItem value="2">2 días</SelectItem>
                    <SelectItem value="3">3 días</SelectItem>
                    <SelectItem value="4">4 días</SelectItem>
                    <SelectItem value="5">5 días</SelectItem>
                    <SelectItem value="6">6 días</SelectItem>
                    <SelectItem value="7">7 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Selected employees count */}
          {selectedEmployees.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedEmployees.length} empleado(s) seleccionado(s)
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddEmployees} disabled={selectedEmployees.length === 0}>
            Añadir empleados
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}