import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, UserPlus, Search, Upload, X, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEmployees, createEmployee } from "@/services/database";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Employee } from "@/types/database";

interface GoTurnoStep2EmployeeSelectionProps {
  selectedEmployees: Employee[];
  onSelectedEmployeesChange: (employees: Employee[]) => void;
}

export const GoTurnoStep2EmployeeSelection = ({ 
  selectedEmployees, 
  onSelectedEmployeesChange 
}: GoTurnoStep2EmployeeSelectionProps) => {
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedListOpen, setSelectedListOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Estado para nuevo empleado
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    category: "",
    contract_hours: 8,
    contract_unit: 1.0,
    department: "bares",
    employee_type: "propio" as "propio" | "ett",
    employee_number: null
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employees = await getEmployees();
      setAllEmployees(employees);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = allEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeToggle = (employee: Employee, checked: boolean) => {
    if (checked) {
      onSelectedEmployeesChange([...selectedEmployees, employee]);
    } else {
      onSelectedEmployeesChange(selectedEmployees.filter(emp => emp.id !== employee.id));
    }
  };

  const handleSelectAll = () => {
    onSelectedEmployeesChange(filteredEmployees);
  };

  const handleDeselectAll = () => {
    onSelectedEmployeesChange([]);
  };

  const isEmployeeSelected = (employee: Employee) => {
    return selectedEmployees.some(emp => emp.id === employee.id);
  };

  const removeSelectedEmployee = (employeeId: string) => {
    onSelectedEmployeesChange(selectedEmployees.filter(emp => emp.id !== employeeId));
  };

  const handleCreateEmployee = async () => {
    if (!newEmployee.name.trim() || !newEmployee.category.trim()) {
      toast({
        title: "Error",
        description: "Nombre y categoría son obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const created = await createEmployee(newEmployee);
      setAllEmployees([...allEmployees, created]);
      onSelectedEmployeesChange([...selectedEmployees, created]);
      
      // Limpiar formulario
      setNewEmployee({
        name: "",
        category: "",
        contract_hours: 8,
        contract_unit: 1.0,
        department: "bares",
        employee_type: "propio",
        employee_number: null
      });

      toast({
        title: "Éxito",
        description: "Empleado creado y añadido al turno"
      });
    } catch (error) {
      console.error("Error creating employee:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el empleado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Users className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
          <span className="text-sm md:text-base">Paso 2: Personal</span>
        </CardTitle>
        {!isMobile && (
          <CardDescription className="text-xs md:text-sm">
            Selecciona empleados para el turno
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-6 px-3 md:px-6">
        {/* Mobile quick stats */}
        {isMobile && selectedEmployees.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {selectedEmployees.length} seleccionados
              </span>
            </div>
          </div>
        )}

        <Tabs defaultValue="select" className="w-full">
          <TabsList className={cn(
            "grid w-full grid-cols-2",
            isMobile ? "h-8 text-xs" : "h-10 text-sm"
          )}>
            <TabsTrigger value="select" className="text-xs md:text-sm">
              {isMobile ? "Buscar" : "Seleccionar Empleados"}
            </TabsTrigger>
            <TabsTrigger value="create" className="text-xs md:text-sm">
              {isMobile ? "Crear" : "Añadir Nuevo"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-3 md:space-y-4 mt-3 md:mt-6">
            {/* Search and actions */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 md:h-10 text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSelectAll} 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  className="flex-1 text-xs md:text-sm h-8 md:h-9"
                >
                  Todos
                </Button>
                <Button 
                  onClick={handleDeselectAll} 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  className="flex-1 text-xs md:text-sm h-8 md:h-9"
                >
                  Ninguno
                </Button>
              </div>
            </div>

            {/* Employee list */}
            <div className={cn(
              "border rounded-lg overflow-hidden",
              isMobile ? "max-h-48" : "max-h-60",
              "overflow-y-auto"
            )}>
              {filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No se encontraron empleados
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={cn(
                      "flex items-center space-x-3 border-b last:border-b-0 hover:bg-accent cursor-pointer transition-colors",
                      isMobile ? "p-2" : "p-3",
                      isEmployeeSelected(employee) && "bg-accent/50"
                    )}
                    onClick={() => handleEmployeeToggle(employee, !isEmployeeSelected(employee))}
                  >
                    <Checkbox
                      checked={isEmployeeSelected(employee)}
                      onCheckedChange={(checked) => handleEmployeeToggle(employee, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium truncate",
                        isMobile ? "text-sm" : "text-base"
                      )}>
                        {employee.name}
                      </p>
                      <p className={cn(
                        "text-muted-foreground truncate",
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        {employee.category} • {employee.contract_hours}h
                      </p>
                    </div>
                    <Badge 
                      variant={employee.employee_type === "propio" ? "default" : "secondary"}
                      className={cn(
                        "flex-shrink-0",
                        isMobile ? "text-xs px-1.5 py-0.5" : "text-xs"
                      )}
                    >
                      {employee.employee_type === "propio" ? "Propio" : "ETT"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-3 md:space-y-4 mt-3 md:mt-6">
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="name" className="text-xs md:text-sm">Nombre</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className="h-9 md:h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="category" className="text-xs md:text-sm">Categoría</Label>
                  <Input
                    id="category"
                    value={newEmployee.category}
                    onChange={(e) => setNewEmployee({ ...newEmployee, category: e.target.value })}
                    placeholder="Camarero"
                    className="h-9 md:h-10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="contract_hours" className="text-xs md:text-sm">Horas</Label>
                  <Select
                    value={newEmployee.contract_hours.toString()}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, contract_hours: parseInt(value) })}
                  >
                    <SelectTrigger className="h-9 md:h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8h (100%)</SelectItem>
                      <SelectItem value="6">6h (75%)</SelectItem>
                      <SelectItem value="5">5h (62.5%)</SelectItem>
                      <SelectItem value="4">4h (50%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="employee_type" className="text-xs md:text-sm">Tipo</Label>
                  <Select
                    value={newEmployee.employee_type}
                    onValueChange={(value: "propio" | "ett") => setNewEmployee({ ...newEmployee, employee_type: value })}
                  >
                    <SelectTrigger className="h-9 md:h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propio">Propio</SelectItem>
                      <SelectItem value="ett">ETT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCreateEmployee} 
              disabled={loading} 
              className={cn(
                "w-full",
                isMobile ? "h-9 text-sm" : "h-10"
              )}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isMobile ? "Crear" : "Crear y Añadir Empleado"}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Selected employees summary - Mobile Optimized */}
        {selectedEmployees.length > 0 && (
          <div className="space-y-2">
            <Collapsible open={selectedListOpen} onOpenChange={setSelectedListOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between h-auto p-3",
                    isMobile ? "text-sm" : "text-base"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {selectedEmployees.length} empleado{selectedEmployees.length > 1 ? 's' : ''} seleccionado{selectedEmployees.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {selectedListOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-2">
                <div className={cn(
                  "border rounded-lg p-3 bg-muted/30 max-h-32 overflow-y-auto",
                  isMobile && "max-h-24"
                )}>
                  <div className="grid gap-2">
                    {selectedEmployees.map((employee, index) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between p-2 bg-background rounded border text-sm hover:bg-accent transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{employee.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {employee.category} • {employee.contract_hours}h
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge 
                            variant={employee.employee_type === "propio" ? "default" : "secondary"}
                            className="text-xs px-1.5 py-0.5"
                          >
                            {employee.employee_type === "propio" ? "Propio" : "ETT"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removeSelectedEmployee(employee.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Quick actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="flex-1 text-xs h-8"
                  >
                    Deseleccionar todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedListOpen(false)}
                    className="flex-1 text-xs h-8"
                  >
                    Cerrar lista
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
};