import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// Removed local storage dependency - data will be in Supabase

interface CreateEneroButtonProps {
  onSuccess?: () => void;
}

export const CreateEneroButton = ({ onSuccess }: CreateEneroButtonProps) => {
  const [loading, setLoading] = useState(false);

  const createEneroCuadrante = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-enero-cuadrante');
      
      if (error) throw error;
      
      if (data.success) {
        toast.success("Horario de Enero TurnoSmart creado exitosamente", {
          description: `${data.assignmentsCreated} asignaciones creadas para ${data.employeesProcessed} empleados`
        });

        // Disparar evento para refrescar la lista de horarios
        window.dispatchEvent(new CustomEvent('horario-saved'));
        onSuccess?.();
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al crear el horario", {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={createEneroCuadrante}
      disabled={loading}
      className="flex items-center gap-2"
      variant="outline"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Calendar className="h-4 w-4" />
      )}
      {loading ? 'Creando...' : 'Crear Horario de Enero TurnoSmart'}
    </Button>
  );
};