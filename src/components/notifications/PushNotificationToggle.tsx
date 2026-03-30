import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationToggle() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  // Browser does not support Web Push
  if (!isSupported) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
        <BellOff className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Las notificaciones push no están disponibles en este navegador.
        </p>
      </div>
    );
  }

  // User explicitly blocked notifications
  if (permission === "denied") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/40 bg-destructive/5">
        <BellOff className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-destructive">Notificaciones bloqueadas</p>
          <p className="text-xs text-muted-foreground mt-1">
            Habilítalas en la configuración del navegador para este sitio y recarga la página.
          </p>
        </div>
      </div>
    );
  }

  // Subscribed — show active toggle with deactivate option
  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <BellRing className="h-5 w-5 text-primary shrink-0" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                Notificaciones push activadas
              </p>
              <Badge variant="default" className="text-xs">Activo</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Recibirás avisos de turnos aunque la app esté cerrada
            </p>
          </div>
        </div>
        <Switch
          checked={true}
          onCheckedChange={() => unsubscribe()}
          disabled={isLoading}
          aria-label="Desactivar notificaciones push"
        />
      </div>
    );
  }

  // Not subscribed yet (permission default or granted but not subscribed)
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Notificaciones push
          </p>
          <p className="text-xs text-muted-foreground">
            Recibe avisos de turnos directamente en el navegador
          </p>
        </div>
      </div>
      {permission === "granted" ? (
        <Switch
          checked={false}
          onCheckedChange={() => subscribe()}
          disabled={isLoading}
          aria-label="Activar notificaciones push"
        />
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={subscribe}
          disabled={isLoading}
          className="shrink-0"
        >
          <Bell className="h-4 w-4 mr-2" />
          {isLoading ? "Activando..." : "Activar"}
        </Button>
      )}
    </div>
  );
}
