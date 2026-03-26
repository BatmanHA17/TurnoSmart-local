import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface CreateWorkZoneDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkZoneDialog({ isOpen, onClose }: CreateWorkZoneDialogProps) {
  const [zoneName, setZoneName] = useState("");

  const handleSubmit = () => {
    // TODO: Implement zone creation logic
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">Nueva zona de trabajo</DialogTitle>
          <div className="text-[9px] text-muted-foreground">
            Configuración &gt; lugares de trabajo &gt; TurnoSmart &gt; zonas de trabajo
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-[11px] font-medium mb-2">Nueva zona de trabajo</h3>
            <p className="text-[10px] text-muted-foreground mb-3">
              Dale a tu zona de trabajo un nombre y sube el mapa del piso.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zone-name" className="text-[10px]">Nombre de la zona</Label>
            <Input
              id="zone-name"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="Ej: Terraza, Bodega, Cocina..."
              className="h-8 text-[10px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px]">Mapa del piso</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-[9px] text-muted-foreground">
                Arrastra y suelta o clic aquí para subir una imagen
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleSubmit}
            className="w-full h-8 text-[10px]"
            disabled={!zoneName.trim()}
          >
            Crear nueva zona de trabajo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}