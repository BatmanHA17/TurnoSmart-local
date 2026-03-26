import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { esOverview } from '@/i18n/es-overview';

interface OverviewExportMenuProps {
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
}

export const OverviewExportMenu: React.FC<OverviewExportMenuProps> = ({ onExport }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    
    // Mostrar toast de inicio de descarga
    toast({
      title: esOverview.states.descargaIniciada,
      description: "Por favor, espere mientras se genera el archivo...",
    });

    try {
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Llamar a la función de exportación
      await onExport(format);
      
      // Mostrar toast de éxito
      toast({
        title: esOverview.states.descargaCompleta,
        description: `El archivo ${format.toUpperCase()} está listo para descargar.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error en la descarga",
        description: "Ha ocurrido un error al generar el archivo. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 px-4 border-border/50 bg-card hover:bg-muted/50 transition-colors"
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {esOverview.actions.exportarDatos}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-card border-border/50 shadow-lg"
      >
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 mr-2" />
          {esOverview.actions.csvFile}
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
          onClick={() => handleExport('excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {esOverview.actions.excelFile}
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 mr-2" />
          PDF File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};