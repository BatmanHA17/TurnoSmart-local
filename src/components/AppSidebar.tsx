import { Calendar, Users, Clock, Settings, BarChart3, FileText, HelpCircle, Home, Building, UserCheck, Zap, Moon, Shield, ArrowRight, CalendarDays, FileBarChart, CreditCard, Crown, Plus, RotateCcw, CalendarClock, UsersIcon, Activity } from "lucide-react";
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
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";

// Force rebuild - sidebar for admin access only

const secondaryNavItems = [
  { title: "Cuadrante", url: "/cuadrante", icon: Calendar },
];

const configNavItems = [
  { title: "Configuration Hub (Legacy)", url: "/configuracion-legacy", icon: Settings },
  { title: "Horarios Guardados", url: "/turnos/guardados", icon: RotateCcw },
  { title: "Old-Turnosmart.app", url: "/old-turnosmart", icon: Calendar },
];

const adminNavItems = [
  { title: "Panel de Super Admin", url: "/perfil-admin", icon: Crown },
  { title: "Actividad", url: "/activity", icon: Activity },
];

const helpNavItems = [
  { title: "Centro de Ayuda", url: "/ayuda", icon: HelpCircle },
  { title: "Preguntas Frecuentes", url: "/faq", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { isOwner } = useUserRoleCanonical();

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
    items: typeof secondaryNavItems; 
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
          <SidebarSection label="Gestión" items={secondaryNavItems} />
          <SidebarSection label="Configuración" items={configNavItems} />
          {isOwner && <SidebarSection label="Administración" items={adminNavItems} />}
          <SidebarSection label="Ayuda" items={helpNavItems} />
        </div>

        {/* User Info Section */}
        {!collapsed && (
          <div className="border-t border-border/40 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                <Users className="w-3 h-3" />
              </div>
              <span>Hotel Cantaclaro</span>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}