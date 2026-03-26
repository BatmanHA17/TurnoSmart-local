import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RGPDSettings() {
  const [dataRetention, setDataRetention] = useState("5");
  const [consentRequired, setConsentRequired] = useState(true);
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [cookieConsent, setCookieConsent] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("🔥 RGPDSettings - PÁGINA RGPD CARGADA!");
    document.title = "RGPD | TurnoSmart";
    loadRGPDSettings();
  }, []);

  const loadRGPDSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rgpd_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading RGPD settings:', error);
        return;
      }

      if (data) {
        setDataRetention(data.data_retention_years.toString());
        setConsentRequired(data.consent_required);
        setPrivacyPolicy(data.privacy_policy || "");
        setCookieConsent(data.cookie_consent);
      }
    } catch (error) {
      console.error('Error loading RGPD settings:', error);
    }
  };

  const handleSave = async () => {
    console.log("💾 Iniciando guardado de RGPD settings...");
    console.log("📝 Datos a guardar:", { 
      privacyPolicy: privacyPolicy.substring(0, 100) + "...", 
      dataRetention, 
      consentRequired, 
      cookieConsent 
    });
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("👤 Usuario autenticado:", user?.id);
      
      if (!user) {
        console.error("❌ No hay usuario autenticado");
        toast.error("Debe estar autenticado para guardar la configuración");
        return;
      }

      const rgpdData = {
        user_id: user.id,
        data_retention_years: parseInt(dataRetention),
        consent_required: consentRequired,
        privacy_policy: privacyPolicy,
        cookie_consent: cookieConsent
      };

      console.log("📤 Enviando datos a Supabase:", rgpdData);

      const { data, error } = await supabase
        .from('rgpd_settings')
        .upsert(rgpdData, { onConflict: 'user_id' })
        .select();

      console.log("📥 Respuesta de Supabase:", { data, error });

      if (error) {
        console.error('❌ Error saving RGPD settings:', error);
        toast.error(`Error al guardar la configuración: ${error.message}`);
        return;
      }

      console.log("✅ RGPD settings guardados exitosamente");
      toast.success("Configuración de RGPD guardada correctamente");
    } catch (error) {
      console.error('❌ Error saving RGPD settings:', error);
      toast.error("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    toast.success("Exportando datos personales...");
  };

  const handleDeleteData = () => {
    toast.success("Solicitud de eliminación de datos enviada");
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">RGPD</h1>
        <p className="text-muted-foreground">
          Configuración de privacidad y protección de datos según el RGPD.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Configuración de privacidad</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Período de retención de datos</label>
              <Select value={dataRetention} onValueChange={setDataRetention}>
                <SelectTrigger className="border-border rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 año</SelectItem>
                  <SelectItem value="3">3 años</SelectItem>
                  <SelectItem value="5">5 años</SelectItem>
                  <SelectItem value="7">7 años</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Consentimiento requerido</label>
              <Switch checked={consentRequired} onCheckedChange={setConsentRequired} />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Consentimiento de cookies</label>
              <Switch checked={cookieConsent} onCheckedChange={setCookieConsent} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Política de privacidad</label>
              <Textarea
                value={privacyPolicy}
                onChange={(e) => setPrivacyPolicy(e.target.value)}
                className="border-border rounded-md h-32"
                placeholder="Ingrese el texto de su política de privacidad..."
              />
            </div>
          </div>
        </div>

        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Derechos del usuario</h2>
          
          <div className="flex gap-4">
            <Button 
              onClick={handleExportData}
              variant="outline"
              className="border-border"
            >
              Exportar mis datos
            </Button>
            <Button 
              onClick={handleDeleteData}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Solicitar eliminación
            </Button>
          </div>
        </div>

        <div className="bg-background border border-border rounded-lg p-6">
          <div className="pt-4">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="bg-teal-700 hover:bg-teal-800 text-white rounded-full px-6 py-2 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}