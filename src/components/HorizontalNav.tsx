import { Bell, User, Settings, LogOut, Check, Calendar, HelpCircle, FileText, Crown, Activity, RotateCcw, Menu } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const mainNavItems = [
  { title: "Analítica", url: "/mi-actividad" },
  { title: "Turnos", url: "/turnosmart" },
  { title: "Equipo", url: "/colaboradores" },
  { title: "HR", url: "/hr" },
];

export function HorizontalNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile, displayName } = useUserProfile();
  const { user, signOut } = useAuth();
  const { getDefaultDashboard, role, isOwner } = useUserRoleCanonical();
  const { currentOrganization } = useOrganizationsUnified();
  const navigate = useNavigate();

  // Filter navigation items based on role
  const filteredNavItems = mainNavItems.filter(item => {
    // Hide HR for employees
    if (item.url === "/hr" && role === "EMPLOYEE") {
      return false;
    }
    return true;
  });

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/" || currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    return isActive(path)
      ? "text-white bg-white/10 font-medium"
      : "text-white/70 hover:text-white hover:bg-white/5";
  };

  const navigateToProfile = async () => {
    if (!user) {
      console.log('⚠️ No hay usuario logueado');
      navigate('/auth');
      return;
    }

    try {
      console.log('🔍 Buscando colaborador para usuario:', user.id);
      
      // Primero intentar buscar por email del perfil actualizado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Error obteniendo perfil:', profileError);
        toast({
          title: "Error",
          description: "Error al obtener tu perfil",
          variant: "destructive"
        });
        navigate('/colaboradores');
        return;
      }

      const emailToSearch = profile?.email;
      console.log('📧 Email del perfil:', emailToSearch);
      
      if (!emailToSearch) {
        toast({
          title: "Error",
          description: "No se encontró email en tu perfil",
          variant: "destructive"
        });
        navigate('/colaboradores');
        return;
      }

      // Buscar colaborador por email
      const { data: colaborador, error } = await supabase
        .from('colaborador_full')
        .select('id, nombre, apellidos, email')
        .eq('email', emailToSearch)
        .maybeSingle();

      console.log('📊 Resultado búsqueda colaborador:', { colaborador, error });

      if (error) {
        console.error('❌ Error buscando colaborador:', error);
        toast({
          title: "Error",
          description: "Error al buscar tu perfil de colaborador",
          variant: "destructive"
        });
        navigate('/colaboradores');
        return;
      }

      if (!colaborador) {
        console.log('⚠️ No se encontró colaborador con email:', emailToSearch);
        console.log('🎯 Navegando a perfil de usuario en su lugar');
        navigate('/perfil');
        return;
      }

      console.log('✅ Colaborador encontrado:', colaborador.id, colaborador.nombre);
      console.log('🎯 Navegando a perfil con datos personales');
      navigate(`/colaboradores/${colaborador.id}/profile`);
      
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al acceder a tu perfil",
        variant: "destructive"
      });
      navigate('/colaboradores');
    }
  };

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <NavLink 
              to={getDefaultDashboard()} 
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
            >
              <TurnoSmartLogo size="sm" className="text-white" />
              <span className="font-semibold text-sm">TurnoSmart</span>
            </NavLink>

            {/* Main Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-1">
              {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    className={`px-3 py-2 rounded-md text-sm transition-all duration-200 ${getNavClass(item.url)}`}
                  >
                    <span>{item.title}</span>
                  </NavLink>
              ))}
            </div>
          </div>

          {/* Right side - Organization Switcher, Sidebar Toggle, Bell and Avatar */}
          <div className="flex items-center gap-3">
            {/* Organization Switcher - Hidden on mobile */}
            <div className="hidden sm:block">
              <OrganizationSwitcher />
            </div>
            
            {/* Bell notification */}
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-white/70 hover:text-white hover:bg-white/5">
              <Bell className="h-4 w-4" />
            </Button>

            {/* Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-white/5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="text-xs bg-white text-black font-medium">
                      {displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 border border-gray-200 shadow-xl rounded-xl p-0" 
                align="end"
                style={{ 
                  backgroundColor: 'rgb(255, 255, 255)',
                  color: 'rgb(0, 0, 0)',
                  zIndex: 9999,
                  opacity: 1
                }}
              >
                {/* Main menu items */}
                <div className="py-2">
                  {/* Show all options for admin roles, only "Mis preferencias" for employees */}
                  {role !== "EMPLOYEE" && (
                    <DropdownMenuItem 
                      className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate("/solicitudes-ausencia")}
                    >
                      Solicitudes de Ausencia
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate("/mis-preferencias")}
                  >
                    Mis preferencias
                  </DropdownMenuItem>
                  
                  {role !== "EMPLOYEE" && (
                    <>
                      <DropdownMenuItem 
                        className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate("/settings/locations")}
                      >
                        Configuración
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                        Suscripción⚠️
                      </DropdownMenuItem>
                    </>
                  )}
                </div>
                
                {role !== "EMPLOYEE" && (
                  <>
                    <DropdownMenuSeparator className="border-gray-200" />
                    
                    {/* Sidebar Old - Accesos Adicionales */}
                    <div className="py-2">
                      <div className="px-4 py-2">
                        <span className="text-xs text-gray-400 font-medium">Accesos adicionales</span>
                      </div>
                      
                      {/* Gestión */}
                      <DropdownMenuItem 
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate("/cuadrante")}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Cuadrante
                      </DropdownMenuItem>
                      
                      {/* Configuración */}
                      <DropdownMenuItem 
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate("/configuracion-legacy")}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configuration Hub (Legacy)
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate("/turnos/guardados")}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Horarios Guardados
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate("/old-turnosmart")}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Old-Turnosmart.app
                      </DropdownMenuItem>
                      
                      {/* Admin - Solo para OWNER */}
                      {isOwner && (
                        <>
                          <DropdownMenuItem 
                            className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate("/perfil-admin")}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Panel de Super Admin
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate("/activity")}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            Actividad
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {/* Ayuda */}
                      <DropdownMenuItem 
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate("/ayuda")}
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Centro de Ayuda
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate("/faq")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Preguntas Frecuentes
                      </DropdownMenuItem>
                    </div>
                    
                    <DropdownMenuSeparator className="border-gray-200" />
                  </>
                )}
                
                {/* Account section */}
                <div className="py-2">
                  <div className="px-4 py-2">
                    <span className="text-xs text-gray-400 font-medium">Mis cuentas</span>
                  </div>
                  
                  <DropdownMenuItem className="px-4 py-3 text-sm text-gray-700 cursor-default">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{currentOrganization?.name || 'Sin organización'}</span>
                      <Check className="h-4 w-4 text-gray-400" />
                    </div>
                  </DropdownMenuItem>
                </div>
                
                <DropdownMenuSeparator className="border-gray-200" />
                
                {/* Profile and logout */}
                <div className="py-2">
                  <DropdownMenuItem 
                    className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate('/perfil')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración de cuenta
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    onClick={navigateToProfile}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Ver mi perfil</DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    onClick={() => {
                      console.log('🔴 LOGOUT BUTTON CLICKED');
                      console.log('signOut function exists:', typeof signOut === 'function');
                      try {
                        signOut();
                        console.log('🔴 signOut() called successfully');
                      } catch (error) {
                        console.error('🔴 ERROR calling signOut():', error);
                      }
                    }}
                  >
                    Cerrar sesión
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu - Hamburger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 p-0 text-white/70 hover:text-white hover:bg-white/5">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-black border-gray-800">
                <nav className="flex flex-col space-y-1 mt-8">
                  {/* Organization Switcher en móvil */}
                  <div className="px-2 py-4 border-b border-gray-800 mb-4">
                    <OrganizationSwitcher />
                  </div>

                  {/* Navigation Links */}
                  {filteredNavItems.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      className={`px-4 py-3 rounded-md text-base font-medium transition-all duration-200 ${getNavClass(item.url)}`}
                    >
                      {item.title}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}