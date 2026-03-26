import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Zap, Hand } from "lucide-react";
import { GoTurnoSmartManual } from "./GoTurnoSmartManual";

export const GoTurnoSmart = () => {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Zap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          GoTurnoSmart
        </h2>
        <p className="text-sm md:text-lg text-muted-foreground px-4">
          Guía inteligente para crear turnos públicos de forma manual o automática
        </p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="h-auto p-0 bg-transparent border-none relative">
          <TabsTrigger 
            value="manual" 
            className="bg-transparent border-none text-sm font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-2 rounded-none"
          >
            Manual
          </TabsTrigger>
          <TabsTrigger 
            value="automatico" 
            disabled
            className="bg-transparent border-none text-sm font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-2 rounded-none ml-6 opacity-50"
          >
            Automático
            <Badge variant="secondary" className="ml-2 text-xs">
              Pronto
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 md:mt-6">
          <GoTurnoSmartManual />
        </TabsContent>

        <TabsContent value="automatico" className="mt-4 md:mt-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">Creación Automática</CardTitle>
              <CardDescription className="text-sm">
                Funcionalidad en desarrollo para generar turnos automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Esta funcionalidad estará disponible próximamente.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};