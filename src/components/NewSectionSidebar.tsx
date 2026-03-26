import { useState } from "react";
import { Home, FileSpreadsheet, Users, Calculator, Calendar, Settings } from "lucide-react";

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

const items = [
  { title: "Inicio", url: "inicio", icon: Home },
  { title: "Plantilla Cantaclaro", url: "plantilla", icon: FileSpreadsheet },
  { title: "Empleados", url: "empleados", icon: Users },
  { title: "Presupuestos", url: "presupuestos", icon: Calculator },
  { title: "Cuadrantes Mensuales", url: "cuadrantes", icon: Calendar },
  { title: "Configuración", url: "configuracion", icon: Settings },
];

interface NewSectionSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function NewSectionSidebar({ activeTab, onTabChange }: NewSectionSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (value: string) => activeTab === value;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión de turnos</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <button
                      onClick={() => onTabChange(item.url)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive(item.url)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}