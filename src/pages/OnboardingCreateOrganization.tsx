import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";

export default function OnboardingCreateOrganization() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [organizationName, setOrganizationName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("ES");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organizationName.trim()) {
      setError("El nombre de la organización es obligatorio");
      return;
    }

    if (!user) {
      setError("Usuario no autenticado");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('🏢 Creando organización:', organizationName.trim());
      
      // Call edge function to create organization
      const { data, error: functionError } = await supabase.functions.invoke('create-organization', {
        body: {
          name: organizationName.trim(),
          industry: industry || null,
          country: country
        }
      });

      if (functionError) {
        console.error('❌ Error en edge function:', functionError);
        if (functionError.message.includes('User already owns an organization')) {
          setError("Ya tienes una organización creada. Redirigiendo...");
          // If user already has an org, redirect to dashboard
          setTimeout(() => navigate('/dashboard-owner'), 1000);
          return;
        }
        setError('Error creando la organización. Inténtalo de nuevo.');
        return;
      }

      if (!data || !data.success) {
        console.error('❌ Respuesta inesperada:', data);
        setError('Error inesperado al crear la organización.');
        return;
      }

      console.log('✅ Organización creada exitosamente:', data.organization);
      
      toast({
        title: "¡Éxito!",
        description: `Organización "${data.organization.name}" creada exitosamente`,
      });
      
      // Refresh by getting current session
      console.log('🔄 Refrescando datos...');
      await supabase.auth.refreshSession();
      
      // Small delay to ensure session is refreshed
      setTimeout(() => {
        console.log('🎯 Redirigiendo a dashboard-owner');
        navigate('/dashboard-owner', { replace: true });
      }, 500);

    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <TurnoSmartLogo className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido a TurnoSmart</h1>
          <p className="text-gray-600 mt-2">Crea tu organización para comenzar</p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Crea tu organización</CardTitle>
            <CardDescription>
              Configura tu espacio de trabajo para gestionar turnos y equipos
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">
                  Nombre de la organización
                </Label>
                <Input
                  id="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="ej. Mi Hotel, Mi Restaurante"
                  className="h-11"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">
                  Sector (opcional)
                </Label>
                <Select value={industry} onValueChange={setIndustry} disabled={loading}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona tu sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospitality">Hostelería</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="healthcare">Sanidad</SelectItem>
                    <SelectItem value="manufacturing">Manufactura</SelectItem>
                    <SelectItem value="services">Servicios</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  País
                </Label>
                <Select value={country} onValueChange={setCountry} disabled={loading}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ES">España</SelectItem>
                    <SelectItem value="FR">Francia</SelectItem>
                    <SelectItem value="PT">Portugal</SelectItem>
                    <SelectItem value="IT">Italia</SelectItem>
                    <SelectItem value="DE">Alemania</SelectItem>
                    <SelectItem value="UK">Reino Unido</SelectItem>
                    <SelectItem value="US">Estados Unidos</SelectItem>
                    <SelectItem value="MX">México</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando organización...
                  </>
                ) : (
                  "Crear organización"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Al crear tu organización aceptas nuestros{" "}
          <a href="/terms" className="text-primary hover:underline">
            Términos de Servicio
          </a>{" "}
          y{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Política de Privacidad
          </a>
        </div>
      </div>
    </div>
  );
}