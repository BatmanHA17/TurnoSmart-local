/**
 * QuickCreateTeam — Creador Rápido de Equipo
 *
 * 3 modos:
 * Tab 1: "Creador Rápido" — molde (rol, equipo, contrato) + tabla de N nombres
 * Tab 2: "Importar archivo" — plantilla Excel descargable + upload CSV/XLSX
 * Tab 3: "Individual" — link al formulario existente
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Upload, UserPlus, Download, FileSpreadsheet, Loader2, Check, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "@/hooks/use-toast";

const loadXLSX = () => import("xlsx");

const TIPOS_CONTRATO = [
  "Contrato indefinido",
  "Contrato temporal",
  "Contrato en prácticas",
  "Contrato de formación",
  "Fijo discontinuo",
  "ETT",
];

const HORAS_COMUNES = [40, 37.5, 30, 20, 10, 8];

interface TeamRow {
  nombre: string;
  apellidos: string;
  email: string;
}

export function QuickCreateTeam() {
  const navigate = useNavigate();
  const { org } = useCurrentOrganization();
  const fileRef = useRef<HTMLInputElement>(null);

  // Molde state
  const [departamento, setDepartamento] = useState("");
  const [tipoContrato, setTipoContrato] = useState("Contrato indefinido");
  const [fechaInicio, setFechaInicio] = useState("");
  const [horasSemanales, setHorasSemanales] = useState(40);
  const [cantidad, setCantidad] = useState(4);

  // Team rows
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [showTable, setShowTable] = useState(false);

  // Import state
  const [importPreview, setImportPreview] = useState<TeamRow[] | null>(null);
  const [importFileName, setImportFileName] = useState("");

  // Loading
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Departments from DB
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  useState(() => {
    if (!org?.id) return;
    supabase
      .from("job_departments")
      .select("id, name")
      .eq("org_id", org.id)
      .order("name")
      .then(({ data }) => {
        if (data) setDepartments(data);
      });
  });

  // Generate empty rows
  const handleGenerateRows = () => {
    const newRows: TeamRow[] = Array.from({ length: cantidad }, () => ({
      nombre: "",
      apellidos: "",
      email: "",
    }));
    setRows(newRows);
    setShowTable(true);
  };

  const updateRow = (idx: number, field: keyof TeamRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  // Bulk save
  const handleBulkSave = async () => {
    const validRows = rows.filter((r) => r.nombre.trim() && r.email.trim());
    if (validRows.length === 0) {
      toast({ title: "Sin datos", description: "Rellena al menos nombre y email", variant: "destructive" });
      return;
    }
    if (!org?.id) return;

    setSaving(true);
    setSavedCount(0);

    let count = 0;
    for (const row of validRows) {
      try {
        const { error } = await supabase.from("colaboradores").insert({
          nombre: row.nombre.trim(),
          apellidos: row.apellidos.trim(),
          apellidos_uso: `${row.nombre.trim()} ${row.apellidos.trim().charAt(0)}.`.trim(),
          email: row.email.trim(),
          org_id: org.id,
          fecha_inicio_contrato: fechaInicio || null,
          tipo_contrato: tipoContrato,
          tiempo_trabajo_semanal: horasSemanales,
          status: "activo",
        });
        if (!error) {
          count++;
          setSavedCount(count);
        }
      } catch {
        // continue with next
      }
    }

    setSaving(false);

    if (count > 0) {
      toast({ title: `${count} colaboradores creados`, description: "Ahora puedes añadirlos al calendario." });
      navigate("/turnosmart/collaborators");
    } else {
      toast({ title: "Error", description: "No se pudo crear ningún colaborador", variant: "destructive" });
    }
  };

  // Download Excel template
  const handleDownloadTemplate = async () => {
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();

    const headers = ["Nombre", "Apellidos", "Email", "Horas semanales", "Tipo contrato", "Fecha inicio"];
    const examples = [
      ["Ana", "Martínez López", "ana@hotel.com", 40, "Contrato indefinido", "01/01/2024"],
      ["Carlos", "García Ruiz", "carlos@hotel.com", 40, "Contrato indefinido", "15/03/2024"],
      ["", "", "", "", "", ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);

    // Column widths
    ws["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 16 }, { wch: 22 }, { wch: 14 }];

    XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");

    const instructions = [
      ["INSTRUCCIONES — Plantilla de Colaboradores TurnoSmart"],
      [""],
      ["1. Rellena los campos Nombre, Apellidos y Email (obligatorios)"],
      ["2. Horas semanales: por defecto 40 si se deja vacío"],
      ["3. Tipo contrato: opciones válidas → Contrato indefinido, Contrato temporal, Contrato en prácticas, Contrato de formación, Fijo discontinuo, ETT"],
      ["4. Fecha inicio: formato dd/mm/aaaa"],
      ["5. Guarda el archivo y súbelo en TurnoSmart → Equipo → Creador Rápido → Importar archivo"],
      [""],
      ["Las primeras 2 filas de la hoja 'Colaboradores' son ejemplos. Bórralas antes de subir."],
    ];
    const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
    wsInstr["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

    XLSX.writeFile(wb, "TurnoSmart_Plantilla_Colaboradores.xlsx");
    toast({ title: "Plantilla descargada", description: "Rellénala y súbela en la pestaña 'Importar archivo'" });
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "xlsx" || ext === "xls") {
      const XLSX = await loadXLSX();
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          parseRows(jsonRows);
        } catch {
          toast({ title: "Error leyendo archivo", variant: "destructive" });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        const jsonRows = lines.map((l) => l.split(/[,;\t]/).map((c) => c.trim()));
        parseRows(jsonRows);
      };
      reader.readAsText(file);
    }
  };

  const parseRows = (jsonRows: any[][]) => {
    // Skip header
    const startIdx = jsonRows[0]?.some((c: any) => String(c).match(/nombre|name|apellido|email/i)) ? 1 : 0;
    const parsed: TeamRow[] = [];
    for (let i = startIdx; i < jsonRows.length; i++) {
      const row = jsonRows[i];
      if (!row || row.length < 2) continue;
      const nombre = String(row[0] ?? "").trim();
      const apellidos = String(row[1] ?? "").trim();
      const email = String(row[2] ?? "").trim();
      if (nombre) {
        parsed.push({ nombre, apellidos, email });
      }
    }
    if (parsed.length === 0) {
      toast({ title: "Sin datos válidos", description: "Verifica que el archivo tiene Nombre, Apellidos, Email", variant: "destructive" });
      return;
    }
    setImportPreview(parsed);
  };

  const handleImportSave = async () => {
    if (!importPreview || !org?.id) return;
    setSaving(true);
    setSavedCount(0);
    let count = 0;
    for (const row of importPreview) {
      try {
        const { error } = await supabase.from("colaboradores").insert({
          nombre: row.nombre,
          apellidos: row.apellidos,
          apellidos_uso: `${row.nombre} ${row.apellidos.charAt(0)}.`.trim(),
          email: row.email || `${row.nombre.toLowerCase().replace(/\s/g, ".")}@pendiente.com`,
          org_id: org.id,
          tipo_contrato: tipoContrato,
          tiempo_trabajo_semanal: horasSemanales,
          fecha_inicio_contrato: fechaInicio || null,
          status: "activo",
        });
        if (!error) {
          count++;
          setSavedCount(count);
        }
      } catch { /* continue */ }
    }
    setSaving(false);
    if (count > 0) {
      toast({ title: `${count} colaboradores importados` });
      navigate("/turnosmart/collaborators");
    }
  };

  const validQuickRows = rows.filter((r) => r.nombre.trim());

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/turnosmart/collaborators")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Creador Rápido de Equipo</h1>
          <p className="text-sm text-muted-foreground">Añade varios colaboradores a la vez</p>
        </div>
      </div>

      <Tabs defaultValue="quick" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Creador Rápido
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Importar archivo
          </TabsTrigger>
          <TabsTrigger value="individual" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Individual
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Creador Rápido ── */}
        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm font-medium">1. Define el molde del equipo</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {departments.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Equipo</Label>
                    <Select value={departamento} onValueChange={setDepartamento}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Departamento" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Tipo contrato</Label>
                  <Select value={tipoContrato} onValueChange={setTipoContrato}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_CONTRATO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha inicio</Label>
                  <Input type="date" className="h-9" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Horas/semana</Label>
                  <Select value={String(horasSemanales)} onValueChange={(v) => setHorasSemanales(Number(v))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HORAS_COMUNES.map((h) => <SelectItem key={h} value={String(h)}>{h}h</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cantidad</Label>
                  <Input type="number" min={1} max={50} className="h-9" value={cantidad} onChange={(e) => setCantidad(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))} />
                </div>
                <div className="flex items-end">
                  <Button size="sm" className="h-9 w-full" onClick={handleGenerateRows}>
                    Generar tabla
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {showTable && rows.length > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">2. Nombra al equipo ({rows.length} personas)</p>
                  {validQuickRows.length > 0 && (
                    <Badge variant="secondary">{validQuickRows.length} válidos</Badge>
                  )}
                </div>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 text-xs font-medium text-muted-foreground px-1">
                      <span>#</span><span>Nombre *</span><span>Apellidos *</span><span>Email *</span>
                    </div>
                    {rows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2">
                        <span className="text-xs text-muted-foreground pt-2 text-center">{idx + 1}</span>
                        <Input className="h-8 text-sm" placeholder="Nombre" value={row.nombre} onChange={(e) => updateRow(idx, "nombre", e.target.value)} />
                        <Input className="h-8 text-sm" placeholder="Apellidos" value={row.apellidos} onChange={(e) => updateRow(idx, "apellidos", e.target.value)} />
                        <Input className="h-8 text-sm" placeholder="email@hotel.com" value={row.email} onChange={(e) => updateRow(idx, "email", e.target.value)} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button onClick={handleBulkSave} disabled={saving || validQuickRows.length === 0} className="w-full gap-2">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creando {savedCount}/{validQuickRows.length}...</>
                  ) : (
                    <><Check className="h-4 w-4" /> Crear {validQuickRows.length} colaboradores</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB 2: Importar archivo ── */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Importar desde archivo</p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadTemplate}>
                  <Download className="h-3.5 w-3.5" /> Descargar plantilla Excel
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo contrato (para todos)</Label>
                  <Select value={tipoContrato} onValueChange={setTipoContrato}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_CONTRATO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Horas/semana (para todos)</Label>
                  <Select value={String(horasSemanales)} onValueChange={(v) => setHorasSemanales(Number(v))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HORAS_COMUNES.map((h) => <SelectItem key={h} value={String(h)}>{h}h</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha inicio (para todos)</Label>
                  <Input type="date" className="h-9" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                </div>
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Sube un archivo CSV o Excel con columnas: Nombre, Apellidos, Email</p>
                <input ref={fileRef} type="file" accept=".csv,.tsv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Seleccionar archivo
                </Button>
                {importFileName && <Badge variant="secondary" className="text-xs">{importFileName}</Badge>}
              </div>

              {importPreview && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">{importPreview.length} colaboradores detectados:</p>
                  <ScrollArea className="max-h-[250px]">
                    <div className="space-y-1">
                      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                        <span>Nombre</span><span>Apellidos</span><span>Email</span>
                      </div>
                      {importPreview.map((r, i) => (
                        <div key={i} className="grid grid-cols-3 gap-2 text-xs py-1">
                          <span>{r.nombre}</span><span>{r.apellidos}</span><span className="truncate">{r.email}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button onClick={handleImportSave} disabled={saving} className="w-full gap-2">
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Importando {savedCount}/{importPreview.length}...</>
                    ) : (
                      <><Check className="h-4 w-4" /> Importar {importPreview.length} colaboradores</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: Individual ── */}
        <TabsContent value="individual">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Formulario individual</p>
                <p className="text-sm text-muted-foreground">Para añadir un solo colaborador con todos los detalles</p>
              </div>
              <Button onClick={() => navigate("/turnosmart/collaborators/new")} className="gap-2">
                <UserPlus className="h-4 w-4" /> Añadir colaborador individual
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
