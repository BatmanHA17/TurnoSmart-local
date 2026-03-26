import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotaShiftManagement } from './RotaShiftManagement';
import { RotaCalendarView } from './RotaCalendarView';
import { useRota } from '@/hooks/useRota';
import { useRotaMembers } from '@/hooks/useRota';

interface RotaCalendarManagementProps {
  rotaId: string | null;
  onRotaSelect?: (rotaId: string) => void;
}

export function RotaCalendarManagement({ rotaId, onRotaSelect }: RotaCalendarManagementProps) {
  const { rotas } = useRota();
  const selectedRota = rotas.find(r => r.id === rotaId);
  const { members: rotaMembers } = useRotaMembers(rotaId || '');

  if (!rotaId || !selectedRota) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selecciona una Rota</CardTitle>
          <CardDescription>
            Primero selecciona una rota para gestionar sus horarios y calendario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rotas.map((rota) => (
              <Card 
                key={rota.id} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onRotaSelect?.(rota.id)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">{rota.name}</h3>
                    {rota.description && (
                      <p className="text-sm text-muted-foreground">{rota.description}</p>
                    )}
                    <Badge variant="secondary">
                      {rota.member_count} miembros
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de {selectedRota.name}</h2>
          <p className="text-muted-foreground">
            Configura horarios y asigna turnos para esta rota
          </p>
        </div>
        <Badge variant="outline">
          {rotaMembers.length} colaboradores
        </Badge>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="shifts">Gestión de Turnos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-6">
          <RotaCalendarView 
            rotaId={rotaId}
            rotaName={selectedRota.name}
          />
        </TabsContent>
        
        <TabsContent value="shifts" className="space-y-6">
          <RotaShiftManagement 
            rotaId={rotaId}
            rotaName={selectedRota.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}