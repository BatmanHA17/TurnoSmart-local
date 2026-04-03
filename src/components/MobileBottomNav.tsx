import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, Inbox, Send, MessageSquare, User } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useAuth } from "@/hooks/useAuth";

interface NavTab {
  label: string;
  icon: React.ElementType;
  path: string;
  matchPrefix?: string;
}

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { role } = useUserRoleCanonical();

  if (!user) return null;

  const isManager = role === "OWNER" || role === "ADMIN" || role === "MANAGER" || role === "DIRECTOR";

  // V3: simplified mobile nav (4 tabs, no messaging)
  const tabs: NavTab[] = [
    {
      label: "Inicio",
      icon: Home,
      path: "/dashboard",
      matchPrefix: "/dashboard",
    },
    {
      label: "Turnos",
      icon: Calendar,
      path: "/turnos",
      matchPrefix: "/turnos",
    },
    {
      label: "Peticiones",
      icon: Send,
      path: "/peticiones",
      matchPrefix: "/peticiones",
    },
    {
      label: "Perfil",
      icon: User,
      path: "/perfil",
      matchPrefix: "/perfil",
    },
  ];

  const isActive = (tab: NavTab) => {
    const p = location.pathname;
    if (tab.matchPrefix === "/dashboard") {
      return p === "/" || p === "/dashboard" || p.startsWith("/mi-actividad");
    }
    if (tab.matchPrefix) {
      return p.startsWith(tab.matchPrefix);
    }
    return p === tab.path;
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          const showBadge =
            (tab.matchPrefix === "/turnosmart/mensajes" && unreadCount > 0);

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] relative transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={tab.label}
            >
              <span className="relative">
                <Icon
                  className={`h-5 w-5 ${active ? "stroke-[2.5px]" : "stroke-[1.5px]"}`}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] leading-none font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
