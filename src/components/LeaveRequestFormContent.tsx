import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, CheckCircle, Search, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LeaveRequestFormContentProps {
  onClose: () => void;
  colaboradorName?: string; // Añadir nombre específico del colaborador
}

export const LeaveRequestFormContent = ({ onClose, colaboradorName }: LeaveRequestFormContentProps) => {
  const { toast } = useToast();
  
  // Form state
  const [searchTerm, setSearchTerm] = useState(colaboradorName || "");
  const [selectedEmployee, setSelectedEmployee] = useState(colaboradorName || "");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startPeriod, setStartPeriod] = useState("mañana");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endPeriod, setEndPeriod] = useState("tarde");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [employees, setEmployees] = useState<Array<{id: string, name: string}>>([]);
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

  // Load active employees from database
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('colaborador_full')
          .select('id, nombre, apellidos')
          .eq('status', 'activo')
          .order('apellidos', { ascending: true })
          .order('nombre', { ascending: true });

        if (error) {
          console.error('Error loading employees:', error);
          return;
        }

        console.log('Raw employee data from DB:', data);

        const formattedEmployees = data?.map(emp => ({
          id: emp.id,
          name: `${emp.nombre} ${emp.apellidos}`
        })) || [];

        console.log('Formatted employees for dropdown:', formattedEmployees);
        setEmployees(formattedEmployees);
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };

    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeSearch = (value: string) => {
    setSearchTerm(value);
    setShowEmployeeDropdown(true);
  };

  const selectEmployee = (employee: any) => {
    setSelectedEmployee(employee.name);
    setSearchTerm(employee.name);
    setShowEmployeeDropdown(false);
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    setStartCalendarOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    setEndCalendarOpen(false);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Save both to new format (absenceRequests) and old format (leaveRequests)
    const newRequest = {
      id: Date.now().toString(),
      empleado: selectedEmployee,
      fechaInicio: startDate ? format(startDate, "yyyy-MM-dd") : "",
      periodoInicio: startPeriod,
      fechaFin: endDate ? format(endDate, "yyyy-MM-dd") : "",
      periodoFin: endPeriod,
      dias: calculateDays(),
      tipo: leaveType,
      estado: "pendiente",
      fechaSolicitud: format(new Date(), "yyyy-MM-dd"),
      comentario: comment
    };

    // Old format for compatibility with LeaveRequestWorkflow
    const oldFormatRequest = {
      id: newRequest.id,
      employee: selectedEmployee,
      presentedDate: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }),
      dateRange: `Del ${startDate ? format(startDate, "dd MMMM yyyy", { locale: es }) : ""} ${startPeriod} al ${endDate ? format(endDate, "dd MMMM yyyy", { locale: es }) : ""} ${endPeriod}`,
      leaveType: leaveType,
      days: `${calculateDays()} días`,
      status: "pending",
      submittedDate: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }),
      requestDetails: {
        startDate: startDate ? `${format(startDate, "dd MMMM yyyy", { locale: es })} ${startPeriod}` : "",
        endDate: endDate ? `${format(endDate, "dd MMMM yyyy", { locale: es })} ${endPeriod}` : "",
        reason: comment
      }
    };

    // Save to both storage formats
    const existingNewRequests = JSON.parse(localStorage.getItem('absenceRequests') || '[]');
    const existingOldRequests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
    
    const updatedNewRequests = [newRequest, ...existingNewRequests];
    const updatedOldRequests = [oldFormatRequest, ...existingOldRequests];
    
    localStorage.setItem('absenceRequests', JSON.stringify(updatedNewRequests));
    localStorage.setItem('leaveRequests', JSON.stringify(updatedOldRequests));
    
    // Trigger storage events to update other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'absenceRequests',
      newValue: JSON.stringify(updatedNewRequests)
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'leaveRequests',
      newValue: JSON.stringify(updatedOldRequests)
    }));
    
    window.dispatchEvent(new CustomEvent('absenceRequestsUpdated'));
    window.dispatchEvent(new CustomEvent('leaveRequestsUpdated'));
    
    // Force immediate update of employee absence requests section
    window.dispatchEvent(new CustomEvent('forceEmployeeAbsenceUpdate'));
    
    // Force immediate update of the "A procesar" section
    window.dispatchEvent(new CustomEvent('forceLeaveRequestUpdate'));
    
    toast({
      title: "Solicitud guardada",
      description: "La solicitud de ausencia ha sido guardada correctamente",
      duration: 3000, // Limitar a 3 segundos
    });
    setIsSubmitted(true);
    setIsSubmitting(false);
    
    // Close after showing success - reducir tiempo
    setTimeout(() => {
      onClose();
      resetForm();
    }, 1500); // Reducido de 2000 a 1500ms
  };

  const resetForm = () => {
    setSearchTerm("");
    setSelectedEmployee("");
    setLeaveType("");
    setStartDate(undefined);
    setStartPeriod("mañana");
    setEndDate(undefined);
    setEndPeriod("tarde");
    setComment("");
    setIsSubmitted(false);
    setShowEmployeeDropdown(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">¡Solicitud guardada!</h3>
          <p className="text-sm text-gray-600">
            La solicitud de ausencia ha sido guardada correctamente y aparece en la tabla.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Employee Search */}
      <FormField label="Empleado/Colaborador" required>
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar empleado... (ej: SPI)"
            value={searchTerm}
            onChange={(e) => handleEmployeeSearch(e.target.value)}
            onFocus={() => setShowEmployeeDropdown(true)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          
          {showEmployeeDropdown && searchTerm && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => selectEmployee(employee)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                >
                  <span className="text-sm text-gray-900">{employee.name}</span>
                  <Check className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No se encontraron empleados{employees.length === 0 ? ' (cargando...)' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </FormField>

      {/* Leave Type */}
      <FormField label="Tipo de ausencia" required>
        <Select value={leaveType} onValueChange={setLeaveType}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccione el tipo de ausencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vacaciones">Vacaciones</SelectItem>
            <SelectItem value="permiso-retribuido">Permiso retribuido</SelectItem>
            <SelectItem value="permiso-no-retribuido">Permiso no retribuido</SelectItem>
            <SelectItem value="baja-enfermedad">Baja por enfermedad</SelectItem>
            <SelectItem value="baja-maternidad">Baja por maternidad</SelectItem>
            <SelectItem value="baja-paternidad">Baja por paternidad</SelectItem>
            <SelectItem value="formacion">Formación</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Start Date */}
      <FormField label="Fecha de inicio" required>
        <div className="space-y-3">
          <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd MMMM yyyy", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                locale={es}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <ToggleGroup type="single" value={startPeriod} onValueChange={setStartPeriod} className="w-fit">
            <ToggleGroupItem value="mañana" className="px-6">Mañana</ToggleGroupItem>
            <ToggleGroupItem value="tarde" className="px-6">Tarde</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </FormField>

      {/* End Date */}
      <FormField label="Fecha de fin" required>
        <div className="space-y-3">
          <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd MMMM yyyy", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                locale={es}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <ToggleGroup type="single" value={endPeriod} onValueChange={setEndPeriod} className="w-fit">
            <ToggleGroupItem value="mañana" className="px-6">Mañana</ToggleGroupItem>
            <ToggleGroupItem value="tarde" className="px-6">Tarde</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </FormField>

      {/* Comment */}
      <FormField label="Comentario">
        <Textarea
          placeholder="Aquí se puede escribir cualquier comentario acerca de la ausencia"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </FormField>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
};