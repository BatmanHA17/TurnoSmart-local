import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DeleteShiftConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  shiftName?: string;
  deleteData?: {
    type: 'single' | 'bulk';
    shifts?: any[];
    count?: number;
  };
}

export function DeleteShiftConfirmation({
  isOpen,
  onClose,
  onConfirm,
  shiftName,
  deleteData
}: DeleteShiftConfirmationProps) {
  if (!isOpen) return null;

  const isBulkDelete = deleteData?.type === 'bulk';
  const employeeCount = isBulkDelete ? new Set(deleteData?.shifts?.map(s => s.employeeId)).size : 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-80 bg-white">
        <div className="p-4">
          {/* Header con X */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isBulkDelete ? 'Eliminar horarios' : 'Eliminar horario'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isBulkDelete 
                  ? `Estás a punto de eliminar un total de ${deleteData?.count} turnos asignados para ${employeeCount} empleado${employeeCount > 1 ? 's' : ''}. ¿Quieres continuar?`
                  : 'Estás a punto de eliminar un turno. ¿Quieres continuar?'
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {isBulkDelete ? 'Eliminar horarios' : 'Sí, eliminar'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}