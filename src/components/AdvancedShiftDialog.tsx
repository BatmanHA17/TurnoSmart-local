import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import { useJobDepartments } from "@/hooks/useJobDepartments";
import { OrganizationFilter } from "@/components/filters/OrganizationFilter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { calculateTotalBreakTime, formatBreakTime, hasValidBreaks, type Break } from "@/utils/breakCalculations";
import { 
  Check, 
  Plus, 
  Coffee, 
  MapPin, 
  Save, 
  Info,
  Search,
  Clock,
  Calendar,
  HelpCircle,
  Building,
  FileText,
  Trash2,
  X,
  Gift,
  Coins,
  Ticket,
  Utensils
} from "lucide-react";
import { getSavedShifts, getSavedShiftsSync, addSavedShift, updateSavedShift, clearSavedShifts } from "@/store/savedShiftsStore";
import { toast } from "sonner";

// Interfaz temporal para compatibilidad con el estado existente
interface TempBreak {
  duration: string;
  startTime: string;
  endTime: string;
  showSchedule: boolean;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  workingHours: string;
}

interface ShiftPopupData {
  employeeId: string;
  date: Date;
}

interface AdvancedShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | undefined;
  date: Date;
  editingShift?: any;
  onShiftAssigned?: (shiftData: any) => void;
}

export function AdvancedShiftDialog({ isOpen, onClose, employee, date, editingShift, onShiftAssigned }: AdvancedShiftDialogProps) {
  const { currentOrganizationName } = useOrganizationsUnified();
  const { departments } = useJobDepartments();
  
  // Si no hay empleado (modo configuración), empezar en "scratch", sino en "saved"
  const [activeTab, setActiveTab] = useState(employee ? "saved" : "scratch");
  const [shiftName, setShiftName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("all");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");
  const [shouldSaveShift, setShouldSaveShift] = useState(!employee); // Auto-activar si no hay empleado específico
  const [searchTerm, setSearchTerm] = useState("");
  const [showBreaks, setShowBreaks] = useState(false);
  const [breakType, setBreakType] = useState("");
  const [breakDuration, setBreakDuration] = useState("");
  const [breaks, setBreaks] = useState<TempBreak[]>([]);
  const [selectedMeal, setSelectedMeal] = useState("Beneficio no dinerario");
  const [showMealSection, setShowMealSection] = useState(true);
  const [selectedColor, setSelectedColor] = useState("#10b981");
  const [accessType, setAccessType] = useState("company");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
  const [workplace, setWorkplace] = useState<string>("");
  const [shiftNotes, setShiftNotes] = useState<string>("");
  const [overtimeShift, setOvertimeShift] = useState<boolean>(false);
  const [savedShifts, setSavedShifts] = useState<any[]>([]);
  const [refreshShifts, setRefreshShifts] = useState(0);

  // Helper functions for team selection
  const parseTeamsFromString = (teamsString: string): string[] => {
    if (!teamsString || teamsString.trim() === "") return [];
    return teamsString.split(',').map(t => t.trim()).filter(t => t !== "");
  };

  const stringifyTeamsArray = (teams: string[]): string => {
    return teams.filter(t => t.trim() !== "").join(',');
  };

  const getTeamNameById = (teamId: string): string => {
    const team = departments.find(dept => dept.id === teamId);
    return team ? team.value : teamId;
  };

  // Functions for managing breaks
  const addBreak = () => {
    setBreaks([...breaks, {
      duration: "30",
      startTime: "",
      endTime: "",
      showSchedule: false
    }]);
  };

  const removeBreak = (index: number) => {
    const newBreaks = breaks.filter((_, i) => i !== index);
    setBreaks(newBreaks);
  };

  const updateBreak = (index: number, field: string, value: string | boolean) => {
    const newBreaks = [...breaks];
    newBreaks[index] = { ...newBreaks[index], [field]: value };
    setBreaks(newBreaks);
  };

  // Función para convertir TempBreak a Break
  const convertTempBreaksToBreaks = (tempBreaks: TempBreak[]): Break[] => {
    return tempBreaks.map((tempBreak, index) => ({
      id: `break-${index}`,
      name: `Descanso ${index + 1}`,
      duration: parseInt(tempBreak.duration) || 30,
      startTime: tempBreak.startTime || undefined,
      endTime: tempBreak.endTime || undefined
    }));
  };

  // Función para convertir Break a TempBreak
  const convertBreaksToTempBreaks = (breaks: Break[]): TempBreak[] => {
    return breaks.map((breakItem) => ({
      duration: (breakItem.duration || 30).toString(),
      startTime: breakItem.startTime || "",
      endTime: breakItem.endTime || "",
      showSchedule: !!(breakItem.startTime && breakItem.endTime)
    }));
  };

  // Effect to populate form when editing a shift
  useEffect(() => {
    if (editingShift) {
      setShiftName(editingShift.name || "");
      setStartTime(editingShift.startTime || "");
      setEndTime(editingShift.endTime || "");
      setSelectedOrgId(editingShift.organization || "all");
      setDepartment(editingShift.department || "");
      setNotes(editingShift.notes || "");
      setBreakType(editingShift.breakType || "");
      setBreakDuration(editingShift.breakDuration || "");
      setSelectedColor(editingShift.color || "#10b981");
      setAccessType(editingShift.accessType || "company");
      setSelectedTeams(parseTeamsFromString(editingShift.selectedTeam || ""));
      // Convertir los breaks del formato guardado al formato temporal para edición
      if (editingShift.breaks && Array.isArray(editingShift.breaks)) {
        setBreaks(convertBreaksToTempBreaks(editingShift.breaks));
      } else {
        setBreaks([]);
      }
      setShouldSaveShift(true);
      // Cuando se está editando, ir directamente a la pestaña "scratch"
      setActiveTab("scratch");
    } else {
      // Reset form when not editing
      setShiftName("");
      setStartTime("");
      setEndTime("");
      setSelectedOrgId("all");
      setDepartment("");
      setNotes("");
      setBreakType("");
      setBreakDuration("");
      setSelectedColor("#10b981");
      setAccessType("company");
      setSelectedTeams([]);
      setBreaks([]);
      setShouldSaveShift(!employee);
      setActiveTab(employee ? "saved" : "scratch");
    }
  }, [editingShift, employee, isOpen]);

  const handleAddShift = async () => {
    // Para la pestaña "Horarios guardados", verificar que hay horarios seleccionados
    if (activeTab === "saved") {
      if (selectedShifts.size === 0) {
        toast.error("Selecciona al menos un horario guardado para continuar");
        return;
      }
      
      // Procesar cada horario seleccionado
      const savedShiftsData = getSavedShiftsSync();
      selectedShifts.forEach(shiftId => {
        const selectedShift = savedShiftsData.find(s => s.id === shiftId);
        if (selectedShift && onShiftAssigned) {
          const shiftData = {
            name: selectedShift.name,
            startTime: selectedShift.startTime,
            endTime: selectedShift.endTime,
            organization: selectedOrgId === "all" ? currentOrganizationName : selectedOrgId,
            department: selectedShift.department,
            notes: selectedShift.notes,
            breakType: selectedShift.breakType,
            breakDuration: selectedShift.breakDuration,
            breaks: selectedShift.breaks || [],
            hasBreak: hasValidBreaks(selectedShift.breaks || []),
            totalBreakTime: calculateTotalBreakTime(selectedShift.breaks || []),
            employeeId: employee?.id,
            date: date.toISOString(),
            color: selectedShift.color,
          };
          onShiftAssigned(shiftData);
        }
      });
      
      // Registro de actividad sin toast
      onClose();
      return;
    }
    
    // Para la pestaña "Nuevo horario"
    if (activeTab === "scratch") {
      // Validaciones básicas solo para "Nuevo horario"
      if (!shiftName.trim()) {
        toast.error("El nombre del horario es obligatorio");
        return;
      }
    }
    
    if (!startTime || !endTime) {
      toast.error("Las horas de inicio y fin son obligatorias");
      return;
    }

    const shiftData = {
      name: shiftName,
      startTime,
      endTime,
      color: selectedColor,
      organization: selectedOrgId === "all" ? currentOrganizationName : selectedOrgId,
      department,
      notes,
      breakType,
      breakDuration,
      breaks: convertTempBreaksToBreaks(breaks),
      hasBreak: hasValidBreaks(convertTempBreaksToBreaks(breaks)),
      totalBreakTime: calculateTotalBreakTime(convertTempBreaksToBreaks(breaks)),
      employeeId: employee?.id,
      date: date.toISOString(),
    };

    // Lógica 1: Siempre añadir al día correspondiente
    if (onShiftAssigned) {
      onShiftAssigned(shiftData);
    }

    // Lógica 2: Si debe guardarse, añadir o actualizar el listado de horarios guardados
    if (shouldSaveShift && activeTab === "scratch") {
      const shiftToSave = {
        name: shiftName,
        startTime,
        endTime,
        color: selectedColor,
        accessType: accessType as 'company' | 'team',
        selectedTeam: stringifyTeamsArray(selectedTeams),
        department,
        organization: selectedOrgId === "all" ? currentOrganizationName : selectedOrgId,
        breakType,
        breakDuration,
        breaks: convertTempBreaksToBreaks(breaks),
        hasBreak: hasValidBreaks(convertTempBreaksToBreaks(breaks)),
        totalBreakTime: calculateTotalBreakTime(convertTempBreaksToBreaks(breaks)),
        notes,
      };

      if (editingShift) {
        // Actualizar horario existente
        const success = await updateSavedShift(editingShift.id, shiftToSave);
        if (success) {
          toast.success("Horario actualizado correctamente");
          // Notificar a TimeSlotRectangles y otros componentes
          window.dispatchEvent(new CustomEvent('shifts-updated'));
        } else {
          toast.error("Error al actualizar el horario");
        }
        // Registro de actividad sin toast
      } else {
        // Crear nuevo horario
        const newShift = await addSavedShift(shiftToSave);
        if (newShift) {
          toast.success("Horario guardado correctamente");
          // Notificar a TimeSlotRectangles y otros componentes
          window.dispatchEvent(new CustomEvent('shifts-updated'));
        } else {
          toast.error("Error al guardar el horario");
        }
        // Registro de actividad sin toast
      }

      // Refrescar la lista de horarios guardados
      setRefreshShifts(prev => prev + 1);
      // Notificar globalmente sobre cambios
      window.dispatchEvent(new CustomEvent('shifts-updated'));
    }

    if (!editingShift && employee) {
      // Registro de actividad sin toast
    }
    onClose();
  };

  const colorOptions = [
    "#e5e7eb", "#f3b9d1", "#be185d", "#a21caf", 
    "#c026d3", "#9333ea", "#7c3aed", "#6366f1", "#64748b",
    "#7dd3fc", "#3b82f6", "#1e40af", "#065f46", "#047857", 
    "#059669", "#bbf7d0", "#84cc16", "#65a30d", "#bef264",
    "#a3a3a3", "#ca8a04", "#eab308", "#365314", "#f59e0b", 
    "#ea580c", "#dc2626", "#fca5a5"
  ];

  useEffect(() => {
    if (isOpen) {
      // Combinar horarios guardados en store y favoritos de localStorage
      const loadAllShifts = async () => {
        // Forzar recarga desde base de datos para obtener datos actualizados
        const savedShifts = await getSavedShifts(true);
        
        // Cargar favoritos desde localStorage
        try {
          const stored = localStorage.getItem('turnosmart-favorite-shifts');
          const favoriteShifts = stored ? JSON.parse(stored) : [];
          
          // Filtrar duplicados basándose en ID Y nombre para evitar duplicaciones
          const combined = [...savedShifts];
          favoriteShifts.forEach((fav: any) => {
            // Verificar duplicados por ID y por nombre
            const existsById = combined.some(shift => shift.id === fav.id);
            const existsByName = combined.some(shift => 
              shift.name.toLowerCase() === fav.name.toLowerCase()
            );
            if (!existsById && !existsByName) {
              combined.push(fav);
            }
          });
          
          setSavedShifts(combined);
        } catch (error) {
          console.error('Error cargando favoritos en AdvancedShiftDialog:', error);
          setSavedShifts(savedShifts);
        }
      };
      
      loadAllShifts();
    }
  }, [isOpen, refreshShifts]);

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[450px] max-w-[450px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm">Opciones avanzadas</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto p-0 bg-transparent border-none relative">
              <TabsTrigger value="saved" className="bg-transparent border-none text-[10px] font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-1 rounded-none">Horarios guardados</TabsTrigger>
              <TabsTrigger value="scratch" className="bg-transparent border-none text-[10px] font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-1 rounded-none ml-4">Nuevo horario</TabsTrigger>
            </TabsList>

            <TabsContent value="saved" className="space-y-3">
              {/* Employee info */}
              <div className="text-[8px] text-muted-foreground">
                <div>Empleado/a: <span className="font-medium">{employee?.name}</span></div>
                <div>{format(date, "EEEE, d MMMM yyyy", { locale: es })}</div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-7 text-[9px] pl-7"
                />
              </div>

              {/* Saved shifts list */}
              <div className="space-y-2">
                {savedShifts.length > 0 ? (
                  savedShifts
                    .filter(shift => shift.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((shift) => (
                    <div 
                      key={shift.id} 
                      className="flex items-center justify-between p-2 border rounded hover:bg-accent cursor-pointer relative"
                      onClick={() => {
                        // Marcar como seleccionado al hacer clic
                        const newSelected = new Set(selectedShifts);
                        if (newSelected.has(shift.id)) {
                          newSelected.delete(shift.id);
                        } else {
                          newSelected.add(shift.id);
                        }
                        setSelectedShifts(newSelected);
                      }}
                      style={{
                        borderLeftColor: shift.color,
                        borderLeftWidth: '3px'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: shift.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] font-medium flex items-center gap-1">
                            {shift.name}
                            {shift.hasBreak && (
                              <Coffee className="h-2 w-2 text-amber-600" />
                            )}
                          </div>
                          <div className="text-[8px] text-muted-foreground">
                            {shift.startTime} - {shift.endTime}
                            {shift.hasBreak && shift.totalBreakTime && (
                              <span className="ml-1 text-amber-600">
                                • {formatBreakTime(shift.totalBreakTime)} descanso
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-4 w-4 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newSelected = new Set(selectedShifts);
                          if (newSelected.has(shift.id)) {
                            newSelected.delete(shift.id);
                          } else {
                            newSelected.add(shift.id);
                          }
                          setSelectedShifts(newSelected);
                        }}
                      >
                        {selectedShifts.has(shift.id) ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <span className="h-3 w-3 border border-muted-foreground rounded-sm" />
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-[9px] text-muted-foreground">No hay horarios guardados</p>
                  </div>
                )}
              </div>

              {/* Expanded organization selection for multiple shifts */}
              {selectedShifts.size > 0 && (
                <div className="space-y-2 border-2 border-primary/20 rounded-lg p-3 bg-primary/5">
                  <div className="text-[10px] font-medium">Configuración para horarios seleccionados</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <Label className="text-[10px] font-medium">Empresa/Organización</Label>
                    </div>
                    <OrganizationFilter
                      value={selectedOrgId}
                      onChange={setSelectedOrgId}
                      placeholder="Seleccionar organización"
                      className="h-8 text-[10px] border-2"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="scratch" className="space-y-3">
              {/* Employee info */}
              {employee && (
                <div className="text-[8px] text-muted-foreground">
                  <div>Empleado/a: <span className="font-medium">{employee.name}</span></div>
                  <div>{format(date, "EEEE, d MMMM yyyy", { locale: es })}</div>
                </div>
              )}

              {/* Shift name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-3 bg-primary"></div>
                  </div>
                  <Label className="text-[10px] font-medium">Nombre del horario</Label>
                </div>
                <Input
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="Ej: Turno mañana recepción"
                  className="h-8 text-[10px] border-2"
                />
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <Label className="text-[10px] font-medium">Hora inicio</Label>
                  </div>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-8 text-[10px] border-2"
                    placeholder="--:--"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <Label className="text-[10px] font-medium">Hora fin</Label>
                  </div>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-8 text-[10px] border-2"
                    placeholder="--:--"
                  />
                </div>
              </div>

              {/* Break section */}
              <div className="space-y-2">
                {breaks.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Coffee className="h-3 w-3 text-muted-foreground" />
                      <Label className="text-[10px] font-medium">Descanso(s)</Label>
                    </div>
                    
                    {breaks.map((break_item, index) => (
                      <div key={index} className="space-y-1">
                        {!break_item.showSchedule ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  placeholder="30"
                                  value={break_item.duration}
                                  onChange={(e) => updateBreak(index, 'duration', e.target.value)}
                                  className="h-8 w-10 text-[10px] text-center border-2 rounded-md px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-[9px] text-muted-foreground">min</span>
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-[10px] text-primary hover:text-primary/80"
                                onClick={() => updateBreak(index, 'showSchedule', true)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Mostrar horarios
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-destructive/10 rounded-full flex-shrink-0"
                              onClick={() => removeBreak(index)}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full gap-1">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Input
                                  type="number"
                                  placeholder="30"
                                  value={break_item.duration}
                                  onChange={(e) => updateBreak(index, 'duration', e.target.value)}
                                  className="h-8 w-10 text-[10px] text-center border-2 rounded-md px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-[9px] text-muted-foreground whitespace-nowrap">min de</span>
                              </div>
                              
                              <Input
                                type="time"
                                placeholder="00:00"
                                value={break_item.startTime}
                                onChange={(e) => updateBreak(index, 'startTime', e.target.value)}
                                className="h-8 w-16 text-[10px] text-center border-2 rounded-md px-1 flex-shrink-0"
                              />
                              
                              <span className="text-[9px] text-muted-foreground whitespace-nowrap">a</span>
                              
                              <Input
                                type="time"
                                placeholder="00:00"
                                value={break_item.endTime}
                                onChange={(e) => updateBreak(index, 'endTime', e.target.value)}
                                className="h-8 w-16 text-[10px] text-center border-2 rounded-md px-1 flex-shrink-0"
                              />
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-destructive/10 rounded-full flex-shrink-0"
                              onClick={() => removeBreak(index)}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-[10px] text-primary hover:text-primary/80 justify-start"
                      onClick={addBreak}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Añadir otra pausa
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-3 w-3 text-muted-foreground" />
                      <Label className="text-[10px] font-medium">Descanso(s)</Label>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-[10px] text-primary hover:text-primary/80 justify-start"
                      onClick={addBreak}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Añadir una pausa
                    </Button>
                  </div>
                )}
              </div>

              {/* Meal section */}
              <div className="space-y-2">
                {showMealSection ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Utensils className="h-3 w-3 text-muted-foreground" />
                      <Label className="text-[10px] font-medium">Comida</Label>
                    </div>
                    
                    <div className="flex items-center justify-between w-full gap-2">
                      <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                        <SelectTrigger className="h-8 text-[10px] border-2 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent 
                          style={{ 
                            backgroundColor: 'rgb(255, 255, 255)',
                            color: 'rgb(0, 0, 0)',
                            zIndex: 9999,
                            opacity: 1
                          }}
                        >
                          <SelectItem value="Prestación por comidas" className="text-[10px]">
                            <div className="flex items-center gap-2">
                              <Coins className="h-3 w-3" />
                              Prestación por comidas
                            </div>
                          </SelectItem>
                          <SelectItem value="Beneficio no dinerario" className="text-[10px]">
                            <div className="flex items-center gap-2">
                              <Gift className="h-3 w-3" />
                              Beneficio no dinerario
                            </div>
                          </SelectItem>
                          <SelectItem value="Vale de restaurante" className="text-[10px]">
                            <div className="flex items-center gap-2">
                              <Ticket className="h-3 w-3" />
                              Vale de restaurante
                            </div>
                          </SelectItem>
                          <SelectItem value="Comida tomada fuera" className="text-[10px]">
                            <div className="flex items-center gap-2">
                              <Utensils className="h-3 w-3" />
                              Comida tomada fuera
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-destructive/10 rounded-full flex-shrink-0"
                        onClick={() => setShowMealSection(false)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-3 w-3 text-muted-foreground" />
                      <Label className="text-[10px] font-medium">Comida</Label>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-[10px] text-primary hover:text-primary/80 justify-start"
                      onClick={() => setShowMealSection(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Añadir una comida
                    </Button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-primary bg-background"></div>
                  <Label className="text-[10px] font-medium">Notas</Label>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade una nota a este horario. Los miembros del equipo verán tus notas cuando..."
                  className="min-h-[60px] text-[10px] resize-none border-2"
                />
              </div>

              {/* Save toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Save className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-medium">Guardar horario</span>
                  </div>
                  <Switch
                    checked={shouldSaveShift}
                    onCheckedChange={setShouldSaveShift}
                  />
                </div>

                {/* Expanded save section */}
                {shouldSaveShift && (
                  <div className="space-y-4 border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                    {/* Info box */}
                    <div className="bg-blue-100 border-l-4 border-blue-500 p-3 rounded">
                      <p className="text-[9px] text-blue-700">
                        Guarda este horario para futuras asignaciones.
                      </p>
                    </div>

                    {/* Info about single name usage */}
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <p className="text-[9px] text-blue-700">
                        💡 El nombre del horario se usará tanto para el calendario del empleado como para guardarlo en favoritos.
                      </p>
                    </div>

                    {/* Color picker */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-medium">Etiqueta de color</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-wrap">
                          {colorOptions.map((color) => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`w-5 h-5 rounded-full ${
                                selectedColor === color ? 'ring-2 ring-foreground ring-offset-1' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1 border-l pl-2">
                          <Label htmlFor="custom-color" className="text-[9px] text-muted-foreground whitespace-nowrap">Color personalizado:</Label>
                          <input
                            id="custom-color"
                            type="color"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Access controls */}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-medium">Acceso</Label>
                      <RadioGroup value={accessType} onValueChange={setAccessType} className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="company" id="company" />
                          <Label htmlFor="company" className="text-[10px]">Toda la empresa</Label>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="team" id="team" />
                            <Label htmlFor="team" className="text-[10px]">Equipo o lugar trabajo</Label>
                          </div>
                          {accessType === "team" && (
                            <div className="ml-6 space-y-3 border-2 border-primary/30 rounded-lg p-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium">Equipo</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button>
                                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-[9px]">Selecciona el equipo que puede usar este turno</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="h-8 w-full justify-start text-[10px] border-2"
                                    >
                                      {selectedTeams.length === 0 
                                        ? "Seleccionar equipos..." 
                                        : selectedTeams.length === 1 
                                          ? getTeamNameById(selectedTeams[0])
                                          : `${selectedTeams.length} equipos seleccionados`
                                      }
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-0">
                                    <div className="p-3">
                                      <div className="text-[10px] font-medium mb-2">Seleccionar equipos</div>
                                      <div className="space-y-2">
                                        {departments.map((department) => (
                                          <div key={department.id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={department.id}
                                              checked={selectedTeams.includes(department.id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedTeams([...selectedTeams, department.id]);
                                                } else {
                                                  setSelectedTeams(selectedTeams.filter(id => id !== department.id));
                                                }
                                              }}
                                            />
                                            <Label
                                              htmlFor={department.id}
                                              className="text-[10px] cursor-pointer flex-1"
                                            >
                                              {department.value}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                      {selectedTeams.length > 0 && (
                                        <div className="mt-3 pt-2 border-t">
                                          <div className="text-[9px] text-muted-foreground mb-2">Seleccionados:</div>
                                          <div className="flex flex-wrap gap-1">
                                            {selectedTeams.map((teamId) => (
                                              <Badge
                                                key={teamId}
                                                variant="secondary"
                                                className="text-[8px] h-5 px-1"
                                              >
                                                {getTeamNameById(teamId)}
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-3 w-3 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                                                  onClick={() => {
                                                    setSelectedTeams(selectedTeams.filter(id => id !== teamId));
                                                  }}
                                                >
                                                  <X className="h-2 w-2" />
                                                </Button>
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          )}
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 h-9 text-[10px] font-medium"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 h-9 text-[10px] font-medium border-red-500 text-red-600 hover:bg-red-50"
              onClick={handleAddShift}
            >
              {editingShift ? "Editar horario" : "Añadir horario"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}