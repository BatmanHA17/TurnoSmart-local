import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, User, Settings, Shield, Eye, EyeOff } from "lucide-react";

export const UserProfile = () => {
  const { profile, loading, refresh } = useUserProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || ""
  });

  // Estados para las preferencias
  const [emailScheduleAlerts, setEmailScheduleAlerts] = useState(true);
  const [emailWeekSchedule, setEmailWeekSchedule] = useState(true);
  const [emailPersonalInfo, setEmailPersonalInfo] = useState(false);
  const [emailDPAEStatus, setEmailDPAEStatus] = useState(false);
  const [calendarSync, setCalendarSync] = useState(false);
  const [language, setLanguage] = useState("Español");

  // Estados para la gestión de contraseña
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Sincronizar formData cuando el perfil se actualiza
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || ""
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name || null,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Error al actualizar el perfil');
        return;
      }

      toast.success('Perfil actualizado correctamente');
      refresh();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al actualizar el perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetPassword = async () => {
    if (!profile?.email) return;

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsSettingPassword(true);
    try {
      const { error } = await supabase.functions.invoke('set-user-password', {
        body: { 
          email: profile.email, 
          password: newPassword 
        }
      });

      if (error) {
        console.error('Error setting password:', error);
        toast.error('Error al establecer la contraseña');
        return;
      }

      toast.success('Contraseña establecida correctamente');
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al establecer la contraseña');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const hasChanges = () => {
    return (
      formData.display_name !== (profile?.display_name || "") ||
      formData.first_name !== (profile?.first_name || "") ||
      formData.last_name !== (profile?.last_name || "")
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasChanges() && !isUpdating) {
      handleSave();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 md:h-6 md:w-6" />
        <h1 className="text-xl md:text-2xl font-bold">Mi Perfil</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tu información personal. Los datos críticos como el email no pueden modificarse.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Email" className="opacity-75">
              <Input
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El email no puede modificarse ya que se usa para el acceso a la aplicación
              </p>
            </FormField>

            <FormField label="Nombre de Usuario">
              <Input
                value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ingresa tu nombre de usuario"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este es el nombre que aparecerá en la aplicación
              </p>
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nombre">
                <Input
                  value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tu nombre"
                />
              </FormField>

              <FormField label="Apellidos">
                <Input
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tus apellidos"
                />
              </FormField>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={!hasChanges() || isUpdating}
                className="flex items-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Cuenta</CardTitle>
            <CardDescription>
              Detalles sobre tu cuenta y acceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID de Usuario</label>
                <p className="text-sm font-mono bg-muted p-2 rounded mt-1 break-all">
                  {profile?.id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Estado de la Cuenta</label>
                <p className="text-sm text-green-600 font-medium mt-1">
                  Activa
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Seguridad */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle className="text-xl font-semibold">Seguridad</CardTitle>
            </div>
            <CardDescription>
              Gestiona tu contraseña y configuraciones de seguridad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-medium text-foreground">Contraseña</h3>
              
              <div className="space-y-4">
                <FormField label="Nueva Contraseña">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ingresa una nueva contraseña"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    La contraseña debe tener al menos 8 caracteres
                  </p>
                </FormField>

                <FormField label="Confirmar Contraseña">
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirma tu nueva contraseña"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormField>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSetPassword}
                    disabled={!newPassword || !confirmPassword || isSettingPassword}
                    className="flex items-center gap-2"
                  >
                    {isSettingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                    {isSettingPassword ? 'Estableciendo...' : 'Establecer Contraseña'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Preferencias */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle className="text-xl font-semibold">Preferencias</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Notificaciones */}
            <div className="space-y-6">
              <h3 className="text-base font-medium text-foreground">Notificaciones</h3>
              
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Alertarme por correo electrónico sobre mi futuro horario, solicitudes de ausencia, recordatorios de seguimiento de empleados y nuevos mensajes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Las alertas sobre el seguimiento de los empleados se refieren al fin de períodos de prueba, los permisos de residencia y el final de las ventanillas múltiples.
                    </p>
                  </div>
                  <Switch
                    checked={emailScheduleAlerts}
                    onCheckedChange={setEmailScheduleAlerts}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Alertarme por correo electrónico si los horarios de las próximas dos semanas no se publican
                    </p>
                  </div>
                  <Switch
                    checked={emailWeekSchedule}
                    onCheckedChange={setEmailWeekSchedule}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Alertarme por correo electrónico si la información personal de un empleado se actualiza
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recibirás un correo electrónico con los datos personales del empleado que han sido modificados (nombre, apellidos, dirección, cuenta bancaria, número de seguridad social, etc.).
                    </p>
                  </div>
                  <Switch
                    checked={emailPersonalInfo}
                    onCheckedChange={setEmailPersonalInfo}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Alertarme por correo electrónico sobre el estado de las DPAE que realizo en TurnoSmart
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Las alertas te informan sobre las DPAE realizadas con éxito o fallidas.
                    </p>
                  </div>
                  <Switch
                    checked={emailDPAEStatus}
                    onCheckedChange={setEmailDPAEStatus}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Sincronización del calendario */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-foreground">Sincronización del calendario</h3>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Sincroniza tu agenda con tu aplicación de calendario favorita
                  </p>
                </div>
                <Switch
                  checked={calendarSync}
                  onCheckedChange={setCalendarSync}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Idioma */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-foreground">Idioma</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Idioma de su cuenta
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Español">Español</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Français">Français</SelectItem>
                    <SelectItem value="Português">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};