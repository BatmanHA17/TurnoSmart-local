import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AdminSettingsRoute from "@/components/AdminSettingsRoute";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

export default function ProductivitySettings() {
  const [productivityGoal, setProductivityGoal] = useState("50");
  const [productivityUnit, setProductivityUnit] = useState("€/H");
  const { permissions } = useAdminPermissions();

  useEffect(() => {
    document.title = "Productividad | TurnoSmart";
  }, []);

  const handleSaveProductivity = () => {
    if (!permissions.canEdit) {
      toast.error("No tienes permisos para editar esta configuración");
      return;
    }
    toast.success("Objetivo de productividad guardado correctamente");
  };

  return (
    <AdminSettingsRoute allowView={true}>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Productividad</h1>
          <p className="text-gray-600">
            Define tus objetivos de productividad y métricas clave
          </p>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Objetivo de Productividad</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta mensual
                  </label>
                  <Input
                    type="number"
                    value={productivityGoal}
                    onChange={(e) => setProductivityGoal(e.target.value)}
                    placeholder="100"
                    disabled={!permissions.canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad de medida
                  </label>
                  <Input
                    value={productivityUnit}
                    onChange={(e) => setProductivityUnit(e.target.value)}
                    placeholder="turnos completados, horas trabajadas, etc."
                    disabled={!permissions.canEdit}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Indicadores sugeridos</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ratio clientes/empleado por turno</li>
                  <li>• Horas de trabajo efectivas vs. programadas</li>
                  <li>• Cumplimiento de horarios planificados</li>
                  <li>• Reducción de ausencias no programadas</li>
                </ul>
              </div>
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveProductivity} className="px-6" disabled={!permissions.canEdit}>
                Guardar objetivo
              </Button>
              {!permissions.canEdit && (
                <p className="text-sm text-muted-foreground mt-2 ml-4">
                  Solo los administradores pueden modificar esta configuración
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </AdminSettingsRoute>
  );
}