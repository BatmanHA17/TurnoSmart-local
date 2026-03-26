import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvailabilitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName?: string;
  colaboradorId?: string;
  currentAvailability?: any;
  onSaveSuccess?: () => void;
}

interface DayAvailability {
  status: 'disponible' | 'disponible_parte' | 'no_disponible';
  timeRange?: string;
}

const DAYS = [
  'Lunes',
  'Martes', 
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
];

export function AvailabilitySheet({ 
  open, 
  onOpenChange, 
  employeeName, 
  colaboradorId,
  currentAvailability,
  onSaveSuccess 
}: AvailabilitySheetProps) {
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({
    'Lunes': { status: 'disponible' },
    'Martes': { status: 'disponible' },
    'Miércoles': { status: 'disponible' },
    'Jueves': { status: 'disponible' },
    'Viernes': { status: 'disponible' },
    'Sábado': { status: 'disponible' },
    'Domingo': { status: 'disponible' }
  });
  const [isSaving, setIsSaving] = useState(false);

  // Cargar disponibilidad actual cuando se abre el diálogo
  useEffect(() => {
    if (open && currentAvailability) {
      try {
        const parsedAvailability = typeof currentAvailability === 'string' 
          ? JSON.parse(currentAvailability)
          : currentAvailability;
        
        if (Array.isArray(parsedAvailability) && parsedAvailability.length > 0) {
          const availabilityMap: Record<string, DayAvailability> = {};
          parsedAvailability.forEach((item: any) => {
            if (item.day && item.status) {
              availabilityMap[item.day] = {
                status: item.status,
                timeRange: item.timeRange
              };
            }
          });
          setAvailability(availabilityMap);
        }
      } catch (error) {
        console.error('Error parsing availability:', error);
      }
    }
  }, [open, currentAvailability]);

  const handleStatusChange = (day: string, status: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        status: status as DayAvailability['status'],
        timeRange: status === 'disponible_parte' ? prev[day]?.timeRange || '' : undefined
      }
    }));
  };

  const handleTimeRangeChange = (day: string, timeRange: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeRange
      }
    }));
  };

  const handleSave = async () => {
    if (!colaboradorId) {
      toast.error("Error: No se puede guardar sin ID de colaborador");
      return;
    }

    setIsSaving(true);
    try {
      // Convertir el objeto de disponibilidad a un array
      const availabilityArray = DAYS.map(day => ({
        day,
        status: availability[day]?.status || 'disponible',
        timeRange: availability[day]?.timeRange
      }));

      // Guardar en la base de datos
      const { error } = await supabase
        .from('colaboradores')
        .update({ 
          disponibilidad_semanal: availabilityArray
        })
        .eq('id', colaboradorId);

      if (error) throw error;

      toast.success("Disponibilidad guardada correctamente");
      
      // Llamar callback de éxito
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error("Error al guardar la disponibilidad");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md">
        <SheetHeader className="pb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold text-foreground">
              Disponibilidad
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {DAYS.map((day) => (
            <div key={day} className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">{day}</h3>
              
              <Select
                value={availability[day]?.status || 'disponible'}
                onValueChange={(value) => handleStatusChange(day, value)}
              >
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="disponible_parte">Disponible en parte</SelectItem>
                  <SelectItem value="no_disponible">No disponible</SelectItem>
                </SelectContent>
              </Select>

              {availability[day]?.status === 'disponible_parte' && (
                <Input
                  placeholder="Especificar los horarios de disponibilidad"
                  value={availability[day]?.timeRange || ''}
                  onChange={(e) => handleTimeRangeChange(day, e.target.value)}
                  className="bg-background border-border text-muted-foreground placeholder:text-muted-foreground"
                />
              )}
            </div>
          ))}
        </div>

        <div className="pt-8">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-green-700 hover:bg-green-800 text-white"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}