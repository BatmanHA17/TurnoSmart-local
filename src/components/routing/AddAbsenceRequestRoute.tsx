import { useNavigate, useSearchParams } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LeaveRequestFormContent } from "@/components/LeaveRequestFormContent";

/**
 * Wrapper para usar LeaveRequestFormContent como ruta persistente.
 * Permite deep-linking a /ausencias/request/new manteniendo el mismo UI.
 */
export const AddAbsenceRequestRoute = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Obtener nombre del colaborador desde URL params (opcional)
  const colaboradorName = searchParams.get('colaborador') || undefined;
  
  const handleClose = () => {
    navigate(-1); // Volver a la página anterior
  };

  return (
    <Sheet open={true} onOpenChange={handleClose}>
      <SheetContent className="w-[600px] sm:w-[700px] bg-white z-50 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Solicitud de ausencia</SheetTitle>
          <SheetDescription className="sr-only">
            Formulario para solicitar una nueva ausencia o permiso laboral
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <LeaveRequestFormContent 
            onClose={handleClose}
            colaboradorName={colaboradorName}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
