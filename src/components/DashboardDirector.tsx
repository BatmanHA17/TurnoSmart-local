import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Settings, Users, Calculator, TrendingUp, Shield, HelpCircle, Cog } from "lucide-react";

const DashboardDirector = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Hola Director,</h1>
            <p className="text-lg text-muted-foreground">
              Administra un establecimiento desde la configuración hasta la pre-nómina
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
              <Building className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Configuración</CardTitle>
              <CardDescription className="text-sm">
                Ajusta la configuración del establecimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Configurar
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Gestión de personal</CardTitle>
              <CardDescription className="text-sm">
                Supervisa todos los equipos del establecimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Ver personal
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calculator className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-lg">Pre-nómina</CardTitle>
              <CardDescription className="text-sm">
                Prepara y revisa la nómina del establecimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Gestionar nómina
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Reportes</CardTitle>
              <CardDescription className="text-sm">
                Analiza métricas y estadísticas
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Ver reportes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="text-center pb-4">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-md">Políticas laborales</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="ghost" size="sm" className="w-full">
                Configurar políticas
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="text-center pb-4">
              <Building className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-md">Establecimiento</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="ghost" size="sm" className="w-full">
                Gestionar ubicaciones
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardHeader className="text-center pb-4">
              <Cog className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-md">Herramientas</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="ghost" size="sm" className="w-full">
                Acceder a herramientas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                ¿Necesitas ayuda?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Accede a guías especializadas para directores sobre gestión de establecimientos, 
                configuración avanzada y optimización de recursos.
              </p>
              <Button variant="link" className="p-0 h-auto">
                Consultar documentación para directores →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración del establecimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gestiona la configuración completa del establecimiento: equipos, 
                horarios, políticas, permisos y estructura organizacional.
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

export default DashboardDirector;