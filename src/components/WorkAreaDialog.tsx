import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { CreateWorkZoneDialog } from "./CreateWorkZoneDialog";

interface WorkAreaDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkAreaDialog({ isOpen, onClose }: WorkAreaDialogProps) {
  const [showCreateZone, setShowCreateZone] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Configuración de zona de trabajo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="p-3 border rounded-md bg-muted/50">
              <div className="text-[10px] text-muted-foreground mb-1">Sin zona de trabajo</div>
            </div>
            
            <div className="p-3 border rounded-md">
              <div className="text-[10px] font-medium">TurnoSmart (im)</div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-8 text-[10px] justify-start"
              onClick={() => setShowCreateZone(true)}
            >
              <Plus className="h-3 w-3 mr-2" />
              Nueva zona de trabajo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateWorkZoneDialog 
        isOpen={showCreateZone} 
        onClose={() => setShowCreateZone(false)}
      />
    </>
  );
}