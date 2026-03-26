import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface DeclareChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: any;
  onNext: (selectedOption: string) => void;
}

export const DeclareChangeDialog = ({ 
  open, 
  onOpenChange, 
  colaborador,
  onNext
}: DeclareChangeDialogProps) => {
  
  const [selectedOption, setSelectedOption] = useState("anexo");

  const handleNext = () => {
    onNext(selectedOption);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-medium">
            Declarar un cambio
          </DialogTitle>
          <DialogDescription>
            Seleccione si necesita crear un anexo o rectificar la información del contrato
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pregunta principal */}
          <div className="space-y-2">
            <p className="text-sm text-foreground">
              ¿El cambio en el contrato requiere un anexo?{" "}
              <a href="#" className="text-blue-600 underline text-sm">
                Más información
              </a>
            </p>
          </div>

          {/* Opciones de radio */}
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-4">
            {/* Opción 1: Crear un anexo */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="anexo" id="anexo" className="mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="anexo" className="text-sm font-medium text-foreground cursor-pointer">
                    Crear un anexo
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    El anexo es necesario en caso de modificación de información esencial como el tipo de contrato, las horas de trabajo, la calificación o el puesto.
                  </p>
                </div>
              </div>
            </div>

            {/* Opción 2: Rectificar información del contrato */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="rectificar" id="rectificar" className="mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="rectificar" className="text-sm font-medium text-foreground cursor-pointer">
                    Rectificar información del contrato
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    La información no esencial puede modificarse sin un anexo.
                  </p>
                  <div className="mt-2">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">Importante:</span> Cualquier modificación se aplica retroactivamente. Para establecer una fecha de efecto específica, se recomienda crear un anexo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>

          {/* Botón Siguiente */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleNext}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6"
            >
              Siguiente →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};