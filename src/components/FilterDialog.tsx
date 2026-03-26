import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Filter, Plus } from "lucide-react";

export function FilterDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-[9px] px-2">
          <Filter className="h-2.5 w-2.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Filtros</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-[11px] text-muted-foreground">
            Añade filtros para refinar tu búsqueda. Por defecto, te mostraremos a las personas actuales.
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-8 text-[10px] justify-start"
          >
            <Plus className="h-3 w-3 mr-2" />
            Nuevo filtro
          </Button>
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-[9px]"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              size="sm" 
              className="h-7 text-[9px]"
              onClick={() => setIsOpen(false)}
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}