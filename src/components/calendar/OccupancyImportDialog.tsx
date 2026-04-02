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
// xlsx loaded dynamically to avoid 300KB+ bundle impact
const loadXLSX = () => import("xlsx");

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

  // B4-1: Parsing mejorado — soporta día (1-31), fecha ISO (2026-04-05), fecha EU (05/04/2026)
  const parseDayFromColumn = (value: string): number | null => {
    const trimmed = value.trim().replace(/^["']|["']$/g, '');

    // Intento 1: número directo (día del mes)
    const asNum = parseInt(trimmed, 10);
    if (!isNaN(asNum) && asNum >= 1 && asNum <= 31 && trimmed.length <= 2) return asNum;

    // Intento 2: fecha ISO (2026-04-05 o 2026/04/05)
    const isoMatch = trimmed.match(/^\d{4}[-/]\d{2}[-/](\d{2})/);
    if (isoMatch) return parseInt(isoMatch[1], 10);

    // Intento 3: fecha EU (05/04/2026 o 05-04-2026)
    const euMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/]\d{2,4}/);
    if (euMatch) return parseInt(euMatch[1], 10);

    // Intento 4: nombre del día eliminado, extraer número
    const dayNum = trimmed.replace(/[^\d]/g, '');
    if (dayNum.length >= 1 && dayNum.length <= 2) {
      const n = parseInt(dayNum, 10);
      if (n >= 1 && n <= 31) return n;
    }

    return null;
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
      const startIdx = lines[0]?.match(/day|día|fecha|date|check|llegada|salida/i) ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map((c) => c.trim());
        if (cols.length < 3) continue;

        const day = parseDayFromColumn(cols[0]);
        const checkIns = parseInt(cols[1], 10);
        const checkOuts = parseInt(cols[2], 10);

        if (day !== null && day >= 1 && day <= totalDays && !isNaN(checkIns) && !isNaN(checkOuts)) {
          entries.push({ day, checkIns, checkOuts });
        }
      }

      if (entries.length === 0) {
        toast({
          title: "Error de formato",
          description: "No se pudieron parsear datos. Formato esperado: día/fecha, check-ins, check-outs (CSV, TSV o punto y coma).",
          variant: "destructive",
        });
        return;
      }
      setCsvPreview(entries);
    };
    reader.readAsText(file);
  };

  // T3-1: Excel (.xlsx/.xls) parser — dynamic import for code-splitting
  const handleExcelUpload = async (file: File) => {
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await loadXLSX();
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const entries: OccupancyEntry[] = [];
        // Skip header row if detected
        const startIdx = rows[0]?.some((c: any) => String(c).match(/day|día|fecha|date|check|llegada|salida/i)) ? 1 : 0;

        for (let i = startIdx; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3) continue;
          const day = parseDayFromColumn(String(row[0] ?? ''));
          const checkIns = parseInt(String(row[1] ?? ''), 10);
          const checkOuts = parseInt(String(row[2] ?? ''), 10);
          if (day !== null && day >= 1 && day <= totalDays && !isNaN(checkIns) && !isNaN(checkOuts)) {
            entries.push({ day, checkIns, checkOuts });
          }
        }

        if (entries.length === 0) {
          toast({ title: "Error de formato", description: "No se pudieron parsear datos del Excel. Formato: día, check-ins, check-outs.", variant: "destructive" });
          return;
        }
        setCsvPreview(entries);
      } catch {
        toast({ title: "Error al leer Excel", description: "El archivo no se pudo procesar. Verifica que sea un .xlsx válido.", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Unified file handler: CSV or Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      handleExcelUpload(file);
    } else {
      // Delegate to CSV handler (simulate change event)
      handleCSVUpload(e);
    }
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
                  CSV o Excel con 3 columnas: <code>día, check_ins, check_outs</code>
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos: .csv, .tsv, .xlsx, .xls
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
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
