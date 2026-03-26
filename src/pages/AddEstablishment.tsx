import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Info, MapPin, Scale } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";

export default function AddEstablishment() {
  const navigate = useNavigate();
  const { refresh } = useOrganizationsUnified();
  
  // Form state
  const [establishmentName, setEstablishmentName] = useState("");
  const [companyNameEst, setCompanyNameEst] = useState("");
  const [cifCode, setCifCode] = useState("");
  const [establishmentAddress, setEstablishmentAddress] = useState("");
  const [establishmentPostalCode, setEstablishmentPostalCode] = useState("");
  const [establishmentCity, setEstablishmentCity] = useState("");
  const [establishmentCountry, setEstablishmentCountry] = useState("españa");
  const [isFranchise, setIsFranchise] = useState(false);
  const [healthServiceCode, setHealthServiceCode] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveEstablishment = async () => {
    if (!establishmentName.trim()) {
      toast.error("El nombre del establecimiento es obligatorio");
      return;
    }

    try {
      setSaving(true);

      // El SDK de Supabase pasa automáticamente el token cuando el usuario está autenticado
      const { data, error } = await supabase.functions.invoke('create-organization', {
        body: {
          name: establishmentName.trim(),
          country: establishmentCountry || 'ES',
          industry: 'hospitality'
        }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }
      
      if (!data?.success) {
        const errorMsg = data?.error || 'Error al crear la organización';
        console.error('Edge function returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      // Actualizar campos adicionales de la organización
      if (data.organization?.id) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            establishment_address: establishmentAddress || null,
            postal_code: establishmentPostalCode || null,
            city: establishmentCity || null,
            cif: cifCode || null,
            is_franchise: isFranchise,
            health_service_code: healthServiceCode || null,
          })
          .eq('id', data.organization.id);

        if (updateError) {
          console.error('Error updating organization details:', updateError);
        }
      }

      // Refrescar la lista de organizaciones
      await refresh();

      toast.success("Establecimiento creado correctamente");
      navigate("/settings/locations");
    } catch (error: any) {
      console.error('Error creating establishment:', error);
      toast.error(error.message || "Error al crear el establecimiento");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/settings/locations");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-8">
          {/* Breadcrumb and Back Button */}
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500">Establecimientos</span>
            <span className="text-sm text-gray-400">/</span>
            <span className="text-sm text-gray-900">Añadir establecimiento</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Añadir un establecimiento</h1>
          </div>
          
          <div className="space-y-6">
            {/* Information Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900">Información de facturación del establecimiento</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Tu nuevo establecimiento será facturado a partir del próximo período de facturación. <button className="text-blue-600 underline">Más información</button>
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white border rounded-lg p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del establecimiento *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Indique su nombre de establecimiento sin incluir las entidades afiliadas, etc.
                  </p>
                  <Input
                    value={establishmentName}
                    onChange={(e) => setEstablishmentName(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la empresa
                  </label>
                  <Input
                    value={companyNameEst}
                    onChange={(e) => setCompanyNameEst(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CIF (Código de Identificación Fiscal)
                  </label>
                  <Input
                    value={cifCode}
                    onChange={(e) => setCifCode(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo del establecimiento
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="text-gray-400 text-sm">
                      Añadir una imagen
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Formatos aceptados: JPEG, PNG
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-white border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">Dirección del establecimiento</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <Input
                    value={establishmentAddress}
                    onChange={(e) => setEstablishmentAddress(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código postal
                    </label>
                    <Input
                      value={establishmentPostalCode}
                      onChange={(e) => setEstablishmentPostalCode(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <Input
                      value={establishmentCity}
                      onChange={(e) => setEstablishmentCity(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <Select value={establishmentCountry} onValueChange={setEstablishmentCountry}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar un país..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="españa">España</SelectItem>
                      <SelectItem value="francia">Francia</SelectItem>
                      <SelectItem value="reino-unido">Reino Unido</SelectItem>
                      <SelectItem value="alemania">Alemania</SelectItem>
                      <SelectItem value="italia">Italia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Franchise Toggle */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Este establecimiento es una franquicia
                </span>
                <Switch
                  checked={isFranchise}
                  onCheckedChange={setIsFranchise}
                />
              </div>
            </div>

            {/* Legal Information */}
            <div className="bg-white border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">Informaciones jurídicas</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código del Servicio de Salud en el Trabajo
                </label>
                <Input
                  value={healthServiceCode}
                  onChange={(e) => setHealthServiceCode(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline"
                onClick={handleCancel}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEstablishment}
                disabled={saving}
                className="bg-teal-700 hover:bg-teal-800 text-white rounded-full"
              >
                {saving ? "Guardando..." : "Guardar y continuar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}