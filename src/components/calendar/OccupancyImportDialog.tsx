/**
 * OccupancyImportDialog — Importación de datos de ocupación (check-in/check-out)
 *
 * Tab 1: Grid manual para 31 días
 * Tab 2: CSV upload + preview + importar batch
 * Usa useOccupancyData().upsertBatch()
 */

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OccupancyEntry {
  day: number;
  checkIns: number;
  checkOuts: number;
}

interface OccupancyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalDays: number;
  year: number;
  month: number;
  existingData: OccupancyEntry[];
  onImport: (entries: OccupancyEntry[]) => Promise<void>;
}

export function OccupancyImportDialog({
  open,
  onOpenChange,
  totalDays,
  year,
  month,
  existingData,
  onImport,
}: OccupancyImportDialogProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  // Grid manual state — init from existing data
  const [gridData, setGridData] = useState<OccupancyEntry[]>(() => {
    const data: OccupancyEntry[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const existing = existingData.find((e) => e.day === d);
      data.push({
        day: d,
        checkIns: existing?.checkIns ?? 0,
        checkOuts: existing?.checkOuts ?? 0,
      });
    }
    return data;
  });

  // CSV state
  const [csvPreview, setCsvPreview] = useState<OccupancyEntry[] | null>(null);
  const [csvFileName, setCsvFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const updateGrid = (day: number, field: "checkIns" | "checkOuts", value: string) => {
    const num = parseInt(value, 10) || 0;
    setGridData((prev) =>
      prev.map((e) => (e.day === day ? { ...e, [field]: Math.max(0, num) } : e))
    );
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const entries: OccupancyEntry[] = [];

      // Skip header if present
      const startIdx = lines[0]?.match(/day|día|fecha|date/i) ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map((c) => c.trim());
        if (cols.length < 3) continue;

        const day = parseInt(cols[0], 10);
        const checkIns = parseInt(cols[1], 10);
        const checkOuts = parseInt(cols[2], 10);

        if (!isNaN(day) && day >= 1 && day <= totalDays && !isNaN(checkIns) && !isNaN(checkOuts)) {
          entries.push({ day, checkIns, checkOuts });
        }
      }

      if (entries.length === 0) {
        toast({ title: "Error", description: "No se pudieron parsear datos del CSV", variant: "destructive" });
        return;
      }
      setCsvPreview(entries);
    };
    reader.readAsText(file);
  };

  const handleImportGrid = async () => {
    const nonZero = gridData.filter((e) => e.checkIns > 0 || e.checkOuts > 0);
    if (nonZero.length === 0) {
      toast({ title: "Sin datos", description: "Introduce check-ins/check-outs para al menos 1 día" });
      return;
    }
    setIsImporting(true);
    try {
      await onImport(nonZero);
      toast({ title: "Ocupación guardada", description: `${nonZero.length} días importados` });
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportCSV = async () => {
    if (!csvPreview || csvPreview.length === 0) return;
    setIsImporting(true);
    try {
      await onImport(csvPreview);
      toast({ title: "CSV importado", description: `${csvPreview.length} días importados` });
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Datos de Ocupación — {monthName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="csv">Importar CSV</TabsTrigger>
          </TabsList>

          {/* Tab Manual */}
          <TabsContent value="manual">
            <ScrollArea className="h-[350px] pr-3">
              <div className="space-y-1">
                <div className="grid grid-cols-[50px_1fr_1fr] gap-2 text-xs font-medium text-muted-foreground pb-1 border-b sticky top-0 bg-background">
                  <span>Día</span>
                  <span>Check-ins</span>
                  <span>Check-outs</span>
                </div>
                {gridData.map((entry) => (
                  <div key={entry.day} className="grid grid-cols-[50px_1fr_1fr] gap-2 items-center">
                    <span className="text-xs text-muted-foreground text-center">{entry.day}</span>
                    <Input
                      type="number"
                      min={0}
                      className="h-7 text-xs"
                      value={entry.checkIns || ""}
                      onChange={(e) => updateGrid(entry.day, "checkIns", e.target.value)}
                    />
                    <Input
                      type="number"
                      min={0}
                      className="h-7 text-xs"
                      value={entry.checkOuts || ""}
                      onChange={(e) => updateGrid(entry.day, "checkOuts", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-3 flex justify-end">
              <Button onClick={handleImportGrid} disabled={isImporting} size="sm">
                {isImporting ? "Guardando..." : "Guardar datos"}
              </Button>
            </div>
          </TabsContent>

          {/* Tab CSV */}
          <TabsContent value="csv">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  CSV con 3 columnas: <code>día, check_ins, check_outs</code>
                </p>
                <p className="text-xs text-muted-foreground">
                  Separador: coma, punto y coma, o tabulador
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleCSVUpload}
                />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Seleccionar archivo
                </Button>
                {csvFileName && (
                  <Badge variant="secondary" className="text-xs">{csvFileName}</Badge>
                )}
              </div>

              {csvPreview && (
                <>
                  <p className="text-xs font-medium">{csvPreview.length} días detectados:</p>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-0.5">
                      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                        <span>Día</span><span>Check-ins</span><span>Check-outs</span>
                      </div>
                      {csvPreview.map((e) => (
                        <div key={e.day} className="grid grid-cols-3 gap-2 text-xs">
                          <span>{e.day}</span><span>{e.checkIns}</span><span>{e.checkOuts}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex justify-end">
                    <Button onClick={handleImportCSV} disabled={isImporting} size="sm">
                      {isImporting ? "Importando..." : `Importar ${csvPreview.length} días`}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
