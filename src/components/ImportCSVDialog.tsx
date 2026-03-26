import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, AlertCircle, CalendarIcon, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ImportCSVDialogProps {
  onImport: (csvData: string, metadata: {
    fileName: string;
    cuadranteName: string;
    month: string;
    year: number;
    status: 'draft' | 'published' | 'archived';
  }) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportCSVDialog: React.FC<ImportCSVDialogProps> = ({
  onImport,
  isOpen,
  onOpenChange,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cuadranteName, setCuadranteName] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Formato incorrecto",
        description: "Por favor selecciona un archivo CSV válido",
        variant: "destructive"
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !cuadranteName || !selectedMonth || !selectedYear) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target?.result as string;
        
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const metadata = {
          fileName: file.name,
          cuadranteName,
          month: selectedMonth,
          year: parseInt(selectedYear),
          status
        };
        
        onImport(csvData, metadata);
        
        // Reset form
        setFile(null);
        setCuadranteName('');
        setSelectedMonth('');
        setSelectedYear('');
        setStatus('draft');
        onOpenChange(false);
        
        toast({
          title: "CSV importado exitosamente",
          description: `El cuadrante "${cuadranteName}" ha sido creado correctamente`,
        });
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Error al importar",
        description: "Hubo un problema al procesar el archivo CSV",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Cuadrante desde CSV
          </DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con los datos del cuadrante para crear o actualizar automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : file
                ? 'border-green-300 bg-green-50'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-green-600" />
                <p className="font-medium text-green-800">{file.name}</p>
                <p className="text-sm text-green-600">
                  Archivo listo para importar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    Arrastra tu archivo CSV aquí
                  </p>
                  <p className="text-sm text-muted-foreground">
                    o haz clic para seleccionar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="cursor-pointer"
            />
          </div>

          {/* Cuadrante Name Input */}
          <div className="space-y-2">
            <Label htmlFor="cuadrante-name">Nombre del Cuadrante *</Label>
            <Input
              id="cuadrante-name"
              value={cuadranteName}
              onChange={(e) => setCuadranteName(e.target.value)}
              placeholder="Ej: Cuadrante Enero 2024"
              className="w-full"
            />
          </div>

          {/* Estado del Cuadrante */}
          <div className="space-y-2">
            <Label htmlFor="status">Estado del Cuadrante *</Label>
            <Select value={status} onValueChange={(value: 'draft' | 'published' | 'archived') => setStatus(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period Selection */}
          <div className="space-y-2">
            <Label>Período (Mes y Año) *</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="month" className="text-sm text-muted-foreground">Mes</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enero">Enero</SelectItem>
                    <SelectItem value="Febrero">Febrero</SelectItem>
                    <SelectItem value="Marzo">Marzo</SelectItem>
                    <SelectItem value="Abril">Abril</SelectItem>
                    <SelectItem value="Mayo">Mayo</SelectItem>
                    <SelectItem value="Junio">Junio</SelectItem>
                    <SelectItem value="Julio">Julio</SelectItem>
                    <SelectItem value="Agosto">Agosto</SelectItem>
                    <SelectItem value="Septiembre">Septiembre</SelectItem>
                    <SelectItem value="Octubre">Octubre</SelectItem>
                    <SelectItem value="Noviembre">Noviembre</SelectItem>
                    <SelectItem value="Diciembre">Diciembre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="year" className="text-sm text-muted-foreground">Año</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => {
                      const year = 2011 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Information Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato esperado:</strong> El CSV debe contener las columnas de empleados, 
              días del mes y códigos de estado (X, L, V, E, etc.) según el formato estándar de TurnoSmart.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || !cuadranteName || !selectedMonth || !selectedYear || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};