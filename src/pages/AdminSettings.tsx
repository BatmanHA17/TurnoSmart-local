import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminSettings() {
  const [emailConfirm, setEmailConfirm] = useState(true);
  const [notifyOnUserCreate, setNotifyOnUserCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Configuración | TurnoSmart Admin";
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      toast.error("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-2">
            Configuración del sistema y preferencias de administración
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Autenticación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="emailConfirm" className="text-sm font-medium">
                    Requerir confirmación de email
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Los nuevos usuarios deben verificar su email antes de acceder
                  </p>
                </div>
                <Switch 
                  id="emailConfirm" 
                  checked={emailConfirm} 
                  onCheckedChange={setEmailConfirm}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifyOnUserCreate" className="text-sm font-medium">
                    Notificar al crear usuarios
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar notificación cuando se cree un nuevo usuario
                  </p>
                </div>
                <Switch 
                  id="notifyOnUserCreate" 
                  checked={notifyOnUserCreate} 
                  onCheckedChange={setNotifyOnUserCreate}
                />
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p><strong>Estado:</strong> <span className="text-green-600">Operativo</span></p>
                <p><strong>Versión:</strong> 1.0.0</p>
                <p><strong>Base de datos:</strong> Conectada</p>
                <p><strong>Usuarios activos:</strong> {/* TODO: obtener número real */}--</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}