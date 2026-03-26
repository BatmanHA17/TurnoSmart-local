import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Clock, Edit, Trash2, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const GestionJornadaLaboral = () => {
  const navigate = useNavigate();
  
  // Estado de períodos creados que se sincroniza con localStorage (pasos 70-75)
  const [createdPeriods, setCreatedPeriods] = useState([]);

  // Cargar períodos desde localStorage al montar el componente
  useEffect(() => {
    const savedPeriods = JSON.parse(localStorage.getItem('gestion-jornada-periods') || '[]');
    setCreatedPeriods(savedPeriods);
  }, []);

  // Función para eliminar período (pasos 74-75)
  const deletePeriod = (periodId: string) => {
    const updatedPeriods = createdPeriods.filter(p => p.id !== periodId);
    setCreatedPeriods(updatedPeriods);
    localStorage.setItem('gestion-jornada-periods', JSON.stringify(updatedPeriods));
    
    toast({
      title: "Período eliminado",
      description: "El período de gestión de jornada laboral ha sido eliminado exitosamente",
    });
  };

  // Si hay períodos creados, mostrar la vista con lista de períodos (pasos 55-62)
  if (createdPeriods.length > 0) {
    return (
      <div className="p-6">
        {/* Header con botón crear período */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Gestión de Jornada Laboral
          </h2>
          <Button 
            onClick={() => navigate('/gestion-jornada-laboral/crear')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear un período
          </Button>
        </div>

        {/* Lista de períodos creados */}
        <div className="space-y-4">
          {createdPeriods.map((period) => (
            <div key={period.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {period.type === 'workday_management' ? (
                      <Clock className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Building2 className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{period.name}</h3>
                    <p className="text-sm text-gray-500">
                      {period.startDate} - {period.endDate}
                    </p>
                  </div>
                </div>
                
                {/* Paso 73: Iconos de editar y eliminar */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/gestion-jornada-laboral/crear?edit=${period.id}`)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {/* Paso 74-75: Modal de confirmación para eliminar */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente este período de gestión de jornada laboral y todos los datos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deletePeriod(period.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Confirmo que deseo eliminar estos datos
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vista original cuando no hay períodos creados
  return (
    <div className="relative">
      {/* Botón "Crear un período" en la esquina superior derecha */}
      <div className="absolute top-0 right-0">
        <Button 
          onClick={() => navigate('/gestion-jornada-laboral/crear')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear un período
        </Button>
      </div>

      {/* Contenido principal centrado */}
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          No hay ningún período de Gestión de Jornada Laboral creado
        </h2>
        <p className="text-gray-600 max-w-2xl leading-relaxed">
          Este establecimiento no tiene un período de Gestión de Jornada Laboral creado. 
          Puedes crear un período de Gestión de Jornada Laboral haciendo clic en el botón "Crear un período".
        </p>
      </div>
    </div>
  );
};