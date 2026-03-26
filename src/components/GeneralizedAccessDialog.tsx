import { useState, useEffect } from "react";
import { X, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import { useColaboradorOrganizations } from "@/hooks/useColaboradorOrganizations";

interface GeneralizedAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaboradorId: string;
  colaboradorName?: string;
}

export function GeneralizedAccessDialog({ open, onOpenChange, colaboradorId, colaboradorName }: GeneralizedAccessDialogProps) {
  const { organizations, loading: orgsLoading } = useOrganizationsUnified();
  const { accesses, loading: accessesLoading, updateAccesses } = useColaboradorOrganizations(colaboradorId);
  const [selectedOrganizations, setSelectedOrganizations] = useState<Array<{
    id: string;
    name: string;
    selected: boolean;
  }>>([]);
  const [saving, setSaving] = useState(false);

  // Inicializar con TODAS las organizaciones disponibles
  useEffect(() => {
    if (open && organizations.length > 0) {
      const orgsWithSelection = organizations.map(org => ({
        id: org.id,
        name: org.name,
        selected: accesses.some(access => access.org_id === org.id && access.is_active)
      }));
      setSelectedOrganizations(orgsWithSelection);
    }
  }, [open, organizations, accesses]);

  const handleOrganizationToggle = (orgId: string) => {
    setSelectedOrganizations(prev => 
      prev.map(org => 
        org.id === orgId ? { ...org, selected: !org.selected } : org
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const selectedOrgIds = selectedOrganizations
        .filter(org => org.selected)
        .map(org => org.id);

      const success = await updateAccesses(selectedOrgIds);

      if (success) {
        toast({
          title: "Accesos actualizados",
          description: `Los accesos de ${colaboradorName || 'el colaborador'} han sido actualizados correctamente.`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron actualizar los accesos. Inténtalo de nuevo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving accesses:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los accesos.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = selectedOrganizations.filter(org => org.selected).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">
                Gestión de accesos
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground mt-1">
                Selecciona las organizaciones a las que {colaboradorName || 'el colaborador'} tendrá acceso
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Resumen de selección */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {selectedCount} {selectedCount === 1 ? 'organización seleccionada' : 'organizaciones seleccionadas'}
              </span>
            </div>
          </div>

          {/* Lista de organizaciones */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Organizaciones disponibles</Label>
            
            {(orgsLoading || accessesLoading) ? (
              <div className="p-4 text-sm text-muted-foreground">
                Cargando organizaciones...
              </div>
            ) : selectedOrganizations.length > 0 ? (
              <div className="space-y-2">
                {selectedOrganizations.map((org) => (
                  <div 
                    key={org.id}
                    className="flex items-center justify-between p-3 border border-border/30 rounded-lg hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{org.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {org.selected ? 'Con acceso' : 'Sin acceso'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {org.selected && (
                        <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                      )}
                      <Checkbox
                        checked={org.selected}
                        onCheckedChange={() => handleOrganizationToggle(org.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                No hay organizaciones disponibles
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">ℹ</span>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">
                  Información importante
                </p>
                <p className="text-xs text-blue-600">
                  Los accesos otorgados permitirán al colaborador ver y participar en la planificación de las organizaciones seleccionadas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-border/30">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1"
            disabled={selectedCount === 0 || saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}