import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import AdminSettingsRoute from "@/components/AdminSettingsRoute";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { supabase } from "@/integrations/supabase/client";

export default function ContactSettings() {
  const { currentOrganization, currentOrg, refresh } = useOrganizationsUnified();
  const { permissions } = useAdminPermissions();
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cif, setCif] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar datos existentes de la organización
  useEffect(() => {
    document.title = "Información de la Cuenta | TurnoSmart";
    
    if (currentOrganization) {
      setCompanyName(currentOrganization.name || "");
      // Los campos de contacto pueden no existir aún en el tipo, así que usamos access condicional
      setContactEmail((currentOrganization as any).contact_email || "");
      setPhone((currentOrganization as any).phone || "");
      setAddress((currentOrganization as any).address || "");
      setCif((currentOrganization as any).cif || "");
      setEmail((currentOrganization as any).contact_email || "");
    }
  }, [currentOrganization]);

  const handleSave = async () => {
    if (!permissions.canEdit) {
      toast.error("No tienes permisos para editar esta información");
      return;
    }

    if (!currentOrg?.org_id) {
      toast.error("No se pudo identificar la organización");
      return;
    }

    setLoading(true);
    
    try {
      // Actualizar la tabla organizations
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          name: companyName,
          contact_email: contactEmail || email,
          phone: phone,
          address: address,
          cif: cif,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentOrg.org_id);

      if (orgError) {
        console.error('Error updating organization:', orgError);
        throw orgError;
      }

      // No es necesario actualizar establishments ya que organizations es la tabla principal

      // Refrescar datos
      await refresh();
      
      toast.success("Información de la cuenta guardada correctamente");
    } catch (error: any) {
      console.error('Error saving account information:', error);
      toast.error("Error al guardar la información: " + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminSettingsRoute allowView={true}>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Información de la Cuenta</h1>
          <p className="text-gray-600">
            Actualiza la información de contacto y detalles de tu cuenta
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* Información del establecimiento */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información del Establecimiento</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del establecimiento
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Hotel Ejemplo S.L."
                    disabled={!permissions.canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CIF/NIF
                  </label>
                  <Input
                    value={cif}
                    onChange={(e) => setCif(e.target.value)}
                    placeholder="B12345678"
                    disabled={!permissions.canEdit}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle Ejemplo, 123, 35001 Las Palmas de Gran Canaria"
                  rows={3}
                  disabled={!permissions.canEdit}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 928 000 000"
                    disabled={!permissions.canEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contacto
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@ejemplo.com"
                    disabled={!permissions.canEdit}
                  />
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleSave} 
                className="px-6" 
                disabled={!permissions.canEdit || loading}
              >
                {loading ? "Guardando..." : "Guardar información"}
              </Button>
              {!permissions.canEdit && (
                <p className="text-sm text-muted-foreground mt-2 ml-4">
                  Solo los administradores pueden modificar esta información
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </AdminSettingsRoute>
  );
}