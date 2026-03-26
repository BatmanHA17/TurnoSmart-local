import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Clock } from "lucide-react";

interface CompensatoryTimeOffBalancePopoverProps {
  children: React.ReactNode;
  onUpdate: (hoursChange: number, description: string) => Promise<boolean>;
}

export function CompensatoryTimeOffBalancePopover({ 
  children, 
  onUpdate 
}: CompensatoryTimeOffBalancePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !hours.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const hoursNumber = parseFloat(hours);
    if (isNaN(hoursNumber)) {
      toast.error("Por favor introduce un número válido de horas");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onUpdate(hoursNumber, title);
      if (success) {
        toast.success("Balance actualizado correctamente");
        setIsOpen(false);
        setTitle("");
        setHours("");
      } else {
        toast.error("Error al actualizar el balance");
      }
    } catch (error) {
      toast.error("Error al actualizar el balance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 shadow-lg border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" align="end">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Ajustar Balance</h4>
              <p className="text-xs text-muted-foreground">Modifica las horas de compensación</p>
            </div>
          </div>
          
          {/* Form */}
          <div className="space-y-4">
            {/* Descripción amplia */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">
                Describe la razón del ajuste
              </Label>
              <Textarea
                id="description"
                placeholder="Explica detalladamente el motivo del ajuste de horas..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="min-h-[80px] resize-none border-border/50 focus:border-primary/50 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Horas con diseño mejorado */}
            <div className="space-y-2">
              <Label htmlFor="hours" className="text-sm font-medium text-foreground">
                Ajuste de horas
              </Label>
              <div className="relative">
                <Input
                  id="hours"
                  type="text"
                  placeholder="+12, -4, 8..."
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="pl-3 border-border/50 focus:border-primary/50 transition-colors"
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                  horas
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Usa + para agregar horas, - para restar horas
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="flex-1 h-9"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !hours.trim()}
              className="flex-1 h-9"
            >
              {isSubmitting ? "Guardando..." : "Aplicar Ajuste"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}