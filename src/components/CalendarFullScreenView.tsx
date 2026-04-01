import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Share2, Download, Copy, Printer, MessageCircle, Mail } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  workingHours: string;
  startDate?: string;
}

interface ShiftBlock {
  id: string;
  employeeId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: "morning" | "afternoon" | "night" | "absence";
  color: string;
  name?: string;
  absenceCode?: string;
  notes?: string;
}

interface CalendarFullScreenViewProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  shiftBlocks: ShiftBlock[];
  currentWeek: Date;
  onPrint?: () => void;
  onExport?: () => void;
}

export function CalendarFullScreenView({
  isOpen,
  onClose,
  employees,
  shiftBlocks,
  currentWeek,
  onPrint,
  onExport
}: CalendarFullScreenViewProps) {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayLabels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  const getShiftForEmployeeAndDay = (employeeId: string, date: Date) => {
    return shiftBlocks.find(
      (shift) =>
        shift.employeeId === employeeId &&
        format(shift.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  const handleShareWhatsApp = () => {
    const weekText = format(weekStart, "d 'de' MMMM", { locale: es });
    const text = `Cuadrante TurnoSmart® - Semana del ${weekText}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    toast({ title: "Compartiendo por WhatsApp", description: "Se abrirá WhatsApp para compartir el cuadrante" });
  };

  const handleShareEmail = () => {
    const weekText = format(weekStart, "d 'de' MMMM", { locale: es });
    const subject = `Cuadrante TurnoSmart® - Semana del ${weekText}`;
    const body = `Te adjunto el cuadrante de horarios para la semana del ${weekText}.`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
    toast({ title: "Enviando por Email", description: "Se abrirá tu cliente de email" });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Enlace copiado", description: "El enlace del cuadrante se ha copiado al portapapeles" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo copiar el enlace", variant: "destructive" });
    }
  };

  const handleDownloadImage = () => {
    // Implementar captura de pantalla del calendario
    toast({ title: "Descargando imagen", description: "Próximamente disponible" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 bg-background border-0 print:max-w-[210mm] print:w-[210mm] print:h-auto print:p-0 print:m-0 print:scale-90 print:origin-top-left">
        <div className="h-full flex flex-col">
          {/* Header con título y acciones */}
          <DialogHeader className="flex-shrink-0 p-4 border-b bg-card print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-semibold text-foreground">
                  Cuadrante TurnoSmart®
                </DialogTitle>
                <p className="text-muted-foreground mt-1">
                  Semana del {format(weekStart, "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
              
              {/* Botones de acción */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" onClick={handleShareEmail}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar enlace
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                  <Download className="w-4 h-4 mr-2" />
                  Imagen
                </Button>
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Calendario optimizado */}
          <div className="flex-1 overflow-auto p-4 print:overflow-visible print:p-1">
            <div className="bg-card rounded-lg border p-4 print:border-0 print:bg-transparent print:p-0 print:rounded-none">
              {/* Header del calendario */}
              <div className="grid grid-cols-8 gap-2 mb-3 print:gap-0.5 print:mb-1">
                <div className="p-2 font-medium text-muted-foreground text-sm print:p-0.5 print:text-[10px]">
                  Empleado
                </div>
                {days.map((day, index) => (
                  <div
                    key={day.toISOString()}
                    className="p-2 text-center font-medium text-sm bg-muted rounded-md print:p-0.5 print:text-[10px] print:bg-gray-100"
                  >
                    <div className="text-muted-foreground">{dayLabels[index]}</div>
                    <div className="text-foreground font-semibold">
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filas de empleados */}
              {employees.map((employee) => (
                <div key={employee.id} className="grid grid-cols-8 gap-2 mb-2 print:gap-0.5 print:mb-0.5">
                  {/* Columna del empleado */}
                  <div className="p-2 flex flex-col justify-center border-r print:p-0.5 print:border-gray-300">
                    <div className="font-medium text-sm text-foreground truncate print:text-[10px]">
                      {employee.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate print:text-[8px]">
                      {employee.role}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1 w-fit print:text-[8px] print:mt-0">
                      {employee.workingHours}
                    </Badge>
                  </div>

                  {/* Columnas de los días */}
                  {days.map((day) => {
                    const shift = getShiftForEmployeeAndDay(employee.id, day);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className="p-1.5 min-h-[70px] border rounded-md bg-background/50 print:min-h-[40px] print:p-0.5 print:border-gray-300 print:text-xs"
                      >
                        {shift ? (
                          shift.name === "Descanso Semanal" || shift.absenceCode === 'D' || shift.type === 'absence' ? (
                            // Banner estrecho para Descanso Semanal - igual que ShiftCard.tsx
                            <div className="bg-slate-200/90 border border-slate-300/60 hover:bg-slate-300/90 w-full h-6 rounded-md mt-0.5 shadow-sm flex items-center justify-center px-2 py-1 print:h-4 print:mt-0">
                              <div className="text-[9px] font-medium text-slate-600 truncate leading-none print:text-[7px]">
                                Descanso semanal (1 día)
                              </div>
                            </div>
                          ) : (
                            // Tarjeta normal para otros turnos con sombreado
                            <div
                              className="h-full rounded px-2 py-1 text-xs font-medium text-white flex flex-col justify-center shadow-sm hover:shadow-md transition-all print:px-1 print:py-0.5 print:text-[8px]"
                              style={{ 
                                backgroundColor: `${shift.color}15`,
                                borderColor: shift.color,
                                borderWidth: '1px',
                                borderLeftWidth: '2px'
                              }}
                            >
                              <div className="text-center">
                                <div className="font-semibold text-gray-900 print:text-[7px]">
                                  {shift.startTime} - {shift.endTime}
                                </div>
                                {shift.name && (
                                  <div className="text-xs text-gray-700 mt-1 print:text-[6px] print:mt-0">
                                    {shift.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                            -
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Watermark - Solo visible en impresión */}
            <div className="mt-4 text-center print:block hidden">
              <p className="text-xs text-muted-foreground print:text-gray-500 print:text-[8px]">
                Creado con TurnoSmart® - Sistema de gestión de horarios
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}