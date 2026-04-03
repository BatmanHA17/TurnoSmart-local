import { Calendar, Users, Clock, Settings, BarChart3, FileText, HelpCircle, Home, Building, UserCheck, Zap, Moon, Shield, ArrowRight, CalendarDays, FileBarChart, CreditCard, Crown, Plus, RotateCcw, CalendarClock, UsersIcon, Activity, Send, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTurnoSmartRole } from "@/hooks/useTurnoSmartRole";

// Force rebuild - sidebar RBAC v2

// ── Items por nivel de acceso ──────────────────────────────────────

// V3 routes — simplified navigation

// Empleado: ve su horario y puede hacer peticiones
const empleadoNavItems = [
  { title: "Mi Horario", url: "/turnos", icon: Calendar },
  { title: "Mis Peticiones", url: "/peticiones", icon: Send },
];

// FOM/AFOM: gestión completa del cuadrante
const fomNavItems = [
  { title: "Turnos", url: "/turnos", icon: Calendar },
  { title: "Equipo", url: "/equipo", icon: Users },
  { title: "Peticiones", url: "/peticiones", icon: Send },
  { title: "Configuración", url: "/config", icon: Settings },
];

// Super-Admin: administración
const adminNavItems = [
  { title: "Admin", url: "/admin", icon: Crown },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { tsRole, canManage, isSuperAdmin } = useTurnoSmartRole();

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    return isActive(path)
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium"
      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground";
  };

  const SidebarSection = ({
    label,
    items
  }: {
    label: string;
    items: typeof empleadoNavItems;
  }) => {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="font-medium text-muted-foreground px-2 text-xs">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${getNavClass(item.url)}`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && (
                      <span className="font-medium truncate text-sm">
                        {item.title}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar
      className={`border-r border-border/40 ${collapsed ? "w-14" : "w-64"}`}
      collapsible="icon"
    >
      <SidebarContent className="gap-0">
        {/* Navigation */}
        <div className="flex-1 py-4">
          {/* Empleado: solo su horario y peticiones */}
          {!canManage && (
            <SidebarSection label="Mi Espacio" items={empleadoNavItems} />
          )}

          {/* FOM/Super-Admin: gestión completa */}
          {canManage && (
            <SidebarSection label="Gestión" items={fomNavItems} />
          )}

          {/* Super-Admin: panel de administración */}
          {isSuperAdmin && (
            <SidebarSection label="Administración" items={adminNavItems} />
          )}

          {/* Ayuda eliminada en V3 — funcionalidad se integra en el flujo */}
        </div>

        {/* User Info Section */}
        {!collapsed && (
          <div className="border-t border-border/40 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                <User className="w-3 h-3" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium">Hotel Cantaclaro</span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {tsRole === 'super_admin' ? 'Super Admin' : tsRole === 'fom' ? 'FOM' : 'Empleado'}
                </span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
