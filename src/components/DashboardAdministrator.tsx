import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Database, Users, Settings, BarChart3, Lock, Globe, Wrench, HelpCircle, Crown } from "lucide-react";

const DashboardAdministrator = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Hola Administrador,</h1>
            <p className="text-lg text-muted-foreground">
              Puede acceder a toda la aplicación con permisos completos
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
              <Shield className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-lg">Gestión de usuarios</CardTitle>
              <CardDescription className="text-sm">
                Administra todos los usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Gestionar usuarios
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Base de datos</CardTitle>
              <CardDescription className="text-sm">
                Administra y monitorea la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Ver base de datos
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Configuración global</CardTitle>
              <CardDescription className="text-sm">
                Acceso a toda la configuración del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Configuración
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription className="text-sm">
                Reportes y métricas globales del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Ver analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Admin Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="text-center pb-4">
              <Lock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <CardTitle className="text-md">Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="ghost" size="sm" className="w-full">
                Configurar seguridad
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="text-center pb-4">
              <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-md">API & Integraciones</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="ghost" size="sm" className="w-full">
                Gestionar APIs
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="text-center pb-4">
              <Wrench className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-md">Herramientas dev</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="ghost" size="sm" className="w-full">
                Herramientas
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="text-center pb-4">
              <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <CardTitle className="text-md">Super Admin</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="ghost" size="sm" className="w-full">
                Panel super admin
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-800">Estado del sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700">Todos los servicios operativos</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Última verificación: hace 2 min</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-800">Usuarios activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">1,247</div>
              <p className="text-xs text-muted-foreground">+12% vs. mes anterior</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-purple-800">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">99.8%</div>
              <p className="text-xs text-muted-foreground">Uptime últimos 30 días</p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Documentación técnica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Accede a la documentación completa de administración del sistema, 
                APIs, configuraciones avanzadas y mejores prácticas de seguridad.
              </p>
              <Button variant="link" className="p-0 h-auto">
                Consultar documentación técnica →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración avanzada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Configura parámetros avanzados del sistema, políticas de seguridad, 
                integraciones y personalización completa de la plataforma.
              </p>
              <Button variant="link" className="p-0 h-auto">
                Ir a configuración avanzada →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdministrator;