import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useDataProtection } from "@/hooks/useDataProtection";
import {
  Clock,
  RotateCcw,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OperationBackup {
  id: string;
  operation_type: string;
  operation_description?: string;
  backup_data: any;
  affected_records: number;
  created_at: string;
  restored_at?: string;
  restored_by?: string;
}

interface OperationBackupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (backupData: any, backupId: string) => Promise<void>;
}

export function OperationBackupsDialog({
  open,
  onOpenChange,
  onRestore,
}: OperationBackupsDialogProps) {
  const [backups, setBackups] = useState<OperationBackup[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<OperationBackup | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const { getBackups, rollbackOperation, isProcessing } = useDataProtection();

  // Cargar backups cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadBackups();
    }
  }, [open]);

  const loadBackups = async () => {
    const data = await getBackups(30);
    setBackups(data);
    if (data.length > 0) {
      setSelectedBackup(data[0]);
    }
  };

  const handleRestore = async (backup: OperationBackup) => {
    setIsRestoring(true);
    try {
      // Obtener datos del backup
      const backupData = await rollbackOperation(backup.id);
      
      if (backupData) {
        // Llamar al callback para restaurar los datos
        await onRestore(backupData, backup.id);
        
        // Recargar lista de backups
        await loadBackups();
      }
    } catch (error) {
      console.error("Error restaurando backup:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  const getOperationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      bulk_delete: "Eliminación Masiva",
      clear_calendar: "Limpiar Calendario",
      migration: "Migración",
      shift_modification: "Modificación de Turnos",
      employee_removal: "Eliminación de Empleado",
    };
    return labels[type] || type;
  };

  const getOperationTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      bulk_delete: "destructive",
      clear_calendar: "destructive",
      migration: "default",
      shift_modification: "secondary",
      employee_removal: "destructive",
    };
    return colors[type] || "default";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Backups de Operaciones Críticas</DialogTitle>
          </div>
          <DialogDescription>
            Restaura datos desde backups automáticos creados antes de operaciones importantes.
          </DialogDescription>
        </DialogHeader>

        {isProcessing ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : backups.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No hay backups disponibles</AlertTitle>
            <AlertDescription>
              Los backups se crean automáticamente antes de operaciones críticas como eliminaciones masivas.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {/* Lista de backups */}
            <div className="col-span-1 space-y-2">
              <h3 className="text-sm font-medium">Backups disponibles</h3>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {backups.map((backup) => (
                    <button
                      key={backup.id}
                      onClick={() => setSelectedBackup(backup)}
                      disabled={isRestoring}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedBackup?.id === backup.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      } ${isRestoring ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant={getOperationTypeColor(backup.operation_type) as any}
                            className="text-xs"
                          >
                            {getOperationTypeLabel(backup.operation_type)}
                          </Badge>
                          {backup.restored_at && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {backup.operation_description || "Sin descripción"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(backup.created_at), "dd MMM HH:mm", {
                                locale: es,
                              })}
                            </span>
                          </div>
                          {backup.affected_records > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {backup.affected_records} registro(s) afectados
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Detalles del backup seleccionado */}
            <div className="col-span-2 space-y-4">
              {selectedBackup && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Detalles del Backup</CardTitle>
                      <CardDescription>
                        Información sobre la operación y los datos respaldados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Tipo de Operación</p>
                          <p className="text-sm text-muted-foreground">
                            {getOperationTypeLabel(selectedBackup.operation_type)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Fecha de Creación</p>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(selectedBackup.created_at),
                              "dd MMMM yyyy 'a las' HH:mm:ss",
                              { locale: es }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Registros Afectados</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedBackup.affected_records}
                          </p>
                        </div>
                        {selectedBackup.restored_at && (
                          <div>
                            <p className="text-sm font-medium">Restaurado</p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(selectedBackup.restored_at),
                                "dd MMM yyyy HH:mm",
                                { locale: es }
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedBackup.operation_description && (
                        <div>
                          <p className="text-sm font-medium">Descripción</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedBackup.operation_description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {!selectedBackup.restored_at && (
                    <>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Importante</AlertTitle>
                        <AlertDescription className="text-xs">
                          Al restaurar este backup, se creará automáticamente un backup de seguridad
                          del estado actual antes de aplicar los cambios. Los datos se sobrescribirán
                          con los del backup seleccionado.
                        </AlertDescription>
                      </Alert>

                      <Button
                        onClick={() => handleRestore(selectedBackup)}
                        disabled={isRestoring}
                        className="w-full"
                      >
                        {isRestoring ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Restaurando...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurar este Backup
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {selectedBackup.restored_at && (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertTitle>Backup ya restaurado</AlertTitle>
                      <AlertDescription>
                        Este backup ya fue restaurado el{" "}
                        {format(new Date(selectedBackup.restored_at), "dd MMMM yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
