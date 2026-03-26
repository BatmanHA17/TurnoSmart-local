import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MessageCircle } from "lucide-react";

interface AbsenceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AbsenceDetailsModal({ open, onOpenChange }: AbsenceDetailsModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] p-0 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-serif font-normal text-black">Información sobre la ausencia</h2>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-2 py-1 text-xs font-medium rounded-full">
                Aceptada
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Content Box */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4 text-center">
            <div className="mb-4">
              <p className="font-bold text-black text-base leading-relaxed">
                Del miércoles 17 sep. 2025 (por la mañana)<br />
                al miércoles 24 sep. 2025 (por la tarde)
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-full text-sm">
                Vacaciones
              </Badge>
              <span className="text-black font-medium text-base">8 días</span>
            </div>
          </div>

          {/* Submission Date */}
          <p className="text-gray-500 italic text-sm mb-6">
            Solicitud presentada el 16° septiembre 2025
          </p>

          {/* Approval Section */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                BB
              </div>
              <div className="flex-1">
                <p className="font-medium text-black text-sm">BATMAN BATMAN</p>
                <p className="text-gray-500 italic text-sm">
                  Solicitud aceptada el 16° septiembre 2025
                </p>
              </div>
            </div>

            {/* Message Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <span className="text-black font-medium text-sm">FELICES VACACIONES!</span>
            </div>
          </div>

          {/* Delete Button */}
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg"
            size="lg"
          >
            Suprimir las vacaciones
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}