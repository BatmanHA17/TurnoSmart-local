import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";

interface NotificationSettings {
  id: string;
  org_id: string;
  shift_notifications_enabled: boolean;
  notify_on_create: boolean;
  notify_on_update: boolean;
  notify_on_delete: boolean;
  enabled_at: string | null;
  enabled_by: string | null;
}

export default function NotificationsSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRoleCanonical();
  const isEmployee = role === "EMPLOYEE";
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirect if employee tries to access
  useEffect(() => {
    if (isEmployee) {
      navigate("/dashboard");
      toast.error("No tienes permisos para acceder a esta página");
    }
  }, [isEmployee, navigate]);

  // Load settings from database
  useEffect(() => {
    if (!user || isEmployee) return;
    loadSettings();
  }, [user, isEmployee]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Get user's primary org
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("primary_org_id")
        .eq("id", user!.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.primary_org_id) {
        toast.error("No se encontró organización primaria");
        setLoading(false);
        return;
      }

      // Get or create notification settings
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("org_id", profile.primary_org_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create default settings
        const { data: newSettings, error: insertError } = await supabase
          .from("notification_settings")
          .insert({
            org_id: profile.primary_org_id,
            shift_notifications_enabled: false,
            notify_on_create: true,
            notify_on_update: true,
            notify_on_delete: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from("notification_settings")
        .update({
          shift_notifications_enabled: enabled,
          [enabled ? "enabled_by" : "disabled_by"]: user!.id,
          [enabled ? "enabled_at" : "disabled_at"]: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast.success(enabled ? "✅ Notificaciones activadas" : "🔕 Notificaciones desactivadas");
      loadSettings();
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error("Error al actualizar configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotificationType = async (type: 'create' | 'update' | 'delete', enabled: boolean) => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const field = `notify_on_${type}`;
      const { error } = await supabase
        .from("notification_settings")
        .update({ [field]: enabled })
        .eq("id", settings.id);

      if (error) throw error;

      toast.success("Configuración actualizada");
      loadSettings();
    } catch (error: any) {
      console.error("Error updating notification type:", error);
      toast.error("Error al actualizar configuración");
    } finally {
      setSaving(false);
    }
  };

  if (isEmployee) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Main Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-muted-foreground" />
            <CardTitle>Notificaciones de Turnos por Email</CardTitle>
          </div>
          <CardDescription>
            Notifica automáticamente a los empleados cuando se creen, modifiquen o eliminen sus turnos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Alert */}
          {settings && (
            <Alert variant={settings.shift_notifications_enabled ? "default" : "destructive"}>
              <div className="flex items-start gap-3">
                {settings.shift_notifications_enabled ? (
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    {settings.shift_notifications_enabled ? (
                      <span className="font-medium">
                        ✅ Las notificaciones están <strong>ACTIVADAS</strong>. Los empleados recibirán emails cuando se modifiquen sus turnos.
                      </span>
                    ) : (
                      <span className="font-medium">
                        🔕 Las notificaciones están <strong>DESACTIVADAS</strong>. No se enviarán emails automáticos.
                      </span>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="notifications-enabled" className="text-base font-medium">
                Activar notificaciones automáticas
              </Label>
              <p className="text-sm text-muted-foreground">
                Enviar emails a los empleados cuando se modifiquen sus turnos
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings?.shift_notifications_enabled || false}
              onCheckedChange={handleToggleNotifications}
              disabled={saving || loading}
            />
          </div>

          {/* Notification Type Toggles */}
          {settings?.shift_notifications_enabled && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Tipos de notificación</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-create" className="text-sm font-medium">
                      🆕 Nuevos turnos
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Notificar cuando se asigne un nuevo turno
                    </p>
                  </div>
                  <Switch
                    id="notify-create"
                    checked={settings.notify_on_create}
                    onCheckedChange={(checked) => handleToggleNotificationType('create', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-update" className="text-sm font-medium">
                      ✏️ Turnos modificados
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Notificar cuando se modifique un turno existente
                    </p>
                  </div>
                  <Switch
                    id="notify-update"
                    checked={settings.notify_on_update}
                    onCheckedChange={(checked) => handleToggleNotificationType('update', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-delete" className="text-sm font-medium">
                      🗑️ Turnos cancelados
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Notificar cuando se elimine un turno
                    </p>
                  </div>
                  <Switch
                    id="notify-delete"
                    checked={settings.notify_on_delete}
                    onCheckedChange={(checked) => handleToggleNotificationType('delete', checked)}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Información importante
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Los emails se envían automáticamente en tiempo real</li>
              <li>Solo se notifica al empleado asignado al turno</li>
              <li>Requiere que los empleados tengan email configurado</li>
              <li>Puedes desactivar esta función en cualquier momento durante las pruebas</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Technical Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración técnica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Edge Function:</span>
            <code className="bg-muted px-2 py-1 rounded text-xs">notify-shift-change</code>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Proveedor de Email:</span>
            <span className="font-medium">Resend</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">From:</span>
            <code className="text-xs">noreply@turnosmart.app</code>
          </div>
          {settings?.enabled_at && (
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Activado:</span>
              <span className="text-xs">{new Date(settings.enabled_at).toLocaleString('es-ES')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
