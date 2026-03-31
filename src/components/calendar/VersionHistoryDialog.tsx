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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarMiniPreview } from "./CalendarMiniPreview";
import { useCalendarVersions } from "@/hooks/useCalendarVersions";
import { toast } from "@/hooks/use-toast";
import {
  Clock,
  Download,
  RotateCcw,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  Sparkles,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

interface ShiftBlock {
  employeeId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  name: string;
  color: string;
  notes?: string;
  breakDuration?: string;
}

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  [key: string]: any;
}

interface CalendarVersion {
  id: string;
  version_name: string;
  created_at: string;
  created_by: string;
  is_auto_save: boolean;
  version_number: number;
  snapshot_data: {
    shiftBlocks: ShiftBlock[];
    employees: Employee[];
    weekRange: { start: Date; end: Date };
    metadata: {
      totalShifts: number;
      employeeCount: number;
      changes: string[];
    };
  };
}

interface GenerationRecord {
  id: string;
  created_at: string;
  status: string;
  chosen_index: number | null;
  period_start: string;
  period_end: string;
  config: any;
  result_snapshot: any;
}

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (version: CalendarVersion) => void;
  generations?: GenerationRecord[];
  isLoadingGenerations?: boolean;
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  onRestore,
  generations = [],
  isLoadingGenerations = false,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<CalendarVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<CalendarVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const { getVersions, isLoading } = useCalendarVersions();

  // Cargar versiones cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open]);

  const loadVersions = async () => {
    const data = await getVersions(30); // Últimas 30 versiones
    setVersions(data as unknown as CalendarVersion[]);
    if (data.length > 0) {
      setSelectedVersion(data[0] as unknown as CalendarVersion);
    }
  };

  const handleRestore = async (version: CalendarVersion) => {
    setIsRestoring(true);
    try {
      await onRestore(version);
      toast({
        title: "Versión restaurada",
        description: `Se ha restaurado "${version.version_name}"`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error restaurando versión:", error);
      toast({
        title: "Error al restaurar",
        description: "No se pudo restaurar esta versión. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDownload = (version: CalendarVersion) => {
    const dataStr = JSON.stringify(version.snapshot_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calendario-${version.version_name.replace(/\s+/g, "-")}-${format(
      new Date(version.created_at),
      "yyyy-MM-dd-HHmm"
    )}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Descarga iniciada",
      description: "La versión se ha descargado correctamente",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Historial de Versiones</DialogTitle>
          <DialogDescription>
            Revisa y restaura versiones anteriores del calendario. Se guardan automáticamente cada 3 segundos.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="versions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="versions">Versiones</TabsTrigger>
            <TabsTrigger value="generations">
              Generaciones SMART
              {generations.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[9px]">{generations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="versions">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay versiones guardadas todavía. Las versiones se guardan automáticamente mientras trabajas.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Lista de versiones */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Versiones disponibles</h3>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedVersion?.id === version.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {version.version_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(
                                  new Date(version.created_at),
                                  "dd MMM yyyy, HH:mm",
                                  { locale: es }
                                )}
                              </span>
                            </div>
                          </div>
                          {version.is_auto_save ? (
                            <Badge variant="secondary" className="text-xs">
                              Auto
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              Manual
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{version.snapshot_data.metadata.totalShifts} turnos</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{version.snapshot_data.metadata.employeeCount} empleados</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Preview y acciones */}
            <div className="space-y-4">
              {selectedVersion && (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Vista previa</h3>
                    <CalendarMiniPreview
                      shiftBlocks={selectedVersion.snapshot_data.shiftBlocks}
                      employees={selectedVersion.snapshot_data.employees}
                      weekRange={selectedVersion.snapshot_data.weekRange}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Detalles</h4>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>
                        <span className="font-medium">Versión:</span> #
                        {selectedVersion.version_number}
                      </p>
                      <p>
                        <span className="font-medium">Fecha:</span>{" "}
                        {format(
                          new Date(selectedVersion.created_at),
                          "dd MMMM yyyy 'a las' HH:mm:ss",
                          { locale: es }
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Tipo:</span>{" "}
                        {selectedVersion.is_auto_save ? "Autoguardado" : "Manual"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleRestore(selectedVersion)}
                      disabled={isRestoring}
                      className="flex-1"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Restaurando...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restaurar esta versión
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(selectedVersion)}
                      disabled={isRestoring}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Al restaurar, se creará automáticamente una copia de seguridad
                      de la versión actual antes de aplicar los cambios.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>
          </div>
        )}
          </TabsContent>

          <TabsContent value="generations">
            {isLoadingGenerations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : generations.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay generaciones SMART guardadas. Usa el Wizard para generar cuadrantes.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {generations.map((gen) => {
                    const score = gen.result_snapshot?.alternatives?.[gen.chosen_index ?? 0]?.output?.score;
                    const meta = gen.result_snapshot?.alternatives?.[gen.chosen_index ?? 0]?.output?.meta;
                    const chosenLabel = gen.result_snapshot?.alternatives?.[gen.chosen_index ?? 0]?.label;

                    return (
                      <div key={gen.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-violet-500" />
                            <span className="text-sm font-medium">
                              {format(new Date(gen.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                            </span>
                          </div>
                          <Badge
                            variant={gen.status === "published" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {gen.status === "published" ? "Publicado" : "Borrador"}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-4">
                            <span>Período: {gen.period_start} → {gen.period_end}</span>
                            {meta?.durationMs && (
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {(meta.durationMs / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                          {chosenLabel && (
                            <p>Perfil elegido: <span className="font-medium">{chosenLabel}</span></p>
                          )}
                          {meta && (
                            <p>{meta.totalEmployees} empleados, {meta.totalDays} días</p>
                          )}
                        </div>

                        {score && (
                          <div className="flex items-center gap-2 pt-1">
                            <Badge
                              variant={
                                score.trafficLight === "green" ? "default" :
                                score.trafficLight === "orange" ? "secondary" :
                                "destructive"
                              }
                              className="text-[10px]"
                            >
                              Score: {score.overall}/100
                            </Badge>
                            <div className="flex gap-1.5 text-[10px] text-muted-foreground">
                              <span>L:{score.legal}</span>
                              <span>C:{score.coverage}</span>
                              <span>E:{score.equity}</span>
                              <span>P:{score.petitions}</span>
                              <span>Er:{score.ergonomics}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
