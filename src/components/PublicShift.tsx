import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Clock, Eye, Edit, Trash2, Mail, Download, History, ArrowLeft, Share2 } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { TurnoViewer } from "./TurnoViewer";
interface TurnoPublico {
  id: string;
  name: string;
  date_range_start: string;
  date_range_end: string;
  status: string; // Cambiado a string para coincidir con Supabase
  employee_count: number;
  shift_data?: any;
  created_at: string;
  version: number;
  parent_turno_id?: string;
  is_current_version: boolean;
  published_at?: string;
  sent_emails?: string[];
}

export const PublicShift = () => {
  const [turnosPublicos, setTurnosPublicos] = useState<TurnoPublico[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedTurno, setSelectedTurno] = useState<TurnoPublico | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState<TurnoPublico[]>([]);
  const [editTurno, setEditTurno] = useState<TurnoPublico | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editStart, setEditStart] = useState<Date | undefined>();
  const [editEnd, setEditEnd] = useState<Date | undefined>();
  useEffect(() => {
    fetchTurnosPublicos();
  }, []);

  const fetchTurnosPublicos = async () => {
    try {
      const { data, error } = await supabase
        .from('turnos_publicos')
        .select('*')
        .eq('is_current_version', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTurnosPublicos(data || []);
    } catch (error) {
      console.error('Error fetching turnos públicos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los turnos públicos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionHistory = async (turnoId: string) => {
    try {
      const { data, error } = await supabase
        .from('turnos_publicos')
        .select('*')
        .or(`id.eq.${turnoId},parent_turno_id.eq.${turnoId}`)
        .order('version', { ascending: false });

      if (error) throw error;
      setVersionHistory(data || []);
      setShowVersionHistory(true);
    } catch (error) {
      console.error('Error fetching version history:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de versiones",
        variant: "destructive",
      });
    }
  };

  const handlePublishTurno = async (id: string) => {
    try {
      const { error } = await supabase
        .from('turnos_publicos')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Turno Publicado",
        description: "El horario público ha sido publicado exitosamente",
      });

      fetchTurnosPublicos();
    } catch (error) {
      console.error('Error publishing turno:', error);
      toast({
        title: "Error",
        description: "No se pudo publicar el turno",
        variant: "destructive",
      });
    }
  };

  const handleCreateRevision = async (turno: TurnoPublico) => {
    try {
      // Mark current version as not current
      await supabase
        .from('turnos_publicos')
        .update({ is_current_version: false })
        .eq('id', turno.id);

      // Create new revision
      const newVersion = turno.version + 0.1;
      const { error } = await supabase
        .from('turnos_publicos')
        .insert({
          name: `${turno.name} - Revisión ${newVersion}`,
          date_range_start: turno.date_range_start,
          date_range_end: turno.date_range_end,
          status: 'revision',
          employee_count: turno.employee_count,
          shift_data: turno.shift_data,
          version: newVersion,
          parent_turno_id: turno.parent_turno_id || turno.id,
          is_current_version: true
        });

      if (error) throw error;

      toast({
        title: "Revisión Creada",
        description: `Se ha creado la revisión ${newVersion} del turno`,
      });

      fetchTurnosPublicos();
    } catch (error) {
      console.error('Error creating revision:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la revisión",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (turno: TurnoPublico) => {
    // Placeholder for email functionality
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La función de envío por email se implementará próximamente",
    });
  };

  const handleDownloadPDF = async (turno: TurnoPublico) => {
    // Placeholder for PDF download functionality
    toast({
      title: "Funcionalidad en desarrollo", 
      description: "La función de descarga PDF se implementará próximamente",
    });
  };

  const handleDeleteTurno = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este turno?')) return;

    try {
      const { error } = await supabase
        .from('turnos_publicos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Turno Eliminado",
        description: "El horario público ha sido eliminado",
      });

      fetchTurnosPublicos();
    } catch (error) {
      console.error('Error deleting turno:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el turno",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (turno: TurnoPublico) => {
    setEditTurno(turno);
    setEditName(turno.name);
    setEditStart(new Date(turno.date_range_start));
    setEditEnd(new Date(turno.date_range_end));
  };

  const saveEdit = async () => {
    if (!editTurno) return;
    try {
      const payload: any = { name: editName };
      if (editStart) payload.date_range_start = editStart.toISOString().slice(0,10);
      if (editEnd) payload.date_range_end = editEnd.toISOString().slice(0,10);

      const { error } = await supabase
        .from('turnos_publicos')
        .update(payload)
        .eq('id', editTurno.id);

      if (error) throw error;

      toast({ title: 'Turno actualizado', description: 'Los cambios se han guardado correctamente' });
      setEditTurno(null);
      fetchTurnosPublicos();

      // Si estás viendo ese mismo turno, refresca el seleccionado también
      if (selectedTurno && selectedTurno.id === editTurno.id) {
        setSelectedTurno({ ...selectedTurno, ...payload });
      }
    } catch (error) {
      console.error('Error updating turno:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar el turno', variant: 'destructive' });
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editName.trim()) {
      saveEdit();
    }
  };

  const getFilteredTurnos = () => {
    let filtered = turnosPublicos;
    
    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter(turno => turno.status === activeTab);
    }
    
    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(turno => {
        const startDate = new Date(turno.date_range_start);
        const endDate = new Date(turno.date_range_end);
        return selectedDate >= startDate && selectedDate <= endDate;
      });
    }
    
    return filtered;
  };

  const filteredTurnos = getFilteredTurnos();

  // If viewing a specific turno, import and show the viewer
  if (selectedTurno) {
    return (
      <TurnoViewer 
        turno={selectedTurno}
        onBack={() => setSelectedTurno(null)}
        onEdit={() => openEditDialog(selectedTurno)}
        onCreateRevision={() => handleCreateRevision(selectedTurno)}
        onSendEmail={() => handleSendEmail(selectedTurno)}
        onDownload={() => handleDownloadPDF(selectedTurno)}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Calendar className="h-5 w-5" />
            Horario Público
          </CardTitle>
          <CardDescription className="text-sm">
            Gestión y visualización de turnos públicos del departamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Tabs */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full sm:w-auto",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="outline" 
                onClick={() => setSelectedDate(undefined)}
                className="w-full sm:w-auto"
              >
                Ver Todos
              </Button>
            </div>

            {/* Status Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto p-0 bg-transparent border-none relative flex gap-6">
                <TabsTrigger value="all" className="bg-transparent border-none text-xs font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-2 rounded-none">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="draft" className="bg-transparent border-none text-xs font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-2 rounded-none">
                  Borrador
                </TabsTrigger>
                <TabsTrigger value="published" className="bg-transparent border-none text-xs font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-2 rounded-none">
                  Publicado
                </TabsTrigger>
                <TabsTrigger value="revision" className="bg-transparent border-none text-xs font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-2 rounded-none">
                  Revisión
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Turnos List */}
          {loading ? (
            <div className="text-center py-8">Cargando turnos públicos...</div>
          ) : filteredTurnos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedDate 
                ? "No hay turnos públicos para la fecha seleccionada"
                : `No hay turnos ${activeTab === 'all' ? '' : activeTab} creados`
              }
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredTurnos.map((turno) => (
                <Card key={turno.id} className="p-3 md:p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
                    <div className="flex-1 space-y-2 md:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-semibold text-sm md:text-base">{turno.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            turno.status === 'published' ? 'default' : 
                            turno.status === 'revision' ? 'outline' : 'secondary'
                          } className="text-xs">
                            {turno.status === 'published' ? 'Publicado' : 
                             turno.status === 'revision' ? 'En Revisión' : 'Draft'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">v{turno.version}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          {format(new Date(turno.date_range_start), "dd/MM/yyyy")} - {format(new Date(turno.date_range_end), "dd/MM/yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          {turno.employee_count} empleados
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          {format(new Date(turno.created_at), "dd/MM/yyyy HH:mm")}
                        </span>
                        {turno.published_at && (
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            Publicado {format(new Date(turno.published_at), "dd/MM/yyyy")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTurno(turno)}
                        className="flex-1 sm:flex-none"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                      
                      {turno.status === 'draft' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(turno)}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handlePublishTurno(turno.id)}
                            className="flex-1 sm:flex-none"
                          >
                            <span className="hidden sm:inline">Publicar</span>
                            <span className="sm:hidden">Pub</span>
                          </Button>
                        </>
                      )}

                      {turno.status === 'published' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCreateRevision(turno)}
                        >
                          <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Revisar</span>
                        </Button>
                      )}

                      {(turno.parent_turno_id || versionHistory.length > 0) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchVersionHistory(turno.parent_turno_id || turno.id)}
                        >
                          <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Versiones</span>
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteTurno(turno.id)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editTurno} onOpenChange={(open) => !open && setEditTurno(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar turno</DialogTitle>
            <DialogDescription>Modifica los metadatos del turno. La edición avanzada de horarios llegará a continuación.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyPress={handleEditKeyPress} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Inicio</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editStart && "text-muted-foreground")}> 
                      <Calendar className="h-4 w-4 mr-2" />
                      {editStart ? format(editStart, "dd/MM/yyyy") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={editStart} onSelect={setEditStart} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editEnd && "text-muted-foreground")}> 
                      <Calendar className="h-4 w-4 mr-2" />
                      {editEnd ? format(editEnd, "dd/MM/yyyy") : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={editEnd} onSelect={setEditEnd} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTurno(null)}>Cancelar</Button>
              <Button onClick={saveEdit}>Guardar cambios</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Historial de Versiones</DialogTitle>
            <DialogDescription>
              Todas las versiones y revisiones de este horario público
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {versionHistory.map((version) => (
              <Card key={version.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{version.name}</h4>
                      <Badge variant={
                        version.status === 'published' ? 'default' : 
                        version.status === 'revision' ? 'outline' : 'secondary'
                      }>
                        {version.status === 'published' ? 'Publicado' : 
                         version.status === 'revision' ? 'En Revisión' : 'Draft'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">v{version.version}</span>
                      {version.is_current_version && (
                        <Badge variant="default" className="text-xs">Actual</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Creado: {format(new Date(version.created_at), "dd/MM/yyyy HH:mm")}
                      {version.published_at && (
                        <span> • Publicado: {format(new Date(version.published_at), "dd/MM/yyyy HH:mm")}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedTurno(version);
                      setShowVersionHistory(false);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};