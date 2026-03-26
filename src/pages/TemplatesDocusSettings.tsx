import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Download } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesDocusSettings() {
  const [templates] = useState([
    { id: 1, name: "Contrato de trabajo", type: "PDF", lastModified: "2024-01-15", description: "Plantilla estándar para contratos laborales" },
    { id: 2, name: "Solicitud de vacaciones", type: "DOC", lastModified: "2024-01-10", description: "Formulario para solicitar días de vacaciones" },
    { id: 3, name: "Nómina mensual", type: "XLSX", lastModified: "2024-01-05", description: "Plantilla para generar nóminas mensuales" }
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    document.title = "Plantillas de Documentos | TurnoSmart";
  }, []);

  const handleUpload = () => {
    toast.success("Función de subida de plantillas en desarrollo");
  };

  const handleDownload = (templateName: string) => {
    toast.success(`Descargando plantilla: ${templateName}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Plantillas de Documentos</h1>
            <p className="text-gray-600">
              Gestiona las plantillas de documentos para contratos, nóminas y reportes
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Subir plantilla
          </Button>
        </div>

        <div className="space-y-6">
          {/* Plantillas predefinidas */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Plantillas Predefinidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(template.name)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plantillas personalizadas */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Plantillas Personalizadas</h2>
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No hay plantillas personalizadas</p>
                <p className="text-sm">Sube tu primera plantilla personalizada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}