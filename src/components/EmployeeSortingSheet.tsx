import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  tipo_contrato?: string;
  tiempo_trabajo_semanal?: number;
  fecha_inicio_contrato?: string;
  fecha_nacimiento?: string;
  genero?: string;
  categoria?: string;
  departamento?: string;
  // establecimiento_por_defecto: ELIMINADO en Fase 5C - usar organización
  telefono_movil?: string;
  status?: string;
}

interface EmployeeSortingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onApplySort: (sortedEmployees: Employee[]) => void;
  currentSortCriteria: string;
}

interface SortOption {
  id: string;
  label: string;
  field: keyof Employee;
  category: string;
}

const sortOptions: SortOption[] = [
  // Datos Personales
  { id: 'nombre-asc', label: 'Nombre (A-Z)', field: 'nombre', category: 'Datos Personales' },
  { id: 'nombre-desc', label: 'Nombre (Z-A)', field: 'nombre', category: 'Datos Personales' },
  { id: 'apellidos-asc', label: 'Apellidos (A-Z)', field: 'apellidos', category: 'Datos Personales' },
  { id: 'apellidos-desc', label: 'Apellidos (Z-A)', field: 'apellidos', category: 'Datos Personales' },
  { id: 'fecha_nacimiento-asc', label: 'Fecha de Nacimiento (Antiguo-Reciente)', field: 'fecha_nacimiento', category: 'Datos Personales' },
  { id: 'fecha_nacimiento-desc', label: 'Fecha de Nacimiento (Reciente-Antiguo)', field: 'fecha_nacimiento', category: 'Datos Personales' },
  { id: 'genero-asc', label: 'Género (A-Z)', field: 'genero', category: 'Datos Personales' },
  
  // Contacto
  { id: 'email-asc', label: 'Email (A-Z)', field: 'email', category: 'Contacto' },
  { id: 'email-desc', label: 'Email (Z-A)', field: 'email', category: 'Contacto' },
  { id: 'telefono_movil-asc', label: 'Teléfono Móvil', field: 'telefono_movil', category: 'Contacto' },
  
  // Contrato y Tiempo
  { id: 'tipo_contrato-asc', label: 'Tipo de Contrato (A-Z)', field: 'tipo_contrato', category: 'Contrato y Tiempo' },
  { id: 'tiempo_trabajo_semanal-asc', label: 'Horas Semanales (Menor-Mayor)', field: 'tiempo_trabajo_semanal', category: 'Contrato y Tiempo' },
  { id: 'tiempo_trabajo_semanal-desc', label: 'Horas Semanales (Mayor-Menor)', field: 'tiempo_trabajo_semanal', category: 'Contrato y Tiempo' },
  { id: 'fecha_inicio_contrato-asc', label: 'Antigüedad (Más Antiguo)', field: 'fecha_inicio_contrato', category: 'Contrato y Tiempo' },
  { id: 'fecha_inicio_contrato-desc', label: 'Antigüedad (Más Reciente)', field: 'fecha_inicio_contrato', category: 'Contrato y Tiempo' },
  
  // Planificación
  { id: 'categoria-asc', label: 'Categoría (A-Z)', field: 'categoria', category: 'Planificación' },
  { id: 'categoria-desc', label: 'Categoría (Z-A)', field: 'categoria', category: 'Planificación' },
  { id: 'departamento-asc', label: 'Departamento (A-Z)', field: 'departamento', category: 'Planificación' },
  // { id: 'organizacion-asc', label: 'Organización (A-Z)', field: 'organizacion', category: 'Planificación' },
  
  // Estado
  { id: 'status-asc', label: 'Estado (Activo primero)', field: 'status', category: 'Estado' },
  { id: 'status-desc', label: 'Estado (Inactivo primero)', field: 'status', category: 'Estado' },
];

export function EmployeeSortingSheet({ 
  isOpen, 
  onClose, 
  employees, 
  onApplySort, 
  currentSortCriteria 
}: EmployeeSortingSheetProps) {
  const [selectedSort, setSelectedSort] = useState<string>(currentSortCriteria);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['Datos Personales']));
  const [manualOrderEmployees, setManualOrderEmployees] = useState<Employee[]>([]);
  const [isManualMode, setIsManualMode] = useState(true); // Por defecto en modo manual
  const [draggedEmployeeId, setDraggedEmployeeId] = useState<string | null>(null);

  // Initialize manual order when opening sheet
  useEffect(() => {
    if (isOpen) {
      // Siempre mostrar el orden actual del calendario primero
      setManualOrderEmployees([...employees]);
      
      // Solo cargar orden guardado si el usuario no ha hecho cambios recientes
      // y explícitamente vuelve al modo manual
      const savedManualOrder = localStorage.getItem('manual-employee-order');
      if (savedManualOrder && currentSortCriteria === 'manual') {
        try {
          const parsedOrder = JSON.parse(savedManualOrder);
          // No aplicar automáticamente, solo mantener disponible
        } catch (error) {
          console.error('Error parsing saved manual order:', error);
          localStorage.removeItem('manual-employee-order'); // Clean up corrupted data
        }
      }
    }
  }, [isOpen]);

  // Only sync with employees when explicitly switching back to automatic mode
  useEffect(() => {
    if (!isManualMode && !isOpen) {
      setManualOrderEmployees([...employees]);
      // Clear saved manual order when switching to automatic
      localStorage.removeItem('manual-employee-order');
    }
  }, [employees, isManualMode, isOpen]);

  const toggleCategory = (category: string) => {
    const newOpenCategories = new Set(openCategories);
    if (newOpenCategories.has(category)) {
      newOpenCategories.delete(category);
    } else {
      newOpenCategories.add(category);
    }
    setOpenCategories(newOpenCategories);
  };

  const enableManualMode = () => {
    setIsManualMode(true);
    setSelectedSort('manual');
    
    // Try to load saved manual order
    const savedManualOrder = localStorage.getItem('manual-employee-order');
    if (savedManualOrder) {
      try {
        const parsedOrder = JSON.parse(savedManualOrder);
        setManualOrderEmployees(parsedOrder);
        onApplySort(parsedOrder); // Apply the saved order immediately
      } catch (error) {
        console.error('Error parsing saved manual order:', error);
      }
    }
    
    setOpenCategories(new Set()); // Close all categories when in manual mode
  };

  const disableManualMode = () => {
    setIsManualMode(false);
    setSelectedSort(currentSortCriteria);
    // When returning to automatic mode, sync with current employees order
    setManualOrderEmployees([...employees]);
    setOpenCategories(new Set(['Datos Personales'])); // Reopen default category
  };

  const handleDragStart = (e: React.DragEvent, employeeId: string) => {
    setDraggedEmployeeId(employeeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', employeeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetEmployeeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    if (!draggedEmployeeId || draggedEmployeeId === targetEmployeeId) {
      setDraggedEmployeeId(null);
      return;
    }

    // Create a completely new array to force React to re-render
    const currentOrder = manualOrderEmployees.slice();
    const draggedIndex = currentOrder.findIndex(emp => emp.id === draggedEmployeeId);
    const targetIndex = currentOrder.findIndex(emp => emp.id === targetEmployeeId);
    
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedEmployeeId(null);
      return;
    }

    // Get the dragged employee
    const draggedEmployee = currentOrder[draggedIndex];

    // Remove from old position and insert at new position
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedEmployee);
    
    
    // Force state update
    setManualOrderEmployees(newOrder);
    
    // Save manual order to localStorage for persistence
    localStorage.setItem('manual-employee-order', JSON.stringify(newOrder));
    
    // Apply to calendar
    onApplySort(newOrder);
    
    setDraggedEmployeeId(null);
    
  };

  const handleDragEnd = () => {
    setDraggedEmployeeId(null);
  };

  const applySortCriteria = (sortId: string) => {
    setSelectedSort(sortId);
    
    const sortOption = sortOptions.find(option => option.id === sortId);
    if (!sortOption) return;

    const sorted = [...employees].sort((a, b) => {
      const aValue = a[sortOption.field];
      const bValue = b[sortOption.field];
      
      // Handle null/undefined values
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      // Special handling for dates
      if (sortOption.field === 'fecha_nacimiento' || sortOption.field === 'fecha_inicio_contrato') {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        
        // Ensure valid dates before comparison
        if (isNaN(aDate.getTime()) && isNaN(bDate.getTime())) return 0;
        if (isNaN(aDate.getTime())) return 1;
        if (isNaN(bDate.getTime())) return -1;
        
        const result = aDate.getTime() - bDate.getTime();
        return sortId.endsWith('-desc') ? -result : result;
      }
      
      // Special handling for numbers (tiempo_trabajo_semanal)
      if (sortOption.field === 'tiempo_trabajo_semanal') {
        const aNum = Number(aValue) || 0;
        const bNum = Number(bValue) || 0;
        const result = aNum - bNum;
        return sortId.endsWith('-desc') ? -result : result;
      }
      
      // String comparison
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      const result = aStr.localeCompare(bStr, 'es', { numeric: true });
      return sortId.endsWith('-desc') ? -result : result;
    });
    
    // Apply the sort directly to the calendar
    onApplySort(sorted);
  };

  const groupedOptions = sortOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, SortOption[]>);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Ordenar empleados en el calendario</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Personalizar el orden de los empleados en la Rota. Esta lista contiene los empleados cuya cuenta es activada, incluso si no están planificados esta semana.
          </p>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="flex gap-2">
            <Button
              variant={isManualMode ? "default" : "outline"}
              size="sm"
              onClick={enableManualMode}
              className="flex-1"
            >
              Ordenamiento manual
            </Button>
            <Button
              variant={!isManualMode ? "default" : "outline"}
              size="sm"
              onClick={disableManualMode}
              className="flex-1"
            >
              Ordenamiento automático
            </Button>
          </div>

          {/* Manual ordering mode */}
          {isManualMode ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Arrastra para reordenar empleados</h3>
              <p className="text-sm text-muted-foreground">
                Usa el icono de arrastre para cambiar el orden de los empleados en el calendario.
              </p>
              
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {manualOrderEmployees.map((employee, index) => (
                  <div
                    key={`manual-${employee.id}-pos-${index}-${manualOrderEmployees.length}`}
                    className={cn(
                      "flex items-center gap-3 py-2 px-3 bg-background border rounded cursor-grab active:cursor-grabbing transition-all duration-200",
                      draggedEmployeeId === employee.id ? "opacity-50 scale-95 shadow-lg" : "hover:bg-muted/30"
                    )}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, employee.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, employee.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 text-sm font-medium truncate">
                      {employee.nombre} {employee.apellidos}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Automatic sorting mode
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Criterios de ordenamiento</h3>
              
              {Object.entries(groupedOptions).map(([category, options]) => (
              <Collapsible
                key={category}
                open={openCategories.has(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-3 h-auto text-left"
                  >
                    <span className="font-medium">{category}</span>
                    {openCategories.has(category) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2 mt-2">
                  {options.map((option) => (
                    <Button
                      key={option.id}
                      variant={selectedSort === option.id ? "default" : "ghost"}
                      className="w-full justify-start text-sm h-auto p-3"
                      onClick={() => applySortCriteria(option.id)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
              ))}
            </div>
          )}

          {/* Información del criterio actual */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Criterio aplicado</h3>
              <Badge variant="secondary" className="text-xs">
                {isManualMode ? 'Orden manual' : (sortOptions.find(opt => opt.id === selectedSort)?.label || 'Sin ordenar')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {isManualMode 
                ? 'Los empleados se ordenan según tu configuración manual mediante arrastrar y soltar.'
                : 'Los cambios se aplican automáticamente al calendario principal cuando seleccionas un criterio de ordenamiento.'
              }
            </p>
          </div>

          {/* Botón de cerrar */}
          <div className="flex pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}