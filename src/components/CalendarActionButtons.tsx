import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Printer, Maximize2, Download, FileText, Table, Image } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CalendarActionButtonsProps {
  onPrint: () => void;
  onFullScreen: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportImage: () => void;
}

export function CalendarActionButtons({
  onPrint,
  onFullScreen,
  onExportPDF,
  onExportExcel,
  onExportImage
}: CalendarActionButtonsProps) {

  const handlePrint = () => {
    onPrint();
    toast({ 
      title: "Imprimiendo calendario", 
      description: "Preparando la versión para imprimir..." 
    });
  };

  const handleFullScreen = () => {
    onFullScreen();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Botón de Imprimir */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="gap-2"
      >
        <Printer className="w-4 h-4" />
        Imprimir
      </Button>

      {/* Botón de Pantalla Completa */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleFullScreen}
        className="gap-2"
      >
        <Maximize2 className="w-4 h-4" />
        Pantalla Completa
      </Button>

      {/* Dropdown de Exportar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48"
          style={{ 
            backgroundColor: 'rgb(255, 255, 255)',
            color: 'rgb(0, 0, 0)',
            zIndex: 9999,
            opacity: 1
          }}
        >
          <DropdownMenuItem onClick={onExportPDF} className="gap-2">
            <FileText className="w-4 h-4" />
            Exportar como PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportExcel} className="gap-2">
            <Table className="w-4 h-4" />
            Exportar a Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportImage} className="gap-2">
            <Image className="w-4 h-4" />
            Descargar imagen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}