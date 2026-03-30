import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  FileSignature,
  Receipt,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/hooks/useNotifications";

function getTypeIcon(type: string) {
  switch (type) {
    case "shift_published":
      return <CalendarCheck className="h-4 w-4 text-blue-500 shrink-0" />;
    case "absence_approved":
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    case "absence_rejected":
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    case "doc_signature_request":
      return <FileSignature className="h-4 w-4 text-purple-500 shrink-0" />;
    case "nomina_sent":
      return <Receipt className="h-4 w-4 text-orange-500 shrink-0" />;
    default:
      return <Bell className="h-4 w-4 text-gray-400 shrink-0" />;
  }
}

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onClose: () => void;
}

function NotificationsList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationsListProps) {
  const navigate = useNavigate();

  const handleItemClick = async (notification: Notification) => {
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      onClose();
      navigate(notification.action_url);
    }
  };

  return (
    <div className="flex flex-col w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-sm text-gray-900">Notificaciones</span>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Marcar todo como leído
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Bell className="h-8 w-8 mb-2 opacity-40" />
            <span className="text-sm">No tienes notificaciones</span>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleItemClick(notification)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                !notification.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
              }`}
            >
              <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                    {notification.body}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              {!notification.read && (
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 text-white/70 hover:text-white hover:bg-white/5"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="p-0 w-80">
        <NotificationsList
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
