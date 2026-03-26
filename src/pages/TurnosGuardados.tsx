import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, MoreVertical, Edit, Copy, Trash2 } from "lucide-react";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TurnosGuardados() {
  useEffect(() => {
    document.title = "Horarios Guardados – TurnoSmart";
  }, []);

  const savedShifts = [
    {
      id: 1,
      name: "Turno Mañana Bares",
      employees: 12,
      timeSlot: "06:00 - 14:00",
      department: "Bares",
      status: "Activo",
      lastUsed: "Hace 2 días"
    },
    {
      id: 2,
      name: "Turno Tarde Restaurante",
      employees: 15,
      timeSlot: "14:00 - 22:00",
      department: "Restaurante",
      status: "Archivado",
      lastUsed: "Hace 1 semana"
    }
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Horarios Guardados</h1>
          <p className="text-[10px] text-muted-foreground">Gestiona y reutiliza tus plantillas de turnos guardadas.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedShifts.map((shift) => (
            <Card key={shift.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">{shift.name}</CardTitle>
                    <Badge variant={shift.status === "Activo" ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">
                      {shift.status}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-[10px]">
                        <Edit className="h-3 w-3 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[10px]">
                        <Copy className="h-3 w-3 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[10px] text-destructive">
                        <Trash2 className="h-3 w-3 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{shift.employees} empleados</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{shift.timeSlot}</span>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Departamento: {shift.department}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Último uso: {shift.lastUsed}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 h-7 text-[10px]">
                    Usar Plantilla
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px]">
                    Vista Previa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Crear Nueva Plantilla</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground mb-4">
              Crea una nueva plantilla de turno desde cero o basándote en un turno existente.
            </p>
            <Button className="text-[10px] h-7">
              <Calendar className="h-3 w-3 mr-2" />
              Crear Plantilla
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}