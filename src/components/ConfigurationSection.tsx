import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Plus } from "lucide-react";
import { EmployeeManagement } from "./EmployeeManagement";

export const ConfigurationSection = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 md:h-6 md:w-6" />
        <h1 className="text-xl md:text-2xl font-bold">Configuración</h1>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-1 h-auto">
          <TabsTrigger value="employees" className="flex items-center gap-2 py-3 md:py-2">
            <Users className="h-4 w-4" />
            <span className="text-sm md:text-base">Gestión de Personas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4 md:mt-6">
          <EmployeeManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};