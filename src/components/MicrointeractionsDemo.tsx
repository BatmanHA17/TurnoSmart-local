import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { DragIndicator, DropZone } from "@/components/ui/drag-indicator";
import { SkeletonText, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Heart, 
  Bookmark, 
  Share2, 
  Download,
  ChevronRight,
  Plus,
  Settings,
  User,
  Bell
} from "lucide-react";

export const MicrointeractionsDemo = () => {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, text: "Revisar propuesta de presupuesto", completed: false },
    { id: 2, text: "Planificar reunión de equipo", completed: true },
    { id: 3, text: "Actualizar documentación", completed: false },
  ]);

  const handleTaskToggle = (id: number, completed: boolean) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed } : task
    ));
  };

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Microinteracciones Notion</h1>
        <p className="text-muted-foreground">
          Demostración de animaciones y transiciones suaves inspiradas en Notion
        </p>
      </div>

      {/* Hover Effects Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Efectos de Hover (100-150ms)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <IconButton variant="default">
              <Heart className="h-4 w-4" />
            </IconButton>
            <IconButton variant="ghost">
              <Bookmark className="h-4 w-4" />
            </IconButton>
            <IconButton variant="active">
              <Share2 className="h-4 w-4" />
            </IconButton>
          </div>
          
          <Separator />
          
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" size="sm" className="hover-darken">
              <User className="h-4 w-4" />
              Perfil
            </Button>
            <Button variant="ghost" size="sm" className="hover-darken">
              <Settings className="h-4 w-4" />
              Configuración
            </Button>
            <Button variant="ghost" size="sm" className="hover-darken">
              <Bell className="h-4 w-4" />
              Notificaciones
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Cards with Expansion */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tarjetas Interactivas con Expansión</h2>
        <div className="space-y-3">
          <InteractiveCard
            title="Proyecto TurnoSmart"
            description="Sistema de gestión de personal para hostelería"
            expandable
            draggable
          >
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Desarrollo completo de la interfaz de usuario con componentes reutilizables
                y animaciones suaves que mejoran la experiencia del usuario.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Tailwind</Badge>
              </div>
            </div>
          </InteractiveCard>

          <InteractiveCard
            title="Documentación de API"
            description="Especificaciones técnicas y ejemplos de uso"
            expandable
            draggable
          >
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Documentación completa de endpoints, autenticación y modelos de datos.
              </p>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
          </InteractiveCard>
        </div>
      </div>

      {/* Animated Checkboxes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tareas con Animación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task) => (
            <AnimatedCheckbox
              key={task.id}
              label={task.text}
              checked={task.completed}
              onChange={(checked) => handleTaskToggle(task.id, checked)}
              className={task.completed ? "line-through text-muted-foreground" : ""}
            />
          ))}
        </CardContent>
      </Card>

      {/* Drag and Drop Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Drag & Drop con Indicadores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className="relative"
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
          >
            <DragIndicator active={dragActive} className="mb-4" />
            
            <DropZone active={dragActive}>
              <div className="p-8 text-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">
                  Arrastra elementos aquí para ver los indicadores en acción
                </p>
              </div>
            </DropZone>
          </div>

          <div className="flex gap-2">
            <div 
              draggable 
              className="px-3 py-2 bg-secondary rounded text-sm cursor-move hover-pill"
            >
              Elemento arrastrable 1
            </div>
            <div 
              draggable 
              className="px-3 py-2 bg-secondary rounded text-sm cursor-move hover-pill"
            >
              Elemento arrastrable 2
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Estados de Carga (Skeleton Screens)</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={simulateLoading}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Simular Carga"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <>
              <SkeletonCard />
              <Separator />
              <SkeletonText lines={3} />
              <Separator />
              <SkeletonTable rows={3} columns={3} />
            </>
          ) : (
            <div className="space-y-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Juan Pérez</p>
                    <p className="text-sm text-muted-foreground">Jefe de Bares</p>
                  </div>
                </div>
                <p className="text-sm">
                  Contenido completo cargado con transiciones suaves desde el estado skeleton.
                </p>
              </div>
              
              <div className="space-y-2">
                <p>Este es un texto completamente cargado.</p>
                <p>Las transiciones son sutiles pero efectivas.</p>
                <p>Notion utiliza este patrón para mantener la sensación de fluidez.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-muted rounded">
                  <p className="font-medium">Presencial</p>
                  <p className="text-2xl font-bold">28</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="font-medium">Librando</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="font-medium">Vacaciones</p>
                  <p className="text-2xl font-bold">6</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Button Press Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback de Clics Inmediato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="default" className="interactive-scale">
              Acción Principal
            </Button>
            <Button variant="secondary" className="interactive-scale">
              Acción Secundaria
            </Button>
            <Button variant="outline" className="interactive-scale">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Todos los botones proporcionan feedback inmediato al hacer clic, 
            con una ligera animación de escala que confirma la acción.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};