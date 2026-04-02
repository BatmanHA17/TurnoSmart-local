import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, X, MoreHorizontal } from "lucide-react";
import { getSavedShifts, getSavedShiftsSync, removeSavedShift } from "@/store/savedShiftsStore";
import { AdvancedShiftDialog } from "./AdvancedShiftDialog";
import { RotatingShiftsConfig } from "./RotatingShiftsConfig";

interface ShiftConfigurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShiftConfigurationDialog({ isOpen, onClose }: ShiftConfigurationDialogProps) {
  const [showNewShiftDialog, setShowNewShiftDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedShifts, setSavedShifts] = useState<any[]>([]);

  // Cargar horarios guardados desde la matriz principal (igual que en AdvancedShiftDialog)
  useEffect(() => {
    if (isOpen) {
      const loadAllShifts = async () => {
        // Forzar recarga desde base de datos para obtener datos actualizados
        const savedShifts = await getSavedShifts(true);
        
        // Cargar favoritos desde localStorage (misma lógica que AdvancedShiftDialog)
        try {
          const stored = localStorage.getItem('turnosmart-favorite-shifts');
          const favoriteShifts = stored ? JSON.parse(stored) : [];
          
          // Filtrar duplicados basándose en ID Y nombre para evitar duplicaciones
          const combined = [...savedShifts];
          favoriteShifts.forEach((fav: any) => {
            // Verificar duplicados por ID y por nombre
            const existsById = combined.some(shift => shift.id === fav.id);
            const existsByName = combined.some(shift => 
              shift.name.toLowerCase() === fav.name.toLowerCase()
            );
            if (!existsById && !existsByName) {
              combined.push(fav);
            }
          });
          
          setSavedShifts(combined);
        } catch (error) {
          console.error('Error cargando favoritos en ShiftConfigurationDialog:', error);
          setSavedShifts(savedShifts);
        }
      };
      
      loadAllShifts();
    }
  }, [isOpen, refreshKey]);

  const handleDeleteShift = async (shiftId: string) => {
    // Check if it's a localStorage favorite (ID starts with "favorite-")
    if (shiftId.startsWith('favorite-')) {
      // Remove from localStorage
      try {
        const stored = localStorage.getItem('turnosmart-favorite-shifts');
        const favoriteShifts = stored ? JSON.parse(stored) : [];
        const updated = favoriteShifts.filter((fav: any) => fav.id !== shiftId);
        localStorage.setItem('turnosmart-favorite-shifts', JSON.stringify(updated));
      } catch (error) {
        console.error('Error removing favorite from localStorage:', error);
      }
    } else {
      // Remove from Supabase database
      await removeSavedShift(shiftId);
    }
    setRefreshKey(prev => prev + 1); // Force refresh
  };

  const handleEditShift = (shift: any) => {
    setEditingShift(shift);
    setShowNewShiftDialog(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 flex items-center justify-center z-40"
        onClick={onClose}
      >
        <Card 
          className="w-[95vw] h-[90vh] max-w-7xl bg-background border border-border shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <h1 className="text-lg font-semibold">Horarios</h1>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="saved" className="h-full flex flex-col">
                <div className="mx-4 mt-4 relative">
                  {/* Línea base continua */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-muted-foreground/30"></div>
                  
                  <TabsList className="h-auto p-0 bg-transparent border-none relative">
                    <TabsTrigger 
                      value="saved" 
                      className="text-sm px-0 pb-3 mr-6 bg-transparent border-none shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold rounded-none relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground"
                    >
                      Horarios guardados
                    </TabsTrigger>
                    {/* "Horarios rotativos" tab removed — rotation handled by SMART engine */}
                  </TabsList>
                </div>

                <TabsContent value="saved" className="flex-1 overflow-hidden">
                  <div className="p-4 h-full flex flex-col">
                    {/* Section Title and Button */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-medium">Tus horarios guardados</h2>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 text-xs border-red-500 text-red-500 hover:bg-red-50 rounded-full"
                        onClick={() => setShowNewShiftDialog(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                         Nuevo Horario
                      </Button>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 border rounded-lg overflow-hidden">
                      {/* Table Header */}
                      <div className="bg-muted/20 border-b px-4 py-2">
                        <div className="grid grid-cols-7 gap-4 text-xs font-medium text-muted-foreground">
                          <div>Nombre del horario</div>
                          <div>Rango horario</div>
                          <div>Descanso</div>
                          <div>Lugar de trabajo</div>
                          <div>Área de trabajo</div>
                          <div>Acceso</div>
                          <div></div>
                        </div>
                      </div>

                      {/* Table Content */}
                      <div className="flex-1 overflow-y-auto" key={refreshKey}>
                        {savedShifts.length > 0 ? (
                          <div className="divide-y">
                            {[...savedShifts].sort((a, b) => {
                              // Convertir horas para que turnos nocturnos (00:00-05:59) vayan al final
                              const getComparableTime = (time: string) => {
                                if (!time) return '00:00';
                                const [hours] = time.split(':');
                                const hour = parseInt(hours, 10);
                                // Si empieza entre medianoche y las 6am, sumar 24h para ordenamiento
                                return hour >= 0 && hour < 6 ? `${hour + 24}:${time.split(':')[1]}` : time;
                              };
                              const timeA = getComparableTime(a.startTime || '');
                              const timeB = getComparableTime(b.startTime || '');
                              return timeA.localeCompare(timeB);
                            }).map((shift) => (
                              <div key={shift.id} className="px-4 py-2 hover:bg-muted/10">
                                <div className="grid grid-cols-7 gap-4 text-sm items-center">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: shift.color }}
                                    ></div>
                                    <span className="font-medium">{shift.name}</span>
                                  </div>
                                  <div className="text-muted-foreground">
                                    {shift.startTime} - {shift.endTime}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {shift.hasBreak && (shift.totalBreakTime || shift.breakDuration)
                                      ? shift.totalBreakTime 
                                        ? `${Math.round(shift.totalBreakTime)} min`
                                        : `${shift.breakDuration} min`
                                      : '-'
                                    }
                                  </div>
                                  <div className="text-muted-foreground">
                                    {shift.selectedWorkplace || shift.organization || '-'}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {shift.department || '-'}
                                  </div>
                                  <div>
                                    <Badge 
                                      variant={shift.accessType === 'company' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {shift.accessType === 'company' ? 'Todo' : 'Equipo'}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-end">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 w-6 p-0 rounded-full hover:bg-muted/20"
                                        >
                                          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => handleEditShift(shift)}>
                                          Editar horario guardado
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteShift(shift.id)}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          Eliminar horario guardado
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-64 text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                              Aún no hay horarios guardados.
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 text-xs border-red-500 text-red-500 hover:bg-red-50 rounded-full"
                              onClick={() => setShowNewShiftDialog(true)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Nuevo Horario
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* rotating tab removed — SMART engine handles rotation */}
              </Tabs>
            </div>
          </div>
        </Card>
      </div>

      {/* Advanced Shift Dialog - Para crear/editar turnos */}
      <AdvancedShiftDialog
        isOpen={showNewShiftDialog}
        onClose={() => {
          setShowNewShiftDialog(false);
          setEditingShift(null);
          setRefreshKey(prev => prev + 1); // Refresh the list when closing
        }}
        employee={undefined} // No hay empleado específico en este contexto
        date={new Date()} // Fecha actual por defecto
        editingShift={editingShift} // Pass the shift being edited
        onShiftAssigned={(shiftData) => {
          setRefreshKey(prev => prev + 1); // Refresh the list after saving
        }}
      />
    </>
  );
}