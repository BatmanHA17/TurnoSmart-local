import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Copy, Trash2, Eye, Plus, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getCuadrantes as getSupabaseCuadrantes } from '@/services/database';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


export const CuadrantesRepository: React.FC<{ 
  onViewCuadrante?: (cuadranteId: string, readOnly?: boolean) => void; 
  onEditCuadrante?: (cuadranteId: string) => void;
  onCreateNew?: () => void;
}> = ({ onViewCuadrante, onEditCuadrante, onCreateNew }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [year, setYear] = useState<string>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const years = useMemo(() => Array.from(new Set(data.map(d => d.year))).sort(), [data]);

  const loadCuadrantes = async () => {
    try {
      const cuadrantes = await getSupabaseCuadrantes();
      const formattedData = cuadrantes.map(c => ({
        id: c.id,
        name: c.name,
        month: getMonthName(c.month),
        year: c.year,
        type: 'auto' as const,
        status: 'published' as const,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        employeeCount: 0, // Se puede calcular después si es necesario
        description: `Horario ${getMonthName(c.month)} ${c.year}`
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error loading cuadrantes:', error);
      toast({ title: 'Error', description: 'Error al cargar horarios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month - 1] || 'Desconocido';
  };

  React.useEffect(() => {
    loadCuadrantes();
    
    const refreshHandler = () => loadCuadrantes();
    window.addEventListener('horario-saved', refreshHandler);
    return () => window.removeEventListener('horario-saved', refreshHandler);
  }, []);

  const filtered = useMemo(() => {
    return data.filter(d =>
      (status === 'all' || d.status === status) &&
      (year === 'all' || d.year.toString() === year) &&
      (query.trim() === '' || d.name.toLowerCase().includes(query.toLowerCase()))
    );
  }, [data, status, year, query]);

  const handleDuplicate = async (id: string) => {
    try {
      const original = data.find(c => c.id === id);
      if (!original) return;
      
      // Aquí podrías implementar la duplicación en Supabase si es necesario
      toast({ title: 'Función no disponible', description: 'La duplicación estará disponible próximamente' });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al duplicar cuadrante', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // NOTA: La tabla 'cuadrantes' no existe en el schema actual
      console.error('La tabla cuadrantes no existe. Funcionalidad deshabilitada temporalmente.');
      return;
      
      await loadCuadrantes();
      toast({ title: 'Horario eliminado' });
    } catch (error) {
      console.error('Error deleting cuadrante:', error);
      toast({ title: 'Error', description: 'Error al eliminar horario', variant: 'destructive' });
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'published': return <Badge className="bg-green-100 text-green-800 border border-green-200">Publicado</Badge>;
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">Borrador</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800 border border-gray-200">Archivado</Badge>;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Todos los Turnos</h2>
          <p className="text-sm md:text-base text-muted-foreground">Consulta, duplica o elimina horarios guardados.</p>
        </div>
        <Button 
          onClick={onCreateNew}
          variant="outline"
          className="bg-background/50 border-border/50 hover:bg-muted/30 hover:border-border/70 transition-all duration-200 text-foreground/90 hover:text-foreground font-medium gap-2 px-4 md:px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="sm:hidden">Nuevo</span>
          <span className="hidden sm:inline">Nuevo Horario</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input 
              placeholder="Buscar por nombre..." 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              className="w-full"
            />
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">Cargando cuadrantes...</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">No hay horarios para los filtros seleccionados.</div>
        ) : (
          filtered.map(item => (
            <Card key={item.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <button 
                      className="text-left font-medium hover:underline text-sm"
                      onClick={() => onViewCuadrante ? onViewCuadrante(item.id, true) : setPreviewId(item.id)}
                    >
                      {item.name}
                    </button>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.month} {item.year} • {item.employeeCount} empleados
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="ghost" onClick={() => onViewCuadrante ? onViewCuadrante(item.id, true) : setPreviewId(item.id)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEditCuadrante ? onEditCuadrante(item.id) : (onViewCuadrante && onViewCuadrante(item.id, false))}>
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(item.id)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <div className="grid grid-cols-12 bg-muted/50 px-4 py-2 text-xs font-medium">
          <div className="col-span-4">Nombre</div>
          <div className="col-span-2">Periodo</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-1 text-right">Empl.</div>
          <div className="col-span-3 text-right">Acciones</div>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">Cargando cuadrantes...</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">No hay horarios para los filtros seleccionados.</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="grid grid-cols-12 items-center px-4 py-3 border-t text-sm">
              <button className="text-left col-span-4 font-medium hover:underline" onClick={() => onViewCuadrante ? onViewCuadrante(item.id, true) : setPreviewId(item.id)}>
                {item.name}
              </button>
              <div className="col-span-2">{item.month} {item.year}</div>
              <div className="col-span-2">{getStatusBadge(item.status)}</div>
              <div className="col-span-1 text-right">{item.employeeCount}</div>
              <div className="col-span-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => onViewCuadrante ? onViewCuadrante(item.id, true) : setPreviewId(item.id)}><Eye className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onEditCuadrante ? onEditCuadrante(item.id) : (onViewCuadrante && onViewCuadrante(item.id, false))}><Edit className="w-4 h-4" /></Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost"><Copy className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar duplicación</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que quieres duplicar el horario "{item.name}"? Se creará una copia en modo borrador.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDuplicate(item.id)}>Duplicar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que quieres eliminar el horario "{item.name}"? Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!previewId} onOpenChange={() => setPreviewId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del Horario</DialogTitle>
          </DialogHeader>
          {(() => {
            const item = data.find(d => d.id === previewId);
            if (!item) return null;
            return (
              <div className="space-y-2 text-sm">
                <div className="font-semibold">{item.name}</div>
                <div>Periodo: {item.month} {item.year}</div>
                <div>Estado: {item.status}</div>
                <div>Empleados: {item.employeeCount}</div>
                <div>Creado: {item.createdAt.toLocaleDateString()}</div>
                <div>Actualizado: {item.updatedAt.toLocaleDateString()}</div>
                {item.description && <div className="text-muted-foreground">{item.description}</div>}
                <div className="pt-3 flex justify-end">
                  <Button size="sm" onClick={() => setPreviewId(null)}>Cerrar</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
