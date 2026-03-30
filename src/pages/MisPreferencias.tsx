import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { Copy, ChevronRight, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";

export default function MisPreferencias() {
  const { isAdmin } = useUserRoleCanonical();
  
  // Notification preferences (Admin only)
  const [emailSchedule, setEmailSchedule] = useState(true);
  const [emailUpcomingSchedules, setEmailUpcomingSchedules] = useState(true);
  const [emailPersonalInfo, setEmailPersonalInfo] = useState(false);
  const [emailDPAE, setEmailDPAE] = useState(false);
  
  // Calendar sync
  const [calendarSync, setCalendarSync] = useState(false);
  
  // Language
  const [language, setLanguage] = useState("es");

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Page Title */}
        <h1 className="text-4xl font-bold mb-8 text-foreground">Preferencias</h1>

        {/* Notifications Section - Admin Only */}
        {isAdmin && (
          <Card className="p-6 mb-4 rounded-xl border border-border">
            <h2 className="text-xl font-semibold mb-6 text-foreground">
              Notificaciones
            </h2>
            
            <div className="space-y-6">
              {/* Notification 1 */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Alertarme por correo electrónico sobre mi futuro horario, solicitudes de ausencia, recordatorios de seguimiento de empleados y nuevos mensajes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Las alertas sobre el seguimiento de los empleados se refieren al fin del período de prueba, los permisos de residencia o la finalización de las visitas médicas
                  </p>
                </div>
                <Switch
                  checked={emailSchedule}
                  onCheckedChange={setEmailSchedule}
                  className="shrink-0"
                />
              </div>

              {/* Notification 2 */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Alertarme por correo electrónico si los horarios de las próximas dos semanas no se publican
                  </p>
                </div>
                <Switch
                  checked={emailUpcomingSchedules}
                  onCheckedChange={setEmailUpcomingSchedules}
                  className="shrink-0"
                />
              </div>

              {/* Notification 3 */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Alertarme por correo electrónico si la información personal de un empleado se actualiza
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recibirá un correo electrónico con los datos personales del empleado que han sido modificados (nombre, apellidos, dirección, cuenta bancaria, número de seguridad social, etc.)
                  </p>
                </div>
                <Switch
                  checked={emailPersonalInfo}
                  onCheckedChange={setEmailPersonalInfo}
                  className="shrink-0"
                />
              </div>

              {/* Notification 4 */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Alertarme por correo electrónico sobre el estado de las DPAE que realizo en Combo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Las alertas le informan sobre las DPAE realizadas con éxito o fallidas.
                  </p>
                </div>
                <Switch
                  checked={emailDPAE}
                  onCheckedChange={setEmailDPAE}
                  className="shrink-0"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Push Notifications — visible to all roles */}
        <Card className="p-6 mb-4 rounded-xl border border-border">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Notificaciones push
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Recibe avisos de turnos y cambios directamente en este navegador, incluso con la app cerrada.
          </p>
          <PushNotificationToggle />
        </Card>

        {/* Calendar Sync Section */}
        <Card className="p-6 mb-4 rounded-xl border border-border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 text-foreground">
                Sincronización del calendario
              </h2>
              <p className="text-sm text-muted-foreground">
                Sincroniza tu agenda con tu aplicación de calendario favorita
              </p>
            </div>
            <Switch
              checked={calendarSync}
              onCheckedChange={setCalendarSync}
              className="ml-4 shrink-0"
            />
          </div>

          {/* Expanded Content When Toggle is Active */}
          {calendarSync && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-foreground">
                Copie la siguiente URL en su aplicación de calendario personal para visualizar sus turnos.
              </p>

              {/* URL Input with Copy Button */}
              <div className="flex gap-2">
                <Input
                  value="https://api.snapshift.co/api/v2/planning/public_calendar_feeds/11db2f6c-579f-4"
                  readOnly
                  className="flex-1 bg-muted/30 border-border text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 px-4"
                  onClick={() => {
                    navigator.clipboard.writeText("https://api.snapshift.co/api/v2/planning/public_calendar_feeds/11db2f6c-579f-4");
                    toast.success("URL copiada al portapapeles");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>

              {/* Calendar Options */}
              <div className="space-y-2 pt-2">
                {/* Google Calendar */}
                <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Google Calendar</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                {/* Apple Calendar */}
                <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-red-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Apple Calendar</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>

                {/* Outlook Calendar */}
                <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Outlook Calendar</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Language Section */}
        <Card className="p-6 rounded-xl border border-border">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              Idioma
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Idioma de su cuenta
            </p>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Selecciona un idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}