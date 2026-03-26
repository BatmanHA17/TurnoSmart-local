import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarIcon, X } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TerminateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador?: {
    id: string;
    nombre: string;
    apellidos: string;
  };
  onTerminateSuccess?: () => void;
}

export function TerminateContractDialog({ open, onOpenChange, colaborador, onTerminateSuccess }: TerminateContractDialogProps) {
  const [fechaFinalizacion, setFechaFinalizacion] = useState<Date>();
  const [motivo, setMotivo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { logActivity } = useActivityLog();

  const motivosTerminacion = [
    "Cambio de Establecimiento",
    "Despido Económico", 
    "Despido por Cierre Definitivo del Establecimiento",
    "Despido por Falta Grave",
    "Despido por Falta Simple",
    "Despido por Incapacidad Física de Origen Laboral",
    "Despido por Insuficiencia Profesional",
    "Dimisión",
    "Fallecimiento del Colaborador",
    "Fin del Período de Prueba por Iniciativa del Empleado",
    "Fin del Período de Prueba por Iniciativa del Empleador",
    "Fuerza Mayor",
    "Jubilación",
    "Jubilación Voluntaria",
    "Rescisión Judicial del Contrato de Trabajo",
    "Terminación Convencional",
    "Transferencia dentro del Mismo Grupo sin Ruptura del Contrato"
  ];

  const handleSubmit = async () => {
    if (!colaborador || !fechaFinalizacion || !motivo) return;

    setIsLoading(true);
    try {
      // Formatear fecha para la base de datos (YYYY-MM-DD)
      const formattedDate = format(fechaFinalizacion, 'yyyy-MM-dd');

      // Actualizar el colaborador con fecha de fin de contrato y cambiar status a 'inactivo'
      const { error } = await supabase
        .from('colaboradores')
        .update({ 
          fecha_fin_contrato: formattedDate,
          status: 'inactivo'
        })
        .eq('id', colaborador.id);

      if (error) {
        throw error;
      }

      // Registrar en el log de actividades
      await logActivity({
        action: 'TERMINAR_CONTRATO',
        entityType: 'colaborador',
        entityId: colaborador.id,
        entityName: `${colaborador.nombre} ${colaborador.apellidos}`,
        details: {
          fechaFinalizacion: format(fechaFinalizacion, 'dd/MM/yyyy'),
          motivo: motivo,
          nombreCompleto: `${colaborador.nombre} ${colaborador.apellidos}`
        }
      });

      toast({
        title: "Contrato terminado",
        description: `El contrato de ${colaborador.nombre} ${colaborador.apellidos} ha sido terminado exitosamente.`,
      });

      // Limpiar formulario y cerrar diálogo
      setFechaFinalizacion(undefined);
      setMotivo("");
      onOpenChange(false);
      
      // Llamar callback si existe
      if (onTerminateSuccess) {
        onTerminateSuccess();
      }

      // Navegar de vuelta a la lista de colaboradores
      setTimeout(() => {
        window.location.href = '/colaboradores';
      }, 1000);

    } catch (error) {
      console.error('Error terminando contrato:', error);
      toast({
        title: "Error",
        description: "Hubo un error al terminar el contrato. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-medium">
            Terminar el contrato
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          {/* Cuadro de información azul */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-medium">i</span>
              </div>
              <div>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Spidear dejarán de figurar en los horarios tras la fecha de finalización de su contrato.
                </p>
              </div>
            </div>
          </div>

          {/* Fecha de finalización del contrato */}
          <FormField label="Fecha de finalización del contrato" required>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  value={fechaFinalizacion ? format(fechaFinalizacion, "dd/MM/yyyy", { locale: es }) : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Auto-format date as user types
                    let formattedValue = value.replace(/\D/g, '');
                    if (formattedValue.length >= 2) {
                      formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
                    }
                    if (formattedValue.length >= 5) {
                      formattedValue = formattedValue.substring(0, 5) + '/' + formattedValue.substring(5, 9);
                    }
                    
                    // Try to parse the date if it's complete
                    if (formattedValue.length === 10) {
                      const parts = formattedValue.split('/');
                      if (parts.length === 3) {
                        const day = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                        const year = parseInt(parts[2]);
                        
                        if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
                          const newDate = new Date(year, month, day);
                          setFechaFinalizacion(newDate);
                          return;
                        }
                      }
                    }
                    
                    // Set input value for incomplete dates
                    e.target.value = formattedValue;
                  }}
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fechaFinalizacion}
                    onSelect={setFechaFinalizacion}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </FormField>

          {/* Motivo */}
          <FormField label="Motivo" required>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un motivo de baja" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {motivosTerminacion.map((motivoOption) => (
                  <SelectItem key={motivoOption} value={motivoOption}>
                    {motivoOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!fechaFinalizacion || !motivo || isLoading}
          >
            {isLoading ? "Terminando..." : "Terminar contrato"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}